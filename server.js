const express  = require('express')
const http     = require('http')
const { Server } = require('socket.io')
const mongoose = require('mongoose')
const path     = require('path')
const os       = require('os')

const app        = express()
const httpServer = http.createServer(app)
const io         = new Server(httpServer, { cors: { origin: '*', methods: ['GET', 'POST'] } })

// ─── Config ──────────────────────────────────────────────────
const PORT      = parseInt(process.env.PORT) || 10000
try { process.loadEnvFile(path.join(__dirname, '.env')) } catch {}
const MONGO_URI = process.env.MONGO_URI
if (!MONGO_URI) { console.error('❌ ไม่พบ MONGO_URI — ใส่ในไฟล์ .env หรือตั้งเป็น Environment Variable'); process.exit(1) }

app.use(express.static(path.join(__dirname)))
app.use(express.json({ limit: '10mb' }))

// ─── MongoDB ─────────────────────────────────────────────────
const dataSchema = new mongoose.Schema({ _id: String }, { strict: false, versionKey: false })
const AppData    = mongoose.model('AppData', dataSchema)

// ─── Default Data ────────────────────────────────────────────
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
      { id:'LV001', empId:'EMP001', type:'ลาป่วย',    start:'2026-06-10', end:'2026-06-11', days:2, reason:'ไม่สบาย มีไข้', status:'approved', by:'วิภาดา สุขใจ' },
      { id:'LV002', empId:'EMP005', type:'ลากิจ',     start:'2026-06-12', end:'2026-06-12', days:1, reason:'ธุระส่วนตัว',   status:'pending',  by:'' },
      { id:'LV003', empId:'EMP003', type:'ลาพักร้อน', start:'2026-06-15', end:'2026-06-19', days:5, reason:'พักผ่อน',      status:'approved', by:'วิภาดา สุขใจ' },
      { id:'LV004', empId:'EMP006', type:'ลาป่วย',    start:'2026-06-08', end:'2026-06-08', days:1, reason:'ปวดหัว',       status:'approved', by:'วิภาดา สุขใจ' },
      { id:'LV005', empId:'EMP004', type:'ลากิจ',     start:'2026-06-20', end:'2026-06-20', days:1, reason:'นัดธนาคาร',    status:'pending',  by:'' },
      { id:'LV006', empId:'EMP007', type:'ลากิจ',     start:'2026-06-05', end:'2026-06-05', days:1, reason:'ธุระครอบครัว', status:'rejected', by:'วิภาดา สุขใจ' },
    ],
    otRecords: [
      { id:'OT001', empId:'EMP001', date:'2026-06-07', hours:3, type:'1.5', note:'แก้ไขบัก production', status:'approved' },
      { id:'OT002', empId:'EMP007', date:'2026-06-08', hours:5, type:'2',   note:'Deploy ระบบใหม่',    status:'approved' },
      { id:'OT003', empId:'EMP005', date:'2026-06-09', hours:2, type:'1.5', note:'งานด่วน',            status:'pending'  },
      { id:'OT004', empId:'EMP003', date:'2026-06-01', hours:4, type:'2',   note:'ปิดงบเดือน',         status:'approved' },
      { id:'OT005', empId:'EMP004', date:'2026-06-06', hours:3, type:'1.5', note:'งาน event',          status:'pending'  },
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
        payDay: 30, periodMonth: 'มิถุนายน', periodYear: '2569',
        ssfRate: 5, ssfCap: 15000, pfRate: 5, pfEnabled: true,
        workDaysPerMonth: 26, workHoursPerDay: 8
      },
      leave: { annualLeave: 10, sickLeave: 30, personalLeave: 3, maternityLeave: 98 }
    },
    users: [
      { id:'USR001', name:'ผู้ดูแลระบบ', username:'admin', password:'1234', role:'admin' },
      { id:'USR002', name:'วิภาดา สุขใจ',  username:'hr',    password:'1234', role:'hr'    }
    ],
    payrollHistory: [],
    auditLog: [],
    bonuses: {}
  }
}

// ─── DB Helpers ──────────────────────────────────────────────
async function loadDB() {
  const doc = await AppData.findById('main').lean()
  if (!doc) {
    const d = defaultData()
    await saveDB(d)
    return d
  }
  const { _id, ...data } = doc
  return data
}

async function saveDB(data) {
  data._updatedAt = new Date().toISOString()
  const { _id, ...rest } = data
  await AppData.replaceOne({ _id: 'main' }, { _id: 'main', ...rest }, { upsert: true })
  return data
}

