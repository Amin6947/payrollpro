const express = require('express')
const http    = require('http')
const { Server } = require('socket.io')
const fs   = require('fs')
const path = require('path')
const os   = require('os')

const app        = express()
const httpServer = http.createServer(app)
const io         = new Server(httpServer, { cors: { origin: '*', methods: ['GET', 'POST'] } })

// ─── Config ──────────────────────────────────────────────────
const PORT     = parseInt(process.env.PORT)     || 10000
const DATA_DIR = process.env.DATA_DIR           || __dirname
const DB_FILE  = path.join(DATA_DIR, 'db.json')

app.use(express.static(path.join(__dirname)))
app.use(express.json({ limit: '10mb' }))

// ─── DB ──────────────────────────────────────────────────────
function defaultData() {
  return {
    employees: [
      { id:'EMP001', name:'สมชาย ใจดี',     dept:'IT',        pos:'Senior Developer',      salary:55000, status:'active',   start:'2020-01-15', email:'somchai@ts.co.th',  phone:'081-234-5678', bank:'KBank',        acc:'123-4-56789-0' },
      { id:'EMP002', name:'วิภาดา สุขใจ',    dept:'HR',        pos:'HR Manager',            salary:65000, status:'active',   start:'2019-03-01', email:'wiphada@ts.co.th',  phone:'082-345-6789', bank:'SCB',          acc:'234-5-67890-1' },
      { id:'EMP003', name:'ประยุทธ์ รักงาน', dept:'Finance',   pos:'Accountant',            salary:45000, status:'active',   start:'2021-06-01', email:'prayuth@ts.co.th',  phone:'083-456-7890', bank:'Bangkok Bank', acc:'345-6-78901-2' },
      { id:'EMP004', name:'สุดา บุญมี',       dept:'Marketing', pos:'Marketing Manager',     salary:58000, status:'active',   start:'2020-09-01', email:'suda@ts.co.th',     phone:'084-567-8901', bank:'KTB',          acc:'456-7-89012-3' },
      { id:'EMP005', name:'นิรันดร์ ทำดี',   dept:'IT',        pos:'Junior Developer',      salary:35000, status:'active',   start:'2023-01-03', email:'nirun@ts.co.th',    phone:'085-678-9012', bank:'KBank',        acc:'567-8-90123-4' },
      { id:'EMP006', name:'มาลี งามสวย',      dept:'Sales',     pos:'Sales Executive',       salary:42000, status:'active',   start:'2022-04-01', email:'malee@ts.co.th',    phone:'086-789-0123', bank:'SCB',          acc:'678-9-01234-5' },
      { id:'EMP007', name:'อนุชา เก่งมาก',   dept:'IT',        pos:'DevOps Engineer',       salary:62000, status:'active',   start:'2021-02-15', email:'anucha@ts.co.th',   phone:'087-890-1234', bank:'Krungsri',     acc:'789-0-12345-6' },
      { id:'EMP008', name:'ปิยะ สบายดี',      dept:'Operations',pos:'Operations Supervisor', salary:48000, status:'inactive', start:'2018-07-01', email:'piya@ts.co.th',     phone:'088-901-2345', bank:'KBank',        acc:'890-1-23456-7' },
    ],
    leaveRecords: [
      { id:'LV001', empId:'EMP001', type:'ลาป่วย',    start:'2568-06-10', end:'2568-06-11', days:2, reason:'ไม่สบาย มีไข้', status:'approved', by:'วิภาดา สุขใจ' },
      { id:'LV002', empId:'EMP005', type:'ลากิจ',     start:'2568-06-12', end:'2568-06-12', days:1, reason:'ธุระส่วนตัว',   status:'pending',  by:'' },
      { id:'LV003', empId:'EMP003', type:'ลาพักร้อน', start:'2568-06-15', end:'2568-06-19', days:5, reason:'พักผ่อน',      status:'approved', by:'วิภาดา สุขใจ' },
      { id:'LV004', empId:'EMP006', type:'ลาป่วย',    start:'2568-06-08', end:'2568-06-08', days:1, reason:'ปวดหัว',       status:'approved', by:'วิภาดา สุขใจ' },
      { id:'LV005', empId:'EMP004', type:'ลากิจ',     start:'2568-06-20', end:'2568-06-20', days:1, reason:'นัดธนาคาร',    status:'pending',  by:'' },
      { id:'LV006', empId:'EMP007', type:'ลากิจ',     start:'2568-06-05', end:'2568-06-05', days:1, reason:'ธุระครอบครัว', status:'rejected', by:'วิภาดา สุขใจ' },
    ],
    otRecords: [
      { id:'OT001', empId:'EMP001', date:'2568-06-07', hours:3, type:'1.5', note:'แก้ไขบัก production', status:'approved' },
      { id:'OT002', empId:'EMP007', date:'2568-06-08', hours:5, type:'2',   note:'Deploy ระบบใหม่',    status:'approved' },
      { id:'OT003', empId:'EMP005', date:'2568-06-09', hours:2, type:'1.5', note:'งานด่วน',            status:'pending'  },
      { id:'OT004', empId:'EMP003', date:'2568-06-01', hours:4, type:'2',   note:'ปิดงบเดือน',         status:'approved' },
      { id:'OT005', empId:'EMP004', date:'2568-06-06', hours:3, type:'1.5', note:'งาน event',          status:'pending'  },
    ],
    settings: {
      company: {
        name: 'บริษัท เทค ซอลูชั่น จำกัด',
        taxId: '0105564123456',
        address: '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110',
        phone: '02-123-4567',
        email: 'hr@techsolution.co.th',
        logo: '💎'
      },
      payroll: {
        payDay: 30, periodMonth: 'มิถุนายน', periodYear: '2568',
        ssfRate: 5, ssfCap: 15000, pfRate: 5, pfEnabled: true,
        workDaysPerMonth: 26, workHoursPerDay: 8
      },
      leave: { annualLeave: 10, sickLeave: 30, personalLeave: 3, maternityLeave: 98 }
    }
  }
}

