#!/bin/zsh

# Current semester from today's date: H (autumn) from July, V (spring) before that.
# Adjust the start/end dates here to match your school's calendar.
SEM_YEAR=$(date +%Y)
if (( $(date +%-m) >= 7 )); then
  SEM="H${SEM_YEAR[3,4]}" SEM_START="$SEM_YEAR-08-17" SEM_END="$SEM_YEAR-12-14"
else
  SEM="V${SEM_YEAR[3,4]}" SEM_START="$SEM_YEAR-01-12" SEM_END="$SEM_YEAR-06-14"
fi
UIO="$HOME/Documents/School/$SEM"   # where course folders and Word notes go

# Study-time tracking, shared with bye.command: session = what's running now, log.tsv = history
STUDY_DIR="$HOME/.study"

hm() {  # $1 = minutes -> "2h 05m" / "45m"
  if (( $1 >= 60 )); then printf "%dh %02dm" $(( $1 / 60 )) $(( $1 % 60 ))
  else printf "%dm" "$1"
  fi
}

session_close() {  # log the running session (if any) up to now
  local f="$STUDY_DIR/session" course start mins
  [[ -f $f ]] || return
  IFS=$'\t' read -r course start < "$f"
  rm -f "$f"
  mins=$(( ($(date +%s) - start) / 60 ))
  (( mins < 1 || mins > 12 * 60 )) && return   # under a minute, or a session never closed by bye
  printf '%s\t%s\t%s\t%s\n' "$(date -r "$start" +%F)" "$(date -r "$start" +%G-W%V)" "$course" "$mins" >> "$STUDY_DIR/log.tsv"
}

session_start() {  # $1 = course
  mkdir -p "$STUDY_DIR"
  session_close   # switching course mid-day: bank the previous one first
  printf '%s\t%s\n' "$1" "$(date +%s)" > "$STUDY_DIR/session"
}

study_week() {  # one bar per course for this ISO week, plus anything running now
  local O=$'\e[38;5;208m' R=$'\e[0m' week=$(date +%G-W%V) live="" lc ls
  if [[ -f $STUDY_DIR/session ]]; then
    IFS=$'\t' read -r lc ls < "$STUDY_DIR/session"
    (( $(date +%s) - ls < 12 * 3600 )) && live="$lc"$'\t'"$(( ($(date +%s) - ls) / 60 ))"
  fi
  local rows
  rows=$( { [[ -f $STUDY_DIR/log.tsv ]] && awk -F'\t' -v w="$week" '$2 == w { print $3 "\t" $4 }' "$STUDY_DIR/log.tsv"
            [[ -n $live ]] && print -r -- "$live"; } \
          | awk -F'\t' '{ m[$1] += $2 } END { for (c in m) print m[c] "\t" c }' | sort -rn)
  if [[ -z $rows ]]; then
    printf "${O}This week:${R}  nothing logged yet\n"
    return
  fi
  local max=${${(f)rows}[1]%%$'\t'*} label="This week:" mins course n bar
  while IFS=$'\t' read -r mins course; do
    n=$(( mins * 20 / (max > 0 ? max : 1) ))
    (( n < 1 )) && n=1
    bar=$(printf '%*s' "$n" '' | tr ' ' '#')
    printf "${O}%-11s${R} %-9s %-20s %s\n" "$label" "$course" "$bar" "$(hm "$mins")"
    label=""
  done <<< "$rows"
  [[ -n $live ]] && printf "%12s\e[38;5;240m(%s running now)\e[0m\n" "" "${live%%$'\t'*}"
}

fs() {  # $1 = app name: wait until its window exists, then fullscreen it
  osascript <<EOF
tell application "$1" to activate
tell application "System Events"
  repeat 80 times
    set p to first process whose frontmost is true
    if name of p is not "Terminal" then
      if (count of windows of p) > 0 then
        try
          set value of attribute "AXFullScreen" of window 1 of p to true
          exit repeat
        end try
      end if
    end if
    delay 0.2
  end repeat
end tell
EOF
  (( spaces++ ))
  sleep 3
}

