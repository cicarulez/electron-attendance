# 📦 Changelog

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
