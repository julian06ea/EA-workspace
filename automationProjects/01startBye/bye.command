#!/bin/zsh

LOG=/tmp/bye.log
: > "$LOG"

# Apps that must stay open (bundle IDs). Everything else with a Dock icon gets quit.
# To find an app's ID:  osascript -e 'id of app "Spotify"'
KEEP=("com.apple.finder" "com.apple.Terminal")

# After three polite tries, force-quit whatever is still open (unsaved changes in such apps are lost).
# Set to false to only ever ask nicely.
FORCE=false

# Study-time tracking, shared with start.command
STUDY_DIR="$HOME/.study"

# Repos to check for unsaved work before locking
REPOS=("$HOME/EA-workspace")

# Calendar with your work shifts (same as in start.command)
SHIFT_CAL="Work shifts"

hm() {  # $1 = minutes -> "2h 05m" / "45m"
  if (( $1 >= 60 )); then printf "%dh %02dm" $(( $1 / 60 )) $(( $1 % 60 ))
  else printf "%dm" "$1"
  fi
}

# PIDs of this script and everything above it (shell, login, the Terminal app itself)
ANC=()
p=$$
while [[ -n $p ]] && (( p > 1 )); do
  ANC+=("pid:$p")
  p=$(ps -o ppid= -p "$p" 2>/dev/null | tr -d ' ')
done

sweep() {  # $1 = quit | keys | force | setup | list. Prints the names of the apps it found (Dock apps, minus KEEP)
  osascript -l JavaScript - "$1" "${KEEP[@]}" "${ANC[@]}" 2>>"$LOG" <<'JS'
function run(argv) {
  ObjC.import("AppKit");
  var mode = argv[0];
  var keep = argv.slice(1);
  var apps = $.NSWorkspace.sharedWorkspace.runningApplications;
  var names = [];
  for (var i = 0; i < apps.count; i++) {
    var a = apps.objectAtIndex(i);
    if (a.activationPolicy != 0) continue;
    var bid = ObjC.unwrap(a.bundleIdentifier);
    var nm = ObjC.unwrap(a.localizedName);
    if (keep.indexOf(bid) >= 0) continue;
    if (keep.indexOf("pid:" + a.processIdentifier) >= 0) continue;
    if (nm === "Terminal" || nm === "Finder") continue;
    names.push(nm);
    if (mode === "quit") a.terminate();
    if (mode === "force") a.forceTerminate();
    if (mode === "setup") {
      try {
        Application(bid).name();
        names[names.length - 1] = nm + ": ok";
      } catch (e) {
        var msg = String(e);
        names[names.length - 1] = nm + ": " + ((msg.indexOf("1743") >= 0 || msg.toLowerCase().indexOf("not authorized") >= 0) ? "NOT ALLOWED" : "ok");
      }
    }
    if (mode === "keys") {
      a.activateWithOptions($.NSApplicationActivateIgnoringOtherApps);
      for (var t = 0; t < 10 && !a.isActive; t++) $.NSThread.sleepForTimeInterval(0.3);
      if (a.isActive) {
        Application("System Events").keystroke("q", {using: "command down"});
        $.NSThread.sleepForTimeInterval(1);
      }
    }
  }
  if (mode === "quit" || mode === "force") $.NSThread.sleepForTimeInterval(1.5);
  return names.join(mode === "setup" ? "\n" : ", ");
}
JS
}

running() {  # $1 = app name
  [[ $(osascript -e "application \"$1\" is running" 2>>"$LOG") == true ]]
}

if [[ $1 == --setup ]]; then   # asks macOS for permission app by app, and shows who is still blocked
  echo "Press Allow on every popup..."
  sweep setup
  exit
fi

if [[ $1 == --list ]]; then   # dry run: just show what would be quit
  echo "Would quit: $(sweep list)"
  exit
fi

clear
printf "\e[1;38;5;208m"; figlet -w 300 "Bye  King"; printf "\e[0m"
printf "\e[38;5;250m"; printf '%.0s- ' {1..50}; printf "\e[0m\n"
printf "\e[1;38;5;208mSaving and closing everything, give me a sec!\e[0m\n"

# Word: save each document, close it, quit
if running "Microsoft Word"; then
  osascript <<'EOF' 2>>"$LOG"
with timeout of 30 seconds
  tell application "Microsoft Word"
    repeat (count of documents) times
      try
        set d to document 1
        save d
        close d saving yes
      end try
    end repeat
    try
      quit saving yes
    end try
  end tell
end timeout
EOF
fi

# VS Code: Save All, then quit
if running "Visual Studio Code"; then
  osascript <<'EOF' 2>>"$LOG"
tell application "Visual Studio Code" to activate
delay 1
tell application "System Events"
  if bundle identifier of (first process whose frontmost is true) is "com.microsoft.VSCode" then
    keystroke "s" using {command down, option down}
  end if
end tell
delay 1
tell application "Visual Studio Code" to quit
EOF
fi

# Chrome: close every window and quit
if running "Google Chrome"; then
  osascript <<'EOF' 2>>"$LOG"
tell application "Google Chrome"
  close every window
  try
    quit
  end try
end tell
EOF
fi