ask() {  # $1 = question, rest = options; answer in $ans, then wipes itself
  local q="$1" k n
  shift
  n=$#
  printf "\e[1m%s\e[0m\n" "$q"
  k=1
  for o in "$@"; do echo "  $k) $o"; (( k++ )); done
  read "ans?> "
  printf "\e[%dA" $(( n + 2 ))
  for (( k = 0; k < n + 2; k++ )); do printf "\e[2K\n"; done
  printf "\e[%dA" $(( n + 2 ))
}

heading() {  # $1 = word shown as the big figlet heading
  printf "\e[1;38;5;141m"
  figlet -w 300 "$1"
  printf "\e[0m"
}

chrome() {
  open -na "Google Chrome" --args --new-window "$1"
}

worddoc() {  # course code
  folder="$UIO/$1"
  file="$folder/${1}_$(date +%d.%m.%y).docx"
  mkdir -p "$folder"
  if [[ ! -f "$file" ]]; then
    # builds a real Word file: three lines in Word's own "No Spacing" style
    python3 - "$file" "$(date +%d.%m.%y)" "$1" <<'PY'
import sys, zipfile
from xml.sax.saxutils import escape

path, date, subject = sys.argv[1:4]
W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'

def para(text):
    return ('<w:p><w:pPr><w:pStyle w:val="NoSpacing"/></w:pPr>'
            '<w:r><w:t xml:space="preserve">%s</w:t></w:r></w:p>' % escape(text))

document = (HEAD + '<w:document xmlns:w="%s"><w:body>' % W
            + para(date) + para(subject) + para("Dagens tema: ")
            + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>'
              '<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" '
              'w:header="708" w:footer="708" w:gutter="0"/></w:sectPr>'
            + '</w:body></w:document>')

# Font and size for the whole doc: change "Calibri" / 24 (= 12 pt) here
styles = (HEAD + '<w:styles xmlns:w="%s">' % W
          + '<w:docDefaults><w:rPrDefault><w:rPr>'
            '<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/>'
            '<w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="nb-NO"/>'
            '</w:rPr></w:rPrDefault><w:pPrDefault><w:pPr>'
            '<w:spacing w:after="160" w:line="259" w:lineRule="auto"/>'
            '</w:pPr></w:pPrDefault></w:docDefaults>'
          + '<w:style w:type="paragraph" w:default="1" w:styleId="Normal">'
            '<w:name w:val="Normal"/><w:qFormat/></w:style>'
          + '<w:style w:type="paragraph" w:styleId="NoSpacing">'
            '<w:name w:val="No Spacing"/><w:basedOn w:val="Normal"/>'
            '<w:uiPriority w:val="1"/><w:qFormat/>'
            '<w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:style>'
          + '</w:styles>')

content_types = (HEAD + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    '<Default Extension="xml" ContentType="application/xml"/>'
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
    '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
    '</Types>')

rels = (HEAD + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
    '</Relationships>')

doc_rels = (HEAD + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
    '</Relationships>')

with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
    z.writestr("[Content_Types].xml", content_types)
    z.writestr("_rels/.rels", rels)
    z.writestr("word/document.xml", document)
    z.writestr("word/_rels/document.xml.rels", doc_rels)
    z.writestr("word/styles.xml", styles)
PY
  fi
  open -a "Microsoft Word" "$file"
}

