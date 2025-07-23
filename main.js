const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');

function getPeoplePath() {
    const userPath = app.getPath('userData');
    const target = path.join(userPath, 'people.json');
    const defaultPath = path.join(__dirname, 'people.json');

    if (!fs.existsSync(target)) {
        fs.copyFileSync(defaultPath, target);
    }
    return target;
}

function createWindow() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const screenWidth = primaryDisplay.workArea.width;
    const screenHeight = primaryDisplay.workArea.height;

    const win = new BrowserWindow({
        width: 300,
        height: screenHeight,
        icon: path.join(__dirname, 'assets', 'attendance_icon.ico'),
        x: screenWidth - 300,
        y: 0,
        alwaysOnTop: true,
        resizable: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    win.loadFile('renderer/index.html');
    if (app.isPackaged) {
        win.removeMenu();
    }
}

app.whenReady().then(() => {
    createWindow();

    ipcMain.handle('load-people', async () => {
        const peoplePath = getPeoplePath();
        const data = fs.readFileSync(peoplePath, 'utf-8');
        return JSON.parse(data);
    });

    ipcMain.handle('save-people', async (_event, peopleArray) => {
        const peoplePath = getPeoplePath();
        fs.writeFileSync(peoplePath, JSON.stringify(peopleArray, null, 2), 'utf-8');
    });

    ipcMain.handle('save-log', async (_event, data) => {
        const dir = path.join(app.getPath('userData'), 'logs');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        const timestamp = new Date().toISOString().replace(/[:]/g, '-');
        const filename = path.join(dir, `log-${timestamp}.json`);
        fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf-8');
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