# Everything else: close Finder windows, then politely quit every other app with a Dock icon
osascript -e 'tell application "Finder" to close every window' 2>>"$LOG"
for round in 1 2 3; do
  sweep quit >/dev/null
  for i in 1 2 3; do
    [[ -z $(sweep list) ]] && break 2
    sleep 1
  done
done
left=$(sweep list)

if [[ -n $left ]]; then   # some apps ignore the quit request, so press Cmd+Q in them like you would
  sweep keys >/dev/null
  for i in 1 2 3; do
    [[ -z $(sweep list) ]] && break
    sleep 1
  done
  left=$(sweep list)
fi

forced=""
if [[ -n $left && $FORCE == true ]]; then
  forced=$left
  sweep force >/dev/null
  sleep 2
  left=$(sweep list)
fi

# Give macOS a moment to drop the empty fullscreen desktops, then come back here
sleep 2
osascript -e 'tell application "Terminal" to activate' 2>>"$LOG"

if [[ -z $left ]]; then
  printf "\e[1;38;5;208m100%% successful ✔\e[0m\n"
else
  printf "\e[1;38;5;208mAlmost. Still open: %s\e[0m\n" "$left"
  printf "\e[38;5;240m(it didn't quit when asked)\e[0m\n"
fi
[[ -n $forced ]] && printf "\e[38;5;240mforce-quit: %s\e[0m\n" "$forced"
[[ -s "$LOG" ]] && printf "\e[38;5;240msomething complained, see /tmp/bye.log\e[0m\n"
echo

O=$'\e[38;5;208m' G=$'\e[38;5;250m' R=$'\e[0m'

# Study time: close the session start.command opened and add it to the log
if [[ -f $STUDY_DIR/session ]]; then
  IFS=$'\t' read -r s_course s_start < "$STUDY_DIR/session"
  rm -f "$STUDY_DIR/session"
  s_min=$(( ($(date +%s) - s_start) / 60 ))
  if (( s_min > 12 * 60 )); then
    printf "${G}Skipped an old %s session from %s (no bye that day)${R}\n" "$s_course" "$(date -r "$s_start" '+%a %H:%M')"
  elif (( s_min >= 1 )); then
    printf '%s\t%s\t%s\t%s\n' "$(date -r "$s_start" +%F)" "$(date -r "$s_start" +%G-W%V)" "$s_course" "$s_min" >> "$STUDY_DIR/log.tsv"
    today=$(awk -F'\t' -v d="$(date +%F)" '$1 == d { t += $4 } END { print t + 0 }' "$STUDY_DIR/log.tsv")
    printf "${O}You studied %s for %s today${R}" "$s_course" "$(hm "$s_min")"
    (( today > s_min )) && printf "${G}  (%s in total)${R}" "$(hm "$today")"
    echo
  fi
fi

# Git: offer to commit + push anything left behind (no answer in 15 s = leave it)
export GIT_TERMINAL_PROMPT=0
for repo in "${REPOS[@]}"; do
  [[ -d $repo/.git ]] || continue
  changed=$(git -C "$repo" status --porcelain 2>>"$LOG" | wc -l | tr -d ' ')
  ahead=$(git -C "$repo" rev-list --count '@{u}..HEAD' 2>/dev/null || echo 0)
  (( changed + ahead == 0 )) && continue
  printf "${O}%s:${R} %s changed, %s not pushed. Push before you go? [y/N] " "${repo:t}" "$changed" "$ahead"
  yn=""
  read -t 15 -k 1 yn
  echo
  if [[ $yn == [yY] ]]; then
    if (( changed )); then
      git -C "$repo" add -A 2>>"$LOG" &&
        git -C "$repo" commit -q -m "Auto-save from bye ($(date '+%d.%m.%y %H:%M'))" 2>>"$LOG"
    fi
    if git -C "$repo" push -q 2>>"$LOG"; then
      printf "${G}  pushed ✔${R}\n"
    else
      printf "\e[1;31m  push failed, see /tmp/bye.log${R}\n"
    fi
  fi
done

# Tomorrow: first thing in the calendar + next shift
if command -v icalBuddy >/dev/null; then
  first=$(icalBuddy -b "" -nc -ea -iep "title,datetime" -po "datetime,title" -tf "%H:%M" -df "" \
    eventsFrom:today+1 to:today+1 2>/dev/null | head -2 | sed -e 's/^ *//' -e 's/^tomorrow at //' | paste -sd' ' -)
  shift_line=$(icalBuddy -b "" -nc -iep "title,datetime" -po "datetime,title" -df "%a %d %b" -tf "%H:%M" \
    -ic "$SHIFT_CAL" eventsFrom:now to:today+60 2>/dev/null | head -2 | sed 's/^ *//' | paste -sd' ' -)
  printf "${O}Tomorrow:${R}   %s\n" "${first:-nothing in the calendar}"
  printf "${O}Next shift:${R} %s\n" "${shift_line:-no shifts coming up}"
fi
echo

for i in 10 9 8 7 6 5 4 3 2 1; do
  printf "\r\e[KLocking Mac in %s..." "$i"
  sleep 1
done
printf "\r\e[K"

osascript -e 'tell application "System Events" to keystroke "q" using {control down, command down}' 2>>"$LOG"
sleep 1
osascript -e 'tell application "Terminal" to quit' &
exit
