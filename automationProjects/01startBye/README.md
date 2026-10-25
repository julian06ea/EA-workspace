# start & bye

Two zsh scripts made by Claude for macOS that open and close my workday. Type one word in Terminal and the Mac sets itself up for what I'm doing, or packs everything away and locks.

## What they do

### `start.command`
- Greets you based on the time of day and asks: **Study**, **Personal**, **Status** or **Terminal**.
- **Study**: pick one of four courses. The right apps open in fullscreen: VS Code in the oblig/practice folder, Chrome on the course page, GeoGebra + Claude for math. It can also create today's Word note (`COURSE_dd.mm.yy.docx`) in the course's folder.
- **Personal**: Finn.no (boats / MC / car), a news site and the weather on yr.no, each in its own tab.
- **Status**: date, week, Oslo weather, next oblig deadline (red countdown under 3 days), next work shift, semester progress bar, study hours this week, git status, battery and unread mail. Live T-bane departures from Entur show along the bottom.
- Starts a study timer for the course you picked, which `bye` stops later.
- Moves back to desktop 1 and closes itself after 10 seconds.

### `bye.command`
- Saves and closes Word documents, runs *Save All* in VS Code, closes Chrome, then quits every other app with a Dock icon (Finder and Terminal stay open).
- Stops the study timer and shows how long you studied today.
- Offers to commit + push unsaved work in `EA-workspace` (no answer in 15 s = skip).
- Shows the first thing in tomorrow's calendar and your next shift.
- Locks the Mac after a 10-second countdown.

## How it saves ~30 seconds (or more)

On a busy day, like a lecture, then a shift, then an oblig at night, the setup and cleanup are the parts nobody thinks about:

| By hand | With the scripts |
|---|---|
| Open VS Code, find the oblig folder, open Chrome, find the course page, fullscreen each one | `start` → `1` → `1` |
| Make a new Word doc, name it with the date, save it in the right folder | answer **Yes** to "Do you need a document?" |
| Check calendar, shift app, Mail and the weather in separate apps | **Status** shows it all on one screen |
| Save in each app, quit each app, remember to push, check tomorrow, lock | `bye` |

That's about 30 seconds saved every time, several times a day. The bigger win is starting work without detours: you sit down, type `start` and you're in the right place.

## Setup

1. Put the scripts in your home folder and make them executable:
   ```zsh
   cp start.command bye.command ~/
   chmod +x ~/start.command ~/bye.command
   ```
2. Install the helpers:
   ```zsh
   brew install figlet ical-buddy
   ```
   (`python3` ships with the Xcode Command Line Tools.)
3. Give Terminal permission under **System Settings → Privacy & Security → Accessibility** and **Automation** (needed for fullscreen, Cmd+Q and Save All). Run `zsh ~/bye.command --setup` once and press **Allow** on every popup. `zsh ~/bye.command --list` does a dry run and shows what would be closed.
4. Change the settings at the top of each file to match your setup: courses and their links, the `UIO` folder, `SHIFT_CAL` (the name of your shift calendar), `REPOS`, `KEEP` (apps that should never be closed) and the train stations.

## Shortcuts

### Typed shortcut in Terminal (alias)
Add these lines to `~/.zshrc`:
```zsh
alias start='open ~/start.command; exit'
alias bye='zsh ~/bye.command'
```
Run `source ~/.zshrc` (or open a new Terminal window). After that, type `start` or `bye` and press Enter.

- `start` opens the script in a fresh Terminal window and closes the current one.
- `bye` runs in the current window, because it needs Terminal open for the countdown and the lock.

### Keyboard shortcut from anywhere (optional)
1. Open **Shortcuts.app** → **+** → add the action **Run Shell Script** with `open ~/start.command` (or `open ~/bye.command`).
2. In the shortcut's details (ⓘ), choose **Add Keyboard Shortcut** and press a combination, e.g. `⌃⌥S` for start and `⌃⌥B` for bye.

You can also double-click a `.command` file in Finder, or drag it to the Dock.