status() {  # everything about today, shown from the Status option
  local O=$'\e[38;5;208m' R=$'\e[0m'
  local REPO="$HOME/EA-workspace"
  local SHIFT_CAL="Work shifts"   # name of your shift calendar

  heading "Status"
  start_train

  local weather
  weather=$(curl -s -m 2 "wttr.in/Oslo?format=%c+%t")
  [[ -z "$weather" ]] && weather="no weather"
  printf "${O}%s${R}  |  week %s  |  Oslo %s\n" "$(date '+%a %d %b')" "$(date +%V)" "$weather"

  local deadline="" shift_line="" oblig o_title o_when o_time o_due o_left
  if command -v icalBuddy >/dev/null; then
    oblig=$(icalBuddy -b "" -nc -nrd -iep "title,datetime" \
      -po "title,datetime" -df "%Y-%m-%d" -tf "%H:%M" \
      eventsFrom:now to:today+120 2>/dev/null \
      | grep -i -m1 -A1 '^OBLIG')
    if [[ -n $oblig ]]; then
      o_title=$(sed -n 1p <<< "$oblig")
      o_when=$(sed -n '2s/^ *//p' <<< "$oblig")          # "2026-10-20 at 11:00 - 12:00"
      o_time=23:59                                          # all-day: due end of day
      [[ $o_when == *" at "* ]] && o_time=${${o_when#* at }%% *}
      o_due=$(date -j -f "%Y-%m-%d %H:%M" "${o_when%% *} $o_time" +%s 2>/dev/null)
      if [[ -n $o_due ]]; then
        o_left=$(( o_due - $(date +%s) ))
        deadline="$o_title  $(date -r "$o_due" '+%a %d %b %H:%M')"
        if (( o_left < 3 * 86400 )); then   # under 3 days: red with a countdown
          deadline=$'\e[1;31m'"$deadline  ($(( o_left / 86400 ))d $(( o_left % 86400 / 3600 ))h left)"$'\e[0m'
        else
          deadline+="  (in $(( o_left / 86400 )) days)"
        fi
      else
        deadline="$o_title $o_when"
      fi
    fi
    shift_line=$(icalBuddy -b "" -nc -iep "title,datetime" \
      -po "title,datetime" -df "%a %d %b" -tf "%H:%M" \
      -ic "$SHIFT_CAL" eventsFrom:now to:today+60 2>/dev/null \
      | head -2 | sed 's/^ *//' | paste -sd' ' -)
  else
    deadline="icalBuddy missing (brew install ical-buddy)"
    shift_line="icalBuddy missing"
  fi
  [[ -z "$deadline" ]] && deadline="nothing coming up"
  [[ -z "$shift_line" ]] && shift_line="no shifts coming up"
  printf "${O}Next oblig:${R} %s\n" "$deadline"
  printf "${O}Next shift:${R} %s\n" "$shift_line"

  local s e n pct filled bar
  s=$(date -j -f "%Y-%m-%d" "$SEM_START" +%s)
  e=$(date -j -f "%Y-%m-%d" "$SEM_END" +%s)
  n=$(date +%s)
  pct=$(( (n - s) * 100 / (e - s) ))
  (( pct < 0 )) && pct=0
  (( pct > 100 )) && pct=100
  filled=$(( pct * 20 / 100 ))
  bar=$(printf '%*s' "$filled" '' | tr ' ' '#')$(printf '%*s' "$((20 - filled))" '' | tr ' ' '-')
  printf "${O}Semester:${R}   [%s] %s%%  (%s)\n" "$bar" "$pct" "$SEM"
  study_week

  local git_line="no repo"
  if [[ -d "$REPO/.git" ]]; then
    git_line="$(git -C "$REPO" branch --show-current) ($(git -C "$REPO" status --porcelain | wc -l | tr -d ' ') changed)"
  fi
  printf "${O}Git:${R}        %s\n" "$git_line"

  local batt bpct bstate
  batt=$(pmset -g batt | grep InternalBattery)
  bpct=$(echo "$batt" | grep -Eo '[0-9]+%' | head -1)
  bstate=$(echo "$batt" | awk -F'; ' '{print $2}')
  [[ -z "$bpct" ]] && bpct="no battery"
  printf "${O}Battery:${R}    %s  (%s)\n" "$bpct" "$bstate"

  local m mail_line
  m=$(osascript -e 'with timeout of 5 seconds' \
      -e 'tell application "Mail" to get unread count of inbox' \
      -e 'end timeout' 2>/dev/null)
  if [[ $m == <-> ]]; then
    if (( m == 0 )); then mail_line="You have no new mail"
    elif (( m == 1 )); then mail_line="You have 1 new mail"
    else mail_line="You have $m new mails"
    fi
  else
    mail_line="can't reach Mail"
  fi
  printf "${O}Mail:${R}       %s\n\n" "$mail_line"

  read -k 1 "?Press any key to get to work"
  stop_train
}

barcode() {  # Barcode Oslo, bottom-left, 9 rows tall
  local -a hs=(6 9 7 9 8 9 6 8 9 7 9 7)
  local -a ws=(3 2 4 3 3 2 4 3 2 3 4 3)
  local -a st=(0 1 0 1 1 0 1 0 1 1 0 1)

  local OR=$'\e[38;5;172m'   # darker orange
  local PU=$'\e[38;5;99m'    # darker purple
  local GR=$'\e[38;5;245m'   # grey

  local -a colors
  local i
  for i in {1..12}; do
    case $(( RANDOM % 3 )) in
      0) colors[i]=$GR ;;
      1) colors[i]=$PU ;;
      2) colors[i]=$OR ;;
    esac
  done

  local top=$(( $(tput lines) - 10 )) r k w c col line

  tput sc

  for r in 9 8 7 6 5 4 3 2 1; do
    line=""

    for i in {1..12}; do
      w=${ws[i]}
      c=" "
      col=${colors[i]}

      if (( hs[i] >= r )); then
        c="█"
        (( st[i] == 1 && r % 2 == 0 )) && c="▓"
      fi

      line+="$col"

      for (( k = 0; k < w; k++ )); do
        line+="$c"
      done

      line+=" "
    done

    tput cup $(( top + 9 - r )) 2
    printf '%s\e[0m' "$line"
  done

  tput rc
}

