#!/usr/bin/env python3
"""
NicheNotes - Auto-enhance lecture notes with AI
Finds errors in your notes (marks red) and adds missing points (marks purple)
Uses local Whisper for transcription + Claude API for analysis
"""
import sys, json, subprocess
from pathlib import Path
from docx import Document
from docx.shared import RGBColor
from getpass import getpass
from datetime import datetime
from difflib import SequenceMatcher
import anthropic

# ===== SETUP: Paths and Configuration =====
# All files stored in iCloud at UiO/H26
BASE_PATH = Path.home() / "Library" / "Mobile Documents" / "com~apple~CloudDocs" / "UiO" / "H26"
CLASS_REC_PATH = BASE_PATH / "ClassREC"  # M4A recordings stored here

# Subject folders - your notes stored by subject code
# Script will ALWAYS find the NEWEST file in each folder
SUBJECT_FOLDERS = {
    "IN1000": BASE_PATH / "IN1000",
    "IN1020": BASE_PATH / "IN1020",
    "IN1080": BASE_PATH / "IN1080",
    "EXPHIL03": BASE_PATH / "EXPHIL03",
}

# ===== COLOR PALETTE (Hex to RGB) =====
COLOR_ERROR_RED = RGBColor(220, 38, 38)        # #DC2626 - deep red
COLOR_ADDITION_PURPLE = RGBColor(139, 92, 246) # #8B5CF6 - niche purple
COLOR_EXPLANATION_GRAY = RGBColor(156, 163, 175) # #9CA3AF - silver
COLOR_SUMMARY_GRAY = RGBColor(156, 163, 175)  # #9CA3AF - silver for summary
COLOR_SLOGAN_PURPLE = RGBColor(139, 92, 246)  # #8B5CF6 - purple for slogan

MAX_GAPS = 15  # Max gaps to add per session

# ===== FUNCTION: Extract text from Word doc =====
def extract_notes_text(doc):
    """Read all paragraphs from .docx file and return as plain text"""
    paragraphs = []
    for para in doc.paragraphs:
        if para.text.strip():  # Skip empty paragraphs
            paragraphs.append(para.text)
    return '\n'.join(paragraphs)  # Join with newlines for readability

# ===== FUNCTION: Use Claude API to analyze notes vs transcript =====
def analyze_notes(notes_text, transcript_text, subject, api_key):
    """
    Send notes + transcript to Claude API
    Get back: errors (red) and gaps (blue) as JSON
    Ranks gaps by importance, returns top 15
    """
    client = anthropic.Anthropic(api_key=api_key)
    
    # Build prompt that asks Claude to find errors and missing points
    prompt = f"""Du er lærer som sjekker studentnotatene.

OPPGAVE: 
1. Find MAX 15 VIKTIGE MANGLER (ting studenten glemte fra forelesningen)
   RANGER ETTER VIKTIGHET - de mest kritiske først
2. Find FAKTISKE FEIL i notatene (ting som er skrevet feil/misforstått)

STUDENT NOTATER:
{notes_text}

---

FULL FORELESNING:
{transcript_text}

---

REGLER:
1. MANGLER: Velg de 15 VIKTIGSTE manglende punktene. Ranger dem efter viktighet.
2. FEIL: Identify setninger som er faktisk feil eller misforstått
3. For HVER mangling: skriv den eksakte setningen fra notatene hvor info skal legges til
4. Ignorer små detaljer - fokuser BARE på hovedkonsepter og definisjoner

SVAR BARE SOM JSON:
{{
  "errors": [
    {{
      "location": "eksakt setning fra notatene som er feil",
      "problem": "kort: hva som er feil"
    }}
  ],
  "gaps": [
    {{
      "location": "eksakt setning fra notatene hvor info mangler",
      "addition": "kort ekstra info (maks 15 ord)"
    }}
  ]
}}"""

    try:
        # Call Claude API with Norwegian prompt
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",  # Fast + cheap model
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}]
        )
        
        # Extract JSON from response
        response_text = message.content[0].text
        start = response_text.find('{')
        end = response_text.rfind('}') + 1
        if start >= 0 and end > start:
            return json.loads(response_text[start:end])  # Parse JSON
        return {"errors": [], "gaps": []}
    except Exception as e:
        print(f"  ❌ API Error: {e}")
        return {"errors": [], "gaps": []}

