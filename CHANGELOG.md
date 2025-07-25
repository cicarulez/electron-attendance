# 📦 Changelog

## [1.2.0] - 2025-07-25

### Features

- **Logs**
  - Calculate and store duration for each speaker based on speaking order and timestamps
  - Save total session duration
  - Skip saving log if no one is marked as present

- **Participants**
  - Ensure all participant IDs are unique on load
  - Auto-generate missing or duplicate IDs and persist updated list

- **UI**
  - Replace “Close” button with “Save and Close” for clarity
  - Add responsive dropdown (hamburger) menu for compact UIs
  - Include toggles for dark mode, compact mode, and always-on-top
  - Apply dark and compact mode styles consistently across all views, including analyzer

- **Log Analyzer**
  - Replace filenames with readable summaries: timestamp, number of present people, and session duration
  - View full log content in a read-only modal on click
  - Add delete button with confirmation modal for each log entry

## [1.1.0] - 2025-07-24

### Features

- **Settings Persistence**
  - Restores dark mode, compact mode and always-on-top on app launch
  - Added communication from renderer to main process to apply saved preferences
- **Window Behavior**
  - The window now always anchors to the right edge when switching between compact and normal mode
- **Editor Improvements**
  - Editing names in the list is now preserved when adding new people

## [1.0.0] - 2025-07-23

### Features

- **Intervention Notes**
    - Added support for editable notes per intervention
    - Clicking the intervention number opens a modal to enter a note
    - Notes are saved in session and included in the final log file
    - Tooltip displays the note or suggests to add one