# Live T-bane train at the bottom: one car per station, data from Entur (no key needed)
train_draw() {
  local sz rows cols
  sz=$(stty size </dev/tty 2>/dev/null)
  rows=${sz% *}; cols=${sz#* }
  [[ $rows == <-> ]] || rows=30
  [[ $cols == <-> ]] || cols=120

  python3 - "$rows" "$cols" <<'PY'
import json, os, sys, urllib.request, urllib.parse
from datetime import datetime, timezone

rows, cols = int(sys.argv[1]), int(sys.argv[2])
CLIENT = "king-startcommand"
CACHE = os.path.expanduser("~/.cache/start-train/stops.json")
# label, name to look up, car colour (same colours as the old barcode)
# Put your own metro stations here (names as Entur knows them)
STATIONS = [("STATION A", "Station A", 172), ("STATION B", "Station B", 99), ("STATION C", "Station C", 245)]
SEED = {}   # optional: {"Station A": "NSR:StopPlace:<id>"} to skip the lookup

def call(url, body=None):
    req = urllib.request.Request(url, data=body, headers={"ET-Client-Name": CLIENT, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=4) as r:
        return json.load(r)

def resolve(name):
    q = urllib.parse.urlencode({"text": name, "size": 10, "layers": "venue", "lang": "no"})
    feats = call("https://api.entur.io/geocoder/v1/autocomplete?" + q).get("features", [])
    metro = [f for f in feats if "metroStation" in (f["properties"].get("category") or [])]
    exact = [f for f in metro if f["properties"].get("name", "").strip().lower() == name.lower()]
    pick = (exact or metro or [None])[0]
    return pick["properties"]["id"] if pick else None

try:
    cache = json.load(open(CACHE))
except Exception:
    cache = {}
for k, v in SEED.items():
    cache.setdefault(k, v)

departures = [[] for _ in STATIONS]
status = "ok"
try:
    changed = False
    for _, name, _ in STATIONS:
        if name not in cache:
            sid = resolve(name)
            if sid:
                cache[name] = sid
                changed = True
    if changed:
        os.makedirs(os.path.dirname(CACHE), exist_ok=True)
        json.dump(cache, open(CACHE, "w"))
    parts = []
    for i, (_, name, _) in enumerate(STATIONS):
        if name in cache:
            parts.append('s%d: stopPlace(id: "%s") { estimatedCalls(numberOfDepartures: 20) { expectedDepartureTime realtime destinationDisplay { frontText } serviceJourney { line { publicCode transportMode } } } }' % (i, cache[name]))
    res = call("https://api.entur.io/journey-planner/v3/graphql", json.dumps({"query": "{ " + " ".join(parts) + " }"}).encode())
    now = datetime.now(timezone.utc)
    for i in range(len(STATIONS)):
        place = (res.get("data") or {}).get("s%d" % i) or {}
        for c in place.get("estimatedCalls") or []:
            line = ((c.get("serviceJourney") or {}).get("line")) or {}
            if line.get("transportMode") != "metro":
                continue
            t = datetime.fromisoformat(c["expectedDepartureTime"])
            mins = int((t - now).total_seconds() // 60)
            if mins < 0:
                continue
            departures[i].append((t, line.get("publicCode", "?"), (c.get("destinationDisplay") or {}).get("frontText", ""), mins, bool(c.get("realtime"))))
        departures[i].sort()
except Exception:
    status = "offline"

R = "\x1b[0m"
def fg(n): return "\x1b[38;5;%dm" % n
cw = max(26, (cols - 6) // 3)
inner = cw - 3
dw = max(4, inner - 12)
lift = rows * 20 // 100   # 20% of the window height up from the bottom
top = rows - 8 - lift
out = ["\x1b7\x1b[?25l"]
def put(r, c, s): out.append("\x1b[%d;%dH%s" % (r, c, s))

for i, (label, name, color) in enumerate(STATIONS):
    x = 3 + i * (cw + 1)
    c = fg(color)
    put(top, x, c + "╭" + "─" * (cw - 2) + "╮" + R)
    put(top + 1, x, c + "│ \x1b[1m" + label[:inner].ljust(inner) + R + c + "│" + R)
    for j in range(3):
        if j < len(departures[i]):
            _, ln, dest, mins, rt = departures[i][j]
            m = ("now" if mins == 0 else "%d min" % mins)
            if not rt:
                m = "~" + m
            text = "%2s %s %7s" % (ln[:2], dest[:dw].ljust(dw), m)
        else:
            text = ("no departures" if status == "ok" else "offline") if j == 0 else ""
        put(top + 2 + j, x, c + "│ " + fg(250) + text[:inner].ljust(inner) + c + "│" + R)
    put(top + 5, x, c + "╰" + "─" * (cw - 2) + "╯" + R)
    put(top + 6, x, c + " (o)(o)" + " " * (cw - 14) + "(o)(o) " + R)
    if i < len(STATIONS) - 1:
        put(top + 3, x + cw, fg(240) + "═" + R)
put(top + 7, 2, fg(240) + "═" * (cols - 3) + R)
put(top + 7, max(3, cols - 14), fg(240) + " " + datetime.now().strftime("%H:%M:%S") + " " + R)
out.append("\x1b8\x1b[?25h")
sys.stdout.write("".join(out))
sys.stdout.flush()
PY
}

train_loop() {
  while true; do
    train_draw
    sleep 20
  done
}

start_train() {
  train_loop &
  train_pid=$!
}

stop_train() {
  [[ -z $train_pid ]] && return
  pkill -P $train_pid 2>/dev/null
  kill $train_pid 2>/dev/null
  wait $train_pid 2>/dev/null
  train_pid=""
}

spaces=0
summary=""
train_pid=""
trap 'stop_train' EXIT

while true; do
  clear

  h=$(date +%-H)

  if (( h < 5 )); then
    g="Still up"
  elif (( h < 12 )); then
    g="Good morning"
  elif (( h < 18 )); then
    g="Good afternoon"
  elif (( h < 22 )); then
    g="Good evening"
  else
    g="Still up"
  fi

  printf "\e[1;38;5;141m"
  figlet -w 300 "${g// /  }  King"
  printf "\e[0m"

  printf "\e[38;5;240m"
  printf '%.0s- ' {1..50}
  printf "\e[0m\n"

  barcode
  ask "What are we up to today?" Study Personal Status Terminal

  if [[ $ans == 4 ]]; then
    clear
    exec zsh -l
  fi

  [[ $ans == 3 ]] || break

  clear
  status
done

clear
if [[ $ans == 2 ]]; then
  heading "Personal"
else
  heading "Study"
fi

if [[ $ans == 2 ]]; then
  c=5
else
  ask "What are we working on?" COURSE1 COURSE2 COURSE3 COURSE4
  c=$ans
fi

vs_dir=""
vs_label=""
vs_skip=0

if [[ $c == 1 ]]; then
  ask "Code for?" Oblig Practise "Vibe code" Skip
  base="$UIO/COURSE1"

  case $ans in
    1)
      vs_dir="$base/OBLIG"
      vs_label="Oblig"
      ;;
    2)
      vs_dir="$base/Trix"
      vs_label="Practise"
      ;;
    4)
      vs_skip=1
      ;;
    *)
      vs_dir=""
      vs_label="Vibe code"
      ;;
  esac
