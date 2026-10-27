# Koperasi LPP Kedungneng

Aplikasi administrasi Koperasi Simpan Pinjam (KSP) dengan **Supabase**, **Cloudflare Pages**, dan **GitHub**.

## Status
- ✅ Database Supabase: 14 tabel, RLS aktif, konfigurasi pokok Rp100.000, wajib Rp10.000/bulan, bunga flat 1%/bulan.
- ✅ Kebijakan RLS admin: akses baca dan pengelolaan anggota.
- ✅ Dashboard React tahap awal: autentikasi, ringkasan, daftar/tambah/edit anggota, export PDF dan Excel (.xlsx).
- ⏳ Pencatatan transaksi keuangan **belum diaktifkan** sampai RPC atomik dan jurnal diuji.
- ⏳ WhatsApp Cloud API belum terhubung; Cloudflare belum di-deploy.

## Menjalankan frontend
```bash
cd frontend
npm install
cp .env.example .env
# Masukkan URL Supabase dan anon/publishable key ke .env
npm run dev
```

## Deploy ke Cloudflare Pages
Hubungkan repository `kbpari/Kop`, set **Root directory** `frontend`, **Build command** `npm run build`, **Build output directory** `dist`. Tambahkan variabel lingkungan build `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY`. Jangan pernah masukkan `service_role`/secret key ke frontend atau GitHub.

## Membuat admin pertama
1. Di Supabase Dashboard > Authentication > Users, buat akun email pengguna admin.
2. Melalui SQL Editor (bukan frontend), lakukan substitusi EMAIL_ADMIN:
```sql
INSERT INTO public.petugas(auth_user_id,nama,peran)
SELECT id,'Administrator Koperasi','admin'
FROM auth.users WHERE email = 'EMAIL_ADMIN'
ON CONFLICT (auth_user_id) DO NOTHING;
```
3. Login menggunakan akun tersebut di dashboard. Untuk keamanan, admin pertama hanya boleh ditetapkan dari SQL Editor oleh pemilik proyek.

## Keamanan dan batasan
- RLS semua tabel aktif; pengguna biasa tidak memiliki hak membaca keuangan.
- Administrator mendapat baca data keuangan dan kelola anggota; transaksi finansial tidak dibuka melalui CRUD langsung.
- WhatsApp dan sistem transaksi tunai baru diaktifkan setelah verifikasi anggota, audit, jurnal berimbang dan mekanisme pembayaran atomik dibuat.
- Laporan anggota sudah dapat diekspor sebagai file PDF dan Excel (.xlsx); laporan keuangan menyusul setelah modul transaksi siap.

## Database
Proyek Supabase: `wlwfhelhaeiltnqfnzjd`.
Migrasi database awal dan akses admin sudah diterapkan langsung melalui Supabase; skema awal tersedia di `supabase/migrations/001_initial_schema.sql`.
