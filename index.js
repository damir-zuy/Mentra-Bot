const https = require('https')

const TOKEN = process.env.BOT_TOKEN
const CHAT_ID = process.env.CHAT_ID

function sendMessage(text) {
  const body = JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' })
  const options = {
    hostname: 'api.telegram.org',
    path: `/bot${TOKEN}/sendMessage`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  }
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => resolve(JSON.parse(data)))
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

const MESSAGES = {
  morning_start:   '🟢 <b>Фокус начался</b>\n09:00 — 12:00\nОткрой TradingView и садись работать.',
  morning_end:     '🔴 <b>Утренняя сессия окончена</b>\nХорошая работа. Перерыв до 13:00.',
  afternoon_start: '🟢 <b>Вторая сессия</b>\n13:00 — 17:00\nВозвращайся к графикам.',
  afternoon_end:   '✅ <b>День окончен</b>\nОбе сессии закрыты. Отдыхай.',
}

const SCHEDULE = [
  { hour: 9,  minute: 0,  key: 'morning_start' },
  { hour: 12, minute: 0,  key: 'morning_end' },
  { hour: 13, minute: 0,  key: 'afternoon_start' },
  { hour: 17, minute: 0,  key: 'afternoon_end' },
]

function checkAndSend() {
  const now = new Date()
  // Kyiv timezone (UTC+3)
  const kyiv = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Kiev' }))
  const h = kyiv.getHours()
  const m = kyiv.getMinutes()
  const day = kyiv.getDay() // 0=Sun, 6=Sat

  // Только рабочие дни
  if (day === 0 || day === 6) return

  for (const entry of SCHEDULE) {
    if (entry.hour === h && entry.minute === m) {
      sendMessage(MESSAGES[entry.key])
        .then(() => console.log(`[${h}:${String(m).padStart(2,'0')}] Sent: ${entry.key}`))
        .catch((err) => console.error('Error:', err))
    }
  }
}

// Запускаем каждую минуту
checkAndSend()
setInterval(checkAndSend, 60 * 1000)

console.log('Focus bot started. Timezone: Europe/Kiev')