# ===== FUNCTION: Fuzzy match text to paragraph =====
def find_best_match(location, paragraphs, threshold=0.85):
    """
    Find the best matching paragraph using fuzzy string matching
    Returns: (paragraph object, similarity_score) or (None, 0) if no match
    threshold: 0-1, higher = stricter matching (0.85 = 85% similar)
    """
    best_match = None
    best_score = 0
    
    for para in paragraphs:
        # Compare location to full paragraph text
        similarity = SequenceMatcher(None, location.lower(), para.text.lower()).ratio()
        
        # Keep track of best match
        if similarity > best_score:
            best_score = similarity
            best_match = para
    
    # Only return if above threshold
    return (best_match, best_score) if best_score >= threshold else (None, best_score)

# ===== FUNCTION: Mark errors in red with gray explanations =====
def mark_errors_red(doc, errors):
    """
    Find paragraphs with errors and color them RED
    Add gray explanation text after each error
    Uses fuzzy matching (85% similarity) to find paragraphs
    """
    marked = 0
    
    for error in errors:
        location = error.get("location", "").strip()  # Sentence to find
        problem = error.get("problem", "").strip()  # Explanation
        if not location:
            continue
        
        # Use fuzzy matching to find best paragraph
        best_para, score = find_best_match(location, doc.paragraphs, threshold=0.85)
        
        if best_para:
            # Color ALL text in this paragraph red
            for run in best_para.runs:
                run.font.color.rgb = COLOR_ERROR_RED  # #DC2626
            
            # Add gray explanation
            if problem:
                explanation_run = best_para.add_run(f" [❌ {problem}]")
                explanation_run.font.color.rgb = COLOR_EXPLANATION_GRAY  # #9CA3AF
                explanation_run.italic = True
            
            marked += 1
    
    return marked  # Return count of paragraphs marked

# ===== FUNCTION: Add missing info in purple =====
def add_gaps_inline(doc, gaps):
    """
    Find paragraphs with missing info and ADD purple text on the SAME LINE
    Example: "Fotosyntese er..." becomes "Fotosyntese er... [➕ bruker lys og CO2]"
    Uses fuzzy matching (85% similarity) to find paragraphs
    """
    added = 0
    
    for gap in gaps:
        location = gap.get("location", "").strip()  # Find this sentence
        addition = gap.get("addition", "").strip()  # Add this info
        
        if not location or not addition:
            continue
        
        # Use fuzzy matching to find best paragraph
        best_para, score = find_best_match(location, doc.paragraphs, threshold=0.85)
        
        if best_para:
            # Append purple text to END of this paragraph (same line)
            purple_run = best_para.add_run(f" [➕ {addition}]")
            purple_run.font.color.rgb = COLOR_ADDITION_PURPLE  # #8B5CF6
            purple_run.italic = True  # Make it italic to show it's added
            added += 1
    
    return added  # Return count of additions made

