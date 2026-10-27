'use strict';

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  console.error('Atur SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY pada lingkungan lokal sebelum menjalankan bot.');
  process.exit(1);
}
const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
let connected = false;
let lastQr = null;
let lastQrExpiry = null;
let enabled = false;
async function syncStatus(status, qrData = null, qrExpiresAt = null) {
  const { error } = await db.from('bot_wa_status').update({
    status, qr_data: qrData, qr_expires_at: qrExpiresAt,
    last_seen_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }).eq('id', 1);
  if (error) console.error('Gagal memperbarui status bot:', error.message);
}
async function heartbeat() {
  const { data, error } = await db.from('bot_wa_status').select('enabled').eq('id', 1).single();
  if (error) { console.error('Gagal membaca pengaturan bot:', error.message); return; }
  enabled = data.enabled;
  await syncStatus(connected ? 'terhubung' : lastQr ? 'menunggu_qr' : 'offline', lastQr, lastQrExpiry);
}
setInterval(() => heartbeat().catch(console.error), 15000).unref();


const BOT_NAME = 'Koperasi LPP Kedungneng';
const MENU = [
  '*Assalamu’alaikum! 👋*',
  'Selamat datang di layanan WhatsApp Koperasi LPP Kedungneng.',
  '',
  '*Menu layanan:*',
  '1️⃣ Informasi Keanggotaan',
  '2️⃣ Informasi Simpanan',
  '3️⃣ Jam Layanan',
  '4️⃣ Hubungi Pengurus',
  '0️⃣ Tampilkan Menu',
  '',
  'Balas dengan angka 0–4.',
].join('\n');

const replies = {
  '1': 'Informasi keanggotaan: untuk pendaftaran atau perubahan data anggota, silakan menghubungi pengurus koperasi. Data pribadi tidak dikirim otomatis melalui bot ini.',
  '2': 'Informasi simpanan: tersedia Simpanan Pokok, Simpanan Wajib, dan Simpanan Sukarela. Untuk saldo atau riwayat pribadi, silakan hubungi pengurus melalui jalur terverifikasi. Bot belum menyediakan pengecekan saldo.',
  '3': 'Jam layanan belum ditetapkan di bot. Silakan hubungi pengurus koperasi untuk memastikan jam operasional.',
  '4': 'Silakan tuliskan kebutuhan Anda secara singkat. Pengurus akan menindaklanjuti saat layanan tersedia. Bot ini tidak meneruskan isi pesan ke sistem lain.',
  '0': MENU,
};

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'koperasi-lpp-kedungneng', dataPath: '.wwebjs_auth' }),
  puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] },
});

const lastReply = new Map();
const COOLDOWN_MS = 5000;

client.on('qr', async code => {
  console.log('Pindai QR dengan WhatsApp Business > Perangkat tertaut > Tautkan perangkat:');
  qrcode.generate(code, { small: true });
  try {
    lastQr = await QRCode.toDataURL(code, { margin: 2, width: 280 });
    lastQrExpiry = new Date(Date.now() + 55000).toISOString();
    await syncStatus('menunggu_qr', lastQr, lastQrExpiry);
  } catch (err) { console.error('Gagal membuat QR:', err.message); }
});
client.on('authenticated', () => console.log('Sesi WhatsApp berhasil diautentikasi.'));
client.on('ready', async () => {
  connected = true; lastQr = null; lastQrExpiry = null;
  await heartbeat();
  console.log('Bot siap. Balasan hanya aktif selama program berjalan.');
});
client.on('auth_failure', () => console.error('Autentikasi gagal. Periksa sesi dan tautkan ulang bila diperlukan.'));
client.on('disconnected', async reason => {
  connected = false; lastQr = null; lastQrExpiry = null;
  await syncStatus('terputus');
  console.warn('Bot terputus:', reason);
});

client.on('message', async msg => {
  try {
    if (!enabled || msg.fromMe || !msg.from?.endsWith('@c.us') || msg.isStatus) return;
    const body = (msg.body || '').trim().toLowerCase();
    if (!body) return;

    const now = Date.now();
    const previous = lastReply.get(msg.from) || 0;
    if (now - previous < COOLDOWN_MS) return;

    const greeting = ['halo', 'hai', 'hi', 'assalamualaikum', 'assalamu alaikum', 'menu', 'start'];
    const response = replies[body] || (greeting.includes(body) ? MENU : null);
    // Jangan balas setiap pesan bebas agar percakapan anggota dengan pengurus tidak terganggu.
    if (!response) return;

    lastReply.set(msg.from, now);
    await msg.reply(response);
    if (lastReply.size > 5000) {
      for (const [id, time] of lastReply) if (now - time > 60000) lastReply.delete(id);
    }
  } catch (err) {
    console.error('Gagal membalas pesan:', err?.message || String(err));
  }
});

heartbeat().catch(console.error);
client.initialize().catch(err => {
  console.error('Gagal menjalankan WhatsApp Web:', err?.message || String(err));
  process.exitCode = 1;
});