fi

doc=0

if [[ $c == [1-4] ]]; then
  ask "Do you need a document sir?" Yes No
  [[ $ans == 1 ]] && doc=1

  courses=(COURSE1 COURSE2 COURSE3 COURSE4)
  course=${courses[c]}
  session_start "$course"
fi

if [[ $c == 5 ]]; then
  ask "What are we looking at today, sir?" Boats MC Car Default Skip

  case $ans in
    1)
      link_main="https://www.finn.no/mobility/browse/boat"
      ;;
    2)
      link_main="https://www.finn.no/mobility/browse/mc"
      ;;
    3)
      link_main="https://www.finn.no/mobility/browse/car"
      ;;
    5)
      link_main=""
      ;;
    *)
      link_main="https://www.finn.no/"
      ;;
  esac

  ask "What about today's news?" "Stavanger Aftenblad" VG Finansavisen "No news"

  case $ans in
    1)
      link_news="https://www.aftenbladet.no/"
      ;;
    2)
      link_news="https://www.vg.no/"
      ;;
    3)
      link_news="https://www.finansavisen.no/"
      ;;
    *)
      link_news=""
      ;;
  esac

  link_weather=""

  ask "Do we care about the weather?" Yes No

  if [[ $ans == 1 ]]; then
    ask "What city?" Oslo Stavanger "San Francisco" Skip

    case $ans in
      4)
        link_weather=""
        ;;
      2)
        link_weather="https://www.yr.no/nb/v%C3%A6rvarsel/daglig-tabell/1-15183/Norge/Rogaland/Stavanger/Stavanger"
        ;;
      3)
        link_weather="https://www.yr.no/nb/v%C3%A6rvarsel/daglig-tabell/2-5391959/Forente%20stater/California/San%20Francisco%20County/San%20Francisco"
        ;;
      *)
        link_weather="https://www.yr.no/nb/v%C3%A6rvarsel/daglig-tabell/1-72837/Norge/Oslo/Oslo/Oslo"
        ;;
    esac
  fi
