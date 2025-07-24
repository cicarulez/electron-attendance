
# Daily Attendance

💬 **Daily Attendance** is a lightweight Electron-based desktop app for tracking attendance and speaking turns during daily stand-up meetings.

---

## 📋 Features

- Track **presence** and **absence** of team members
- Manage **speaking order** with timestamps
- Add **notes** for each speaker
- Edit the **participants list** directly from the app
- Automatically **save logs** (as JSON) at the end of each session
- Compact interface, always on top
- Starts docked to the **right side** of the screen
- **Settings persistence**: remembers dark mode, compact mode, and always-on-top between sessions
- **Smart window behavior**: always re-anchors to the right side when changing mode
- **Improved editing**: edits to names are preserved even when adding new participants

---

## 🖼️ Screenshot

![Screenshot](https://raw.githubusercontent.com/cicarulez/electron-attendance/main/docs/screenshot_v1.1.0.png)

---

## 🚀 Run in Development

Make sure you have [Node.js](https://nodejs.org/) installed, then:

```bash
npm install
npm run start
```

---

## 🛠️ Build for Windows

To generate a standalone `.exe` installer:

```bash
npm run build
```

The output will be available in the `dist/` folder.

> ✅ Make sure your `package.json` includes the required `build` section with app name, icon, and metadata.

---

## 📁 Logs

After each session, a JSON log is saved containing:
- Participant name and ID
- Presence status
- Speaking order
- Speaking timestamp
- Notes (if provided)

---

## 👤 Author

Developed by **Davide Cappa**

---

## 📄 License

This project is licensed under the [MIT License](LICENSE)
