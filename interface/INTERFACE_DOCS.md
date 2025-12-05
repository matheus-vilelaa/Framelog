# FrameLog Interface Documentation

## Architecture Overview

This interface is built using **Electron**, designed to operate as a "UI on Demand" service. It communicates with the main process (and eventually a C++ backend) via **IPC (Inter-Process Communication)**.

### Key Components

1.  **Main Process (`main.js`)**:
    - Manages the application lifecycle.
    - Creates the browser window.
    - Handles IPC events (`get-space-used`, `get-retention-days`, `set-retention-days`).
    - Currently mocks the backend logic (file system size calculation and local config storage).

2.  **Preload Script (`preload.js`)**:
    - Acts as a secure bridge between the Main Process and the Renderer.
    - Exposes a safe `window.api` object to the frontend.

3.  **Renderer (`renderer.js`)**:
    - Handles the UI logic (tab switching, data population).
    - Calls `window.api` to fetch data.

4.  **UI (`index.html`, `styles.css`)**:
    - Follows the "Light Mode" design specification.
    - Uses CSS Variables for easy theming.

## Customization Guide

### Changing the Design
The design is controlled by `styles.css`. Key colors and fonts are defined as CSS variables at the top of the file:

```css
:root {
    --bg-color: #F5F5F7;
    --accent-color: #FFD700;
    /* ... */
}
```

To change the theme (e.g., to Dark Mode), you can modify these variables or add a new class to the `body` that overrides them.

### Adding New Features
1.  **Frontend**: Add the HTML in `index.html` and logic in `renderer.js`.
2.  **Backend Communication**:
    - Define a new handler in `main.js`: `ipcMain.handle('new-feature', ...)`
    - Expose it in `preload.js`: `newFeature: () => ipcRenderer.invoke('new-feature')`
    - Call it in `renderer.js`: `await window.api.newFeature()`

### Backend Integration
To connect with the C++ backend later:
- Modify `main.js` to use **Named Pipes** (Windows) or **Unix Domain Sockets** (Linux) instead of local logic.
- The `ipcMain` handlers should forward requests to the C++ daemon and return the response.

## Setup & Run
1.  Install dependencies: `npm install`
2.  Start the app: `npm start`