# ===== FUNCTION: Add summary footer to document =====
def add_summary_footer(doc, error_count, gap_count):
    """
    Add a professional summary at the end of the document
    Shows what was updated, timestamp, and slogan
    Summary in silver, slogan in purple
    """
    # Add some space
    doc.add_paragraph()
    
    # Border line
    border_run = doc.add_paragraph("─────────────────────────────").runs[0]
    border_run.font.color.rgb = COLOR_SUMMARY_GRAY
    
    # Title
    title_run = doc.add_paragraph("📝 Niche Notes Update").runs[0]
    title_run.font.color.rgb = COLOR_SUMMARY_GRAY
    title_run.font.bold = True
    
    # Border line
    border_run = doc.add_paragraph("─────────────────────────────").runs[0]
    border_run.font.color.rgb = COLOR_SUMMARY_GRAY
    
    # Error count (always show, even if 0)
    error_line = doc.add_paragraph(f"✅ {error_count} errors marked (deep red with explanations)")
    error_line.runs[0].font.color.rgb = COLOR_SUMMARY_GRAY
    
    # Gap count
    gap_line = doc.add_paragraph(f"✅ {gap_count} gaps added (purple inline)")
    gap_line.runs[0].font.color.rgb = COLOR_SUMMARY_GRAY
    
    # Timestamp
    timestamp = datetime.now().strftime("%d.%m.%y %H:%M")
    time_line = doc.add_paragraph(f"🕐 Updated: {timestamp}")
    time_line.runs[0].font.color.rgb = COLOR_SUMMARY_GRAY
    
    # Border line
    border_run = doc.add_paragraph("─────────────────────────────").runs[0]
    border_run.font.color.rgb = COLOR_SUMMARY_GRAY
    
    # Slogan (purple)
    slogan_para = doc.add_paragraph("Never miss. Always niche. 🎯")
    slogan_run = slogan_para.runs[0]
    slogan_run.font.color.rgb = COLOR_SLOGAN_PURPLE  # #8B5CF6
    slogan_run.font.bold = True

# ===== FUNCTION: Find newest file in folder =====
def find_latest_file(folder, pattern):
    """
    Find the NEWEST file matching pattern in a folder
    Pattern example: "EXPHIL03_*.m4a" finds all EXPHIL03 recordings
    Returns: newest file (sorted by MODIFICATION TIME, not alphabetically)
    
    IMPORTANT: This is how it finds your latest lecture recording
    even if you have multiple files in the folder!
    """
    if not folder or not folder.exists():
        return None
    files = list(folder.glob(pattern))
    # Sort by modification time (mtime) — most recent last
    return max(files, key=lambda f: f.stat().st_mtime) if files else None

# ===== FUNCTION: Transcribe M4A to text using Whisper =====
def transcribe_audio(audio_path):
    """
    Use local Whisper AI to convert M4A recording to .txt transcript
    - Checks if .txt already exists (skips if it does)
    - Runs Whisper command locally with Norwegian language
    - Takes 10-30 minutes depending on lecture length
    """
    txt_path = audio_path.with_suffix('.txt')  # Output filename
    
    # Skip if transcript already exists
    if txt_path.exists():
        print(f"  ✓ Transcript already exists")
        return txt_path
    
    print(f"  🎙️  Transcribing (this takes 10-30 min)...")
    
    try:
        # Call Whisper command line tool
        result = subprocess.run(
            ['whisper', str(audio_path), 
             '--model', 'base',  # Fastest model
             '--language', 'no',  # Norwegian language
             '--output_format', 'txt',  # Output as text
             '--output_dir', str(audio_path.parent)],  # Save in same folder
            capture_output=True,
            text=True,
            timeout=3600  # Allow up to 1 hour
        )
        
        if result.returncode == 0:
            print(f"  ✅ Transcription done")
            return txt_path
        else:
            print(f"  ❌ Whisper error: {result.stderr}")
            return None
    except FileNotFoundError:
        print(f"  ❌ Whisper not found. Run: pip install openai-whisper")
        return None
    except subprocess.TimeoutExpired:
        print(f"  ❌ Transcription took too long")
        return None
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return None

