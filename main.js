const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');

let analyzerWindow = null;

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

    ipcMain.on('set-small-mode', () => {
        const screenWidth = screen.getPrimaryDisplay().workArea.width;
        const [_, h] = win.getSize();
        win.setBounds({ x: screenWidth - 240, y: 0, width: 240, height: h });
    });

    ipcMain.on('set-normal-mode', () => {
        const screenWidth = screen.getPrimaryDisplay().workArea.width;
        const [_, h] = win.getSize();
        win.setBounds({ x: screenWidth - 300, y: 0, width: 300, height: h });
    });

    ipcMain.on('set-always-on-top', (event, value) => {
        win.setAlwaysOnTop(!!value);
    });

    ipcMain.on('restore-preferences', (_event, prefs) => {
        const bounds = win.getBounds();
        const currentDisplay = screen.getDisplayMatching(bounds);
        const screenWidth = currentDisplay.workArea.width;
        const screenX = currentDisplay.workArea.x;
        const [_, h] = win.getSize();

        if (prefs.compactMode) {
            win.setBounds({ x: screenX + screenWidth - 240, y: 0, width: 240, height: h });
        } else {
            win.setBounds({ x: screenX + screenWidth - 300, y: 0, width: 300, height: h });
        }

        win.setAlwaysOnTop(!!prefs.alwaysOnTop);
    });


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

    ipcMain.handle('open-log-analyzer', () => {
        if (analyzerWindow && !analyzerWindow.isDestroyed()) {
            analyzerWindow.focus();
            return;
        }

        analyzerWindow = new BrowserWindow({
            width: 900,
            height: 600,
            title: 'Log Analyzer',
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                contextIsolation: true,
                nodeIntegration: false
            }
        });

        analyzerWindow.loadFile('renderer/analyzer.html');

        if (app.isPackaged) {
            analyzerWindow.removeMenu();
        }

        analyzerWindow.on('closed', () => {
            analyzerWindow = null;
        });
    });


    ipcMain.handle('get-log-files', async () => {
        const logsDir = path.join(app.getPath('userData'), 'logs');
        if (!fs.existsSync(logsDir)) return [];
        return fs.readdirSync(logsDir).filter(f => f.endsWith('.json'));
    });

    ipcMain.handle('read-log-file', async (_event, filename) => {
        const logsDir = path.join(app.getPath('userData'), 'logs');
        const filePath = path.join(logsDir, filename);
        if (!fs.existsSync(filePath)) return null;
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    });

    ipcMain.handle('delete-log', async (_event, fileName) => {
        const dir = path.join(app.getPath('userData'), 'logs');
        const fullPath = path.join(dir, fileName);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
