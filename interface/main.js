const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Configuration for the data path
const DATA_PATH = path.join(__dirname, '../../data');
const CONFIG_PATH = path.join(__dirname, 'config.json');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        transparent: true,
        backgroundColor: '#00000000',
        frame: false, // Frameless window
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        autoHideMenuBar: true // Clean look
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));
    // mainWindow.webContents.openDevTools(); // Uncomment for debugging
}

// Helper to calculate directory size
const getAllFiles = (dirPath, arrayOfFiles) => {
    files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            arrayOfFiles.push(path.join(dirPath, "/", file));
        }
    });

    return arrayOfFiles;
};

const getDirSize = (dirPath) => {
    if (!fs.existsSync(dirPath)) return 0;

    const files = getAllFiles(dirPath);
    let totalSize = 0;

    files.forEach(filePath => {
        totalSize += fs.statSync(filePath).size;
    });

    return totalSize;
};

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers

// Get space used
ipcMain.handle('get-space-used', async () => {
    try {
        const bytes = getDirSize(DATA_PATH);
        // Convert to GB for display, but return bytes or formatted string?
        // Let's return bytes and format in renderer, or return object.
        // Requirement says: "Espaço ocupado: 2.8/10 Gb"
        // Let's return the raw byte count.
        return bytes;
    } catch (error) {
        console.error('Error calculating space:', error);
        return 0;
    }
});

// Get retention days
ipcMain.handle('get-retention-days', async () => {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            const data = fs.readFileSync(CONFIG_PATH);
            const config = JSON.parse(data);
            return config.retentionDays || 30; // Default 30
        }
    } catch (error) {
        console.error('Error reading config:', error);
    }
    return 30;
});

// Set retention days
ipcMain.handle('set-retention-days', async (event, days) => {
    try {
        let config = {};
        if (fs.existsSync(CONFIG_PATH)) {
            config = JSON.parse(fs.readFileSync(CONFIG_PATH));
        }
        config.retentionDays = days;
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving config:', error);
        return false;
    }
});

// Get backend status (Mock)
ipcMain.handle('get-backend-status', async () => {
    // In the future, this would check the connection to the C++ daemon.
    // For now, we'll simulate a connection check.
    return true; // Connected
});

// Window Controls
ipcMain.on('window-minimize', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.minimize();
});

ipcMain.on('window-maximize', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
        if (win.isMaximized()) {
            win.unmaximize();
        } else {
            win.maximize();
        }
    }
});

ipcMain.on('window-close', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.close();
});
