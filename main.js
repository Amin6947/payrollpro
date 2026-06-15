const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron')
const path = require('path')

// Start backend server first
const { portReady } = require('./server')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'PayrollPro — ระบบบริหารเงินเดือน',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
    backgroundColor: '#f1f5f9',
  })

  // Wait for server to find an available port, then load
  portReady.then(port => {
    mainWindow.loadURL(`http://localhost:${port}`)
  }).catch(err => {
    const { dialog } = require('electron')
    dialog.showErrorBox('PayrollPro — ไม่สามารถเริ่มต้นได้', `เกิดข้อผิดพลาด: ${err.message}`)
    app.quit()
  })

  mainWindow.once('ready-to-show', () => mainWindow.show())

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url)
    return { action: 'deny' }
  })
}

function buildMenu() {
  const template = [
    {
      label: 'ไฟล์',
      submenu: [
        { label: 'พิมพ์สลิปเงินเดือน', accelerator: 'CmdOrCtrl+P', click: () => mainWindow.webContents.print({}, () => {}) },
        { type: 'separator' },
        { label: 'ออกจากโปรแกรม', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
      ]
    },
    {
      label: 'แก้ไข',
      submenu: [
        { label: 'ยกเลิก', role: 'undo' }, { label: 'ทำซ้ำ', role: 'redo' },
        { type: 'separator' },
        { label: 'ตัด', role: 'cut' }, { label: 'คัดลอก', role: 'copy' },
        { label: 'วาง', role: 'paste' }, { label: 'เลือกทั้งหมด', role: 'selectAll' }
      ]
    },
    {
      label: 'มุมมอง',
      submenu: [
        { label: 'โหลดใหม่', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { type: 'separator' },
        { label: 'เต็มจอ', accelerator: 'F11', role: 'togglefullscreen' },
        { label: 'ขนาดปกติ', role: 'resetZoom' },
        { label: 'ขยายใหญ่', role: 'zoomIn' },
        { label: 'ย่อเล็ก', role: 'zoomOut' },
        { type: 'separator' },
        { label: 'Developer Tools', accelerator: 'F12', click: () => mainWindow.webContents.toggleDevTools() }
      ]
    },
    {
      label: 'ช่วยเหลือ',
      submenu: [
        {
          label: 'เกี่ยวกับ PayrollPro',
          click: () => dialog.showMessageBox(mainWindow, {
            type: 'info', title: 'เกี่ยวกับ PayrollPro',
            message: 'PayrollPro v2.0.0',
            detail: 'ระบบบริหารเงินเดือนแบบ Real-Time\n\nWeb + Desktop ซิงค์ข้อมูลผ่าน Socket.IO\nเข้าถึงจากเบราว์เซอร์: http://localhost:3000',
            buttons: ['ปิด']
          })
        },
        {
          label: 'เปิดในเบราว์เซอร์',
          click: () => shell.openExternal('http://localhost:3000')
        }
      ]
    }
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

app.whenReady().then(() => {
  createWindow()
  buildMenu()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

ipcMain.handle('print', () => mainWindow.webContents.print({}, () => {}))
