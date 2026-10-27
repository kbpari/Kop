# Bot WhatsApp Koperasi LPP Kedungneng (Windows)

Bot lokal untuk nomor **WhatsApp Business yang sudah aktif**. Menggunakan library WhatsApp Web tidak resmi. **Tidak memerlukan API berbayar**, tetapi berisiko sesi terputus atau akun dibatasi. Bot ini bukan layanan WhatsApp Business Platform resmi.

## Persiapan

1. Instal Node.js LTS (versi 20 atau lebih baru) pada komputer Windows.
2. Unduh repository koperasi dari GitHub atau buka folder project lokal.
3. Buka PowerShell di folder `bot-wa`.
4. Jalankan:

   ```powershell
   npm install
   npm run check
   npm start
   ```

5. QR akan muncul di terminal saat login pertama. Di ponsel dengan nomor WhatsApp Business koperasi, buka **Perangkat tertaut → Tautkan perangkat**, lalu pindai QR.
6. Tunggu tulisan **Bot siap**. Kirim **menu** atau **halo** dari nomor lain untuk menguji.
7. Untuk menghentikan bot tekan **Ctrl+C**. Jalankan kembali `npm start` saat komputer menyala.

**Jangan unggah QR, folder `.wwebjs_auth`, atau isi sesi ke GitHub / pihak lain.** Folder sesi disimpan hanya di PC tempat bot berjalan.

## Fitur awal

- Menu otomatis: 0, 1, 2, 3, 4.
- Hanya merespons pesan pribadi dengan perintah yang dikenali; mengabaikan grup, status, dan pesan sendiri.
- Tidak mengirim broadcast, tidak membaca data keuangan, dan tidak menyimpan isi pesan anggota ke database.
- Pembatasan frekuensi balasan sederhana per nomor.

## Batasan

- Bot tidak berjalan di Cloudflare Pages karena memerlukan proses Node.js dan browser yang hidup.
- Bot berhenti saat PC mati, tidur, kehilangan koneksi, atau program ditutup.
- Akun WhatsApp Business mungkin mengalami konflik perangkat, sesi terputus, atau pembatasan. Penggunaan mengikuti ketentuan WhatsApp dan menjadi tanggung jawab pengelola.
- **Jangan gunakan untuk mengirim saldo, identitas pribadi, atau data keuangan** sebelum verifikasi nomor dan persetujuan anggota dirancang dan diuji.
- Informasi jam layanan masih berupa placeholder dan perlu dikonfirmasi oleh pengurus.
