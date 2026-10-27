# Bot WhatsApp Koperasi LPP Kedungneng — Dashboard Browser

Dashboard admin di website koperasi menampilkan **status koneksi, QR WhatsApp, dan tombol aktif/nonaktif balasan**. Komputer Windows tetap menjalankan proses bot lokal. QR hanya terlihat oleh admin yang login.

## Instalasi pertama kali di Windows

1. Pasang Node.js versi 20+ dan unduh repository koperasi.
2. Buka PowerShell di folder `bot-wa` dan jalankan `npm install`.
3. Di **Supabase Dashboard → Project Settings → API Keys**, ambil **secret/service_role key** proyek koperasi. **Kunci ini sangat rahasia**, hanya boleh disimpan di komputer bot yang dipercaya. Jangan pernah masukkan ke frontend, GitHub, chat publik, atau tangkapan layar.
4. Buat file lokal `start-bot.cmd` di folder `bot-wa` dengan isi berikut (ganti placeholder di komputer sendiri):

   ```bat
   @echo off
   cd /d "%~dp0"
   set "SUPABASE_URL=https://wlwfhelhaeiltnqfnzjd.supabase.co"
   set "SUPABASE_SERVICE_ROLE_KEY=ISI_KUNCI_RAHASIA_DI_KOMPUTER_SENDIRI"
   npm start
   ```

5. Klik dua kali `start-bot.cmd` untuk menyalakan bot. **Jangan unggah file tersebut ke GitHub.**
6. Login ke website koperasi → **Bot WhatsApp**. Tunggu QR tampil, kemudian pindai melalui WhatsApp Business → **Perangkat tertaut**.
7. Tunggu status **Terhubung**, lalu uji dengan mengirim **menu** dari nomor lain.

## Pemakaian harian tanpa terminal

Klik dua kali file `start-bot.cmd` saat komputer dinyalakan. Jika ingin otomatis, gunakan **Task Scheduler Windows** untuk menjalankan file tersebut saat login pengguna; pastikan komputer terjaga dan koneksi internet aktif. Setelah berjalan, pengaturan balasan serta QR dilakukan dari browser.

**Keamanan:** File `start-bot.cmd` berisi kredensial istimewa. Batasi izin file dan akun Windows, gunakan komputer terpercaya, jangan sinkronkan ke folder publik/cloud, dan rotasi kunci jika bocor. Jika tidak ingin menyimpan service_role key pada komputer bot, diperlukan backend perantara dengan autentikasi khusus (belum tersedia).

## Fitur dan batasan

- Dashboard hanya bisa dibaca/diatur oleh admin koperasi yang terautentikasi melalui kebijakan RLS Supabase.
- QR ditampilkan hanya saat proses bot berjalan dan QR belum kedaluwarsa.
- Tombol **Nonaktifkan Balasan** menghentikan respons otomatis, bukan mematikan program atau WhatsApp Business.
- Tidak ada data saldo atau transaksi anggota yang dibuka melalui WhatsApp.
- Bot tidak berjalan jika komputer mati, tidur, atau koneksi internet terputus.
- Integrasi menggunakan WhatsApp Web **tidak resmi**. Ada risiko sesi terputus, konflik perangkat, dan pembatasan akun.
- Sesi tersimpan dalam `.wwebjs_auth` dan tidak boleh diunggah.
- **Tidak perlu biaya API**, tetapi perangkat dan koneksi internet tetap diperlukan.