fi

printf "\e[1;38;5;208mYou got it, give me a sec!\e[0m\n"

case $c in
  1)
    if (( vs_skip )); then
      summary="1 tab"
    else
      summary="VS Code ($vs_label) + 1 tab"

      if [[ -n $vs_dir ]]; then
        mkdir -p "$vs_dir"
        open -a "Visual Studio Code" "$vs_dir"
      else
        open -a "Visual Studio Code" --args --new-window
      fi

      fs "Visual Studio Code"
    fi

    chrome "https://example.com/course1/assignments"   # your course page
    fs "Google Chrome"
    ;;

  2)
    summary="1 tab"
    chrome "https://example.com/course2"
    fs "Google Chrome"
    ;;

  3)
    summary="GeoGebra + Claude + 1 tab"
    open -a "GeoGebra Classic 6"
    fs "GeoGebra Classic 6"

    open -a "Claude"
    fs "Claude"

    chrome "https://example.com/course3"
    fs "Google Chrome"
    ;;

  4)
    summary=""
    ;;

  5)
    tabs=0

    if [[ -n $link_main ]]; then
      chrome "$link_main"
      sleep 1
      fs "Google Chrome"
      (( tabs++ ))
    fi

    if [[ -n $link_news ]]; then
      chrome "$link_news"
      sleep 1
      fs "Google Chrome"
      (( tabs++ ))
    fi

    if [[ -n $link_weather ]]; then
      chrome "$link_weather"
      sleep 1
      fs "Google Chrome"
      (( tabs++ ))
    fi

    if (( tabs == 0 )); then
      summary="nothing to open"
    elif (( tabs == 1 )); then
      summary="1 tab opened"
    else
      summary="$tabs tabs opened"
    fi
    ;;
esac

if [[ $c == [1-4] ]]; then
  if (( doc )); then
    worddoc "$course"
    fs "Microsoft Word"
    summary="${summary:+$summary + }1 Word doc"
  fi

  if [[ -n $summary ]]; then
    summary="$summary opened"
  else
    summary="nothing to open"
  fi
fi

# back to desktop 1 (where this terminal lives) via ctrl+left
for (( i = 0; i < spaces; i++ )); do
  osascript -e 'tell application "System Events" to key code 123 using control down'
  sleep 0.8
done

printf "\e[1;38;5;208m100%% successful ✔\e[0m\n"

[[ -n "$summary" ]] && printf "\e[38;5;250m%s\e[0m\n" "$summary"

printf "\e[38;5;250mSwipe right, everything is there.\e[0m\n"

for i in 10 9 8 7 6 5 4 3 2 1; do
  printf "\r\e[KClosing in %s..." "$i"
  sleep 1
done

osascript -e 'tell application "Terminal" to quit' &
exit