function loadDB() {
  if (!fs.existsSync(DB_FILE)) { const d = defaultData(); saveDB(d); return d }
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) }
  catch { console.error('[DB] ไฟล์เสียหาย — ใช้ข้อมูลเริ่มต้น'); const d = defaultData(); saveDB(d); return d }
}

function saveDB(data) {
  data._updatedAt = new Date().toISOString()
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
    const tmp = DB_FILE + '.tmp'
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8')
    fs.renameSync(tmp, DB_FILE)
  } catch (e) {
    console.error('[DB] บันทึกไม่สำเร็จ:', e.message)
  }
}

// ─── Network ─────────────────────────────────────────────────
function getLocalIP() {
  for (const ifaces of Object.values(os.networkInterfaces()))
    for (const i of ifaces)
      if (i.family === 'IPv4' && !i.internal) return i.address
  return '127.0.0.1'
}
const localIP = getLocalIP()
let publicUrl = process.env.PUBLIC_URL || null
let clientCount = 0

// ─── REST API ────────────────────────────────────────────────
app.get('/api/data',    (_req, res) => res.json(loadDB()))
app.get('/api/network', (_req, res) =>
  res.json({ local: `http://${localIP}:${PORT}`, online: publicUrl, localIP, port: PORT }))

app.post('/api/data', (req, res) => {
  const data = req.body
  saveDB(data)
  io.emit('data:sync', { data, action: 'API update' })
  res.json({ ok: true, savedAt: data._updatedAt })
})

// ─── Socket.IO ───────────────────────────────────────────────
io.on('connection', (socket) => {
  clientCount++
  console.log(`[+] ${socket.id} (${clientCount} อุปกรณ์)`)

  socket.emit('data:init', loadDB())
  socket.emit('network:info', { local: `http://${localIP}:${PORT}`, online: publicUrl, localIP, port: PORT })
  io.emit('clients:count', clientCount)

  socket.on('data:update', ({ data, action }) => {
    saveDB(data)
    socket.broadcast.emit('data:sync', { data, action })
    socket.emit('data:saved', { action, savedAt: data._updatedAt })
    console.log(`[DB] ${action}`)
  })

  socket.on('request:refresh', () => {
    const fresh = loadDB()
    socket.emit('data:init', fresh)
    socket.emit('data:saved', { action: 'refresh', savedAt: fresh._updatedAt })
  })

  socket.on('disconnect', () => {
    clientCount = Math.max(0, clientCount - 1)
    io.emit('clients:count', clientCount)
    console.log(`[-] ${socket.id}`)
  })
})

// ─── Start ───────────────────────────────────────────────────
httpServer.listen(PORT, '0.0.0.0', async () => {
  console.log(`\n✅ PayrollPro Web Server`)
  console.log(`   http://localhost:${PORT}`)
  console.log(`   http://${localIP}:${PORT}`)

  // ไม่เปิด localtunnel บน cloud (มี domain ของ Render อยู่แล้ว)
  if (process.env.NODE_ENV === 'production') return

  try {
    const localtunnel = require('localtunnel')
    const tunnel = await localtunnel({ port: PORT, allow_invalid_cert: true })
    publicUrl = tunnel.url
    console.log(`   🌐 ${tunnel.url}`)
    io.emit('network:info', { local: `http://${localIP}:${PORT}`, online: tunnel.url, localIP, port: PORT })
    tunnel.on('close', () => { publicUrl = null })
    tunnel.on('error', () => { publicUrl = null })
  } catch {
    console.log('   (no tunnel)')
  }
})

// ส่งออก portReady สำหรับ Electron main.js (ใช้เมื่อรันผ่าน electron .)
let _res, _rej
const portReady = new Promise((r, j) => { _res = r; _rej = j })
httpServer.once('listening', () => _res(PORT))
httpServer.once('error',     (e) => _rej(e))
module.exports = { httpServer, portReady }