# ===== FUNCTION: Main workflow - tie everything together =====
def process_subject(subject, api_key):
    """
    COMPLETE WORKFLOW:
    1. Find newest M4A recording
    2. Transcribe it (if not already transcribed)
    3. Find newest notes document
    4. Analyze with Claude
    5. Mark errors in red
    6. Add gaps in purple
    7. Add summary footer
    8. Save and exit
    """
    print(f"\n📚 {subject}\n")
    
    # STEP 1: Find newest M4A recording for this subject
    # Uses find_latest_file to get the NEWEST file matching pattern
    audio_path = find_latest_file(CLASS_REC_PATH, f"{subject}_*.m4a")
    if not audio_path:
        print(f"  ❌ No M4A recording found")
        print(f"     Place in: {CLASS_REC_PATH}/{subject}_DATE.m4a")
        return False
    
    print(f"  ✓ Recording: {audio_path.name}")
    
    # STEP 2: Transcribe M4A to TXT (skips if .txt already exists)
    transcript_path = transcribe_audio(audio_path)
    if not transcript_path:
        return False
    
    # STEP 3: Find newest notes document for this subject
    # Also uses find_latest_file - gets NEWEST .docx
    notes_path = find_latest_file(SUBJECT_FOLDERS[subject], f"{subject}_*.docx")
    if not notes_path:
        print(f"  ❌ No notes found")
        return False
    
    print(f"  ✓ Notes: {notes_path.name}\n")
    
    # STEP 4: Read both files
    print(f"  Reading...")
    with open(transcript_path, 'r', encoding='utf-8') as f:
        transcript_text = f.read()  # Full lecture transcript
    
    doc = Document(notes_path)
    notes_text = extract_notes_text(doc)  # Your notes as text
    
    # STEP 5: Send to Claude API for analysis
    print(f"  🤖 Analyzing...\n")
    analysis = analyze_notes(notes_text, transcript_text, subject, api_key)
    
    # Get results (limited to max 15 gaps, ranked by Claude)
    errors = analysis.get("errors", [])
    gaps = analysis.get("gaps", [])[:MAX_GAPS]  # LIMIT: Max 15 gaps
    
    # Show what was found
    print(f"  Results:")
    print(f"    • {len(errors)} errors found")
    print(f"    • {len(gaps)} gaps found\n")
    
    # STEP 6: Apply changes to document
    if errors:
        marked = mark_errors_red(doc, errors)
        print(f"  🔴 Marked {marked} errors in red")
    else:
        marked = 0
    
    if gaps:
        added = add_gaps_inline(doc, gaps)
        print(f"  🟣 Added {added} points in purple")
    else:
        added = 0
    
    # STEP 7: Add summary footer
    add_summary_footer(doc, marked, added)
    
    # STEP 8: Save updated document
    doc.save(notes_path)
    print(f"\n  ✅ Saved: {notes_path.name}\n")
    return True

# ===== FUNCTION: Entry point - handle command line args =====
def main():
    """
    Handles running the script from terminal
    Prompts for Anthropic API key at start
    Usage: python NicheNotes.py SUBJECT_CODE
    
    Example:
        python NicheNotes.py EXPHIL03
        python NicheNotes.py IN1080
    """
    # Check if user provided a subject
    if len(sys.argv) < 2:
        print("\nUsage: python NicheNotes.py SUBJECT")
        print("\nSubjects: IN1000, IN1020, IN1080, EXPHIL03")
        print("\nExample: python NicheNotes.py IN1080\n")
        sys.exit(1)  # Exit with error code
    
    # Get subject from command line and make uppercase
    subject = sys.argv[1].upper()
    
    # Validate that subject exists in our config
    if subject not in SUBJECT_FOLDERS:
        print(f"\n❌ Unknown subject: {subject}")
        print("Valid: IN1000, IN1020, IN1080, EXPHIL03\n")
        sys.exit(1)  # Exit with error code
    
    # Prompt for API key (getpass = hidden input)
    print("\n🔑 Enter your Anthropic API key:")
    api_key = getpass("➜ ")
    
    if not api_key:
        print("❌ API key required\n")
        sys.exit(1)
    
    # Run the main workflow
    success = process_subject(subject, api_key)
    
    # Exit with appropriate code (0=success, 1=failure)
    sys.exit(0 if success else 1)

# ===== RUN =====
# This runs the script when you execute it from terminal
if __name__ == "__main__":
    main()