// ─── Network ─────────────────────────────────────────────────
function getLocalIP() {
  for (const ifaces of Object.values(os.networkInterfaces()))
    for (const i of ifaces)
      if (i.family === 'IPv4' && !i.internal) return i.address
  return '127.0.0.1'
}
const localIP = getLocalIP()
let publicUrl  = process.env.PUBLIC_URL || null
let clientCount = 0

// ─── REST API ────────────────────────────────────────────────
app.get('/api/data', async (_req, res) => {
  try { res.json(await loadDB()) }
  catch (e) { res.status(500).json({ error: e.message }) }
})

app.get('/api/network', (_req, res) =>
  res.json({ local: `http://${localIP}:${PORT}`, online: publicUrl, localIP, port: PORT }))

app.post('/api/data', async (req, res) => {
  try {
    const data = req.body
    await saveDB(data)
    io.emit('data:sync', { data, action: 'API update' })
    res.json({ ok: true, savedAt: data._updatedAt })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ─── Socket.IO ───────────────────────────────────────────────
io.on('connection', async (socket) => {
  clientCount++
  console.log(`[+] ${socket.id} (${clientCount} อุปกรณ์)`)

  try {
    socket.emit('data:init', await loadDB())
  } catch (e) {
    console.error('[DB] load error:', e.message)
  }
  socket.emit('network:info', { local: `http://${localIP}:${PORT}`, online: publicUrl, localIP, port: PORT })
  io.emit('clients:count', clientCount)

  socket.on('data:update', async ({ data, action }) => {
    try {
      await saveDB(data)
      socket.broadcast.emit('data:sync', { data, action })
      socket.emit('data:saved', { action, savedAt: data._updatedAt })
      console.log(`[DB] ${action}`)
    } catch (e) {
      console.error('[DB] save error:', e.message)
    }
  })

  socket.on('request:refresh', async () => {
    try {
      const fresh = await loadDB()
      socket.emit('data:init', fresh)
      socket.emit('data:saved', { action: 'refresh', savedAt: fresh._updatedAt })
    } catch (e) {
      console.error('[DB] refresh error:', e.message)
    }
  })

  socket.on('disconnect', () => {
    clientCount = Math.max(0, clientCount - 1)
    io.emit('clients:count', clientCount)
    console.log(`[-] ${socket.id}`)
  })
})

// ─── Migration ───────────────────────────────────────────────
async function migrateData() {
  const data = await loadDB()
  let changed = false
  // แก้ปีพ.ศ. ใน periodYear จาก 2568 → 2569
  if (data.settings?.payroll?.periodYear === '2568') {
    data.settings.payroll.periodYear = '2569'
    changed = true
  }
  // แก้วันที่ใน leaveRecords จาก 2568-xx-xx → 2026-xx-xx
  if (data.leaveRecords) {
    const fixed = data.leaveRecords.map(r => ({
      ...r,
      start: (r.start || '').replace(/^2568-/, '2026-'),
      end:   (r.end   || '').replace(/^2568-/, '2026-'),
    }))
    if (JSON.stringify(fixed) !== JSON.stringify(data.leaveRecords)) { data.leaveRecords = fixed; changed = true }
  }
  // แก้วันที่ใน otRecords จาก 2568-xx-xx → 2026-xx-xx
  if (data.otRecords) {
    const fixed = data.otRecords.map(r => ({
      ...r,
      date: (r.date || '').replace(/^2568-/, '2026-'),
    }))
    if (JSON.stringify(fixed) !== JSON.stringify(data.otRecords)) { data.otRecords = fixed; changed = true }
  }
  if (changed) { await saveDB(data); console.log('✅ Migration: แก้ข้อมูลปี 2568 → 2026/2569 เรียบร้อย') }
}

// ─── Start ───────────────────────────────────────────────────
async function main() {
  console.log('🔌 กำลังเชื่อมต่อ MongoDB...')
  await mongoose.connect(MONGO_URI)
  console.log('✅ MongoDB Connected')
  await migrateData()

  await new Promise((resolve) => {
    httpServer.listen(PORT, '0.0.0.0', resolve)
  })

  console.log(`\n✅ PayrollPro Web Server`)
  console.log(`   http://localhost:${PORT}`)
  console.log(`   http://${localIP}:${PORT}`)

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
}

main().catch(e => {
  console.error('❌ Startup failed:', e.message)
  process.exit(1)
})

// ส่งออก portReady สำหรับ Electron main.js
let _res, _rej
const portReady = new Promise((r, j) => { _res = r; _rej = j })
httpServer.once('listening', () => _res(PORT))
httpServer.once('error',     (e) => _rej(e))
module.exports = { httpServer, portReady }
