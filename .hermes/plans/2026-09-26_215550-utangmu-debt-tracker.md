# Rencana Pengembangan Aplikasi Pencatat Utang (Utangmu)

## 1. Analisis Masalah & Kondisi Saat Ini (Trello)
Berdasarkan papan Trello yang kamu pakai saat ini:
- Format berjalan: 1 kolom = 1 teman, tiap kartu = catatan pinjaman/nominal (misal `500k`, `(sisa 200k)`), centang hijau = lunas, lampiran kartu = bukti transfer/struk.
- **Kelemahan Trello:**
  1. Izin akses Trello bersifat per-board, bukan per-kolom. Jika board dibagikan, teman A dapat melihat catatan teman B dan C (masalah privasi).
  2. Menghitung sisa utang dan cicilan masih manual (ditulis di judul kartu).
  3. Membuat 1 board terpisah per teman tidak efisien untuk melihat total akumulasi piutang.

---

## 2. Solusi Akses Teman (Privasi Data)

Agar teman yang berutang hanya bisa melihat data miliknya sendiri tanpa melihat data orang lain:

| Metode | Cara Kerja | Kelebihan | Kekurangan | Rekomendasi |
| :--- | :--- | :--- | :--- | :--- |
| **Opsi 1: Secret Link / Token Unik (UUID)** | Setiap teman memiliki URL unik (contoh: `utangmu.com/view/7f9a-8b1c...`). | Zero-friction. Teman tidak perlu daftar akun/login. Cukup klik link dari WA. | Jika link disebarkan oleh teman ke pihak ketiga, halaman dapat dibuka. (Bisa dimitigasi dengan tombol *Regenerate Link* di sisi admin). | **Sangat Direkomendasikan (MVP)** |
| **Opsi 2: Secret Link + 4-Digit PIN** | Teman membuka link unik, lalu memasukkan 4 angka PIN yang ditentukan admin. | Lebih aman dari penyebaran link yang tidak disengaja. | Teman harus mengingat PIN. | **Opsi Tambahan (Fase 1.5)** |
| **Opsi 3: Akun / Login Lengkap (Email / Google)** | Teman wajib sign-in dengan email/Google akun masing-masing. | Keamanan autentikasi standar. | High-friction. Banyak teman malas mendaftar akun hanya untuk melihat rincian utang. | **Kurang Praktis** |

**Keputusan Arsitektur:** Gunakan **Opsi 1 (Secret Link)** untuk rilis awal. Hanya admin (kamu) yang memiliki akun login lengkap. Teman mengakses halaman portal read-only berbasis token.

---

## 3. Pembagian Fitur: MVP vs Fase Lanjutan

### Fase 1: MVP (Fokus Menggantikan Trello & Menjaga Privasi)
1. **Autentikasi Admin:**
   - Login admin (hanya kamu yang bisa input, edit, dan hapus data).
2. **Manajemen Teman (Debtor):**
   - Tambah/edit nama teman dan nomor kontak.
   - Generate link portal khusus per teman.
   - Tombol copy link dan tombol reset/regenerate link jika diperlukan.
3. **Pencatatan Transaksi & Kalkulasi Otomatis:**
   - Tipe transaksi: **Pinjaman Baru** (menambah saldo utang) dan **Pembayaran/Cicilan** (mengurangi saldo utang).
   - Nominal, tanggal transaksi, dan catatan keterangan.
   - Perhitungan otomatis sisa utang (tidak perlu hitung manual).
   - Status: Belum Lunas, Dicicil Sebagian, Lunas.
4. **Upload & Pengelolaan Bukti (Attachment):**
   - **Ganti Bukti (Replace):** Admin bisa mengganti bukti transfer jika salah upload. Sistem otomatis menghapus file lama di Cloudflare R2 agar storage tetap bersih.
   - **Watermark Otomatis (Burn-in ke Gambar):** Dibuat via HTML5 Canvas sebelum kompresi. Memuat tanggal & jam (WIB), lokasi/GPS (koordinat), dan nama/ID transaksi.
   - **Client-Side Compression:** Dikecilkan langsung ke WebP (kualitas 0.8, ~70–120 KB).
5. **Portal Publik Teman (Read-Only):**
   - Ringkasan total pinjaman, total sudah dibayar, dan sisa utang saat ini.
   - Tabel riwayat transaksi terurut berdasarkan tanggal (timeline).
   - Bukti transfer dapat diklik untuk melihat gambar ukuran penuh.
6. **Dashboard Utama Admin:**
   - Total keseluruhan piutang yang belum dibayar dari semua teman.
   - Daftar ringkas tiap teman beserta nominal yang belum lunas.

### Fase 2: Fitur Lanjutan (Kenyamanan Operasional & Media)
1. **Bukti Video:**
   - Unggah video bukti serah-terima langsung apa adanya (*as-is*) tanpa kompresi dan tanpa batas ukuran/durasi ke Cloudflare R2 via presigned/direct upload.
   - Pemutar video (video player) disematkan di kartu rincian transaksi portal teman & admin.
2. **Quick Share WhatsApp:**
   - Tombol generator teks rekap otomatis untuk dikirim via WA (contoh: *"Halo [Nama], berikut rekapan pinjaman: [Link Portal]. Total sisa: Rp [Nominal]"*).
3. **Konfirmasi Pembayaran Mandiri oleh Teman:**
   - Teman dapat mengunggah bukti transfer langsung dari portal mereka.
   - Status masuk ke antrean "Menunggu Konfirmasi" di dashboard admin sebelum diverifikasi.
4. **Export Laporan:**
   - Download rekap per orang dalam format PDF/Excel untuk arsip offline.

---

## 4. Desain Struktur Data (Database Schema)

### Tabel `debtors` (Data Teman)
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key ke tabel users/admin)
- `name` (VARCHAR, Nama teman)
- `phone` (VARCHAR, Opsional)
- `secret_token` (VARCHAR, Unique, Token acak 32-karakter untuk akses portal)
- `created_at` (TIMESTAMP)

### Tabel `transactions` (Riwayat Utang & Bayar)
- `id` (UUID, Primary Key)
- `debtor_id` (UUID, Foreign Key ke `debtors`)
- `type` (ENUM: `BORROW` untuk pinjam, `PAYMENT` untuk bayar/cicil)
- `amount` (NUMERIC/BIGINT, Nominal rupiah)
- `description` (TEXT, Keterangan)
- `transaction_date` (DATE / TIMESTAMP)
- `created_at` (TIMESTAMP)

### Tabel `attachments` (Bukti Struk/Transfer)
- `id` (UUID, Primary Key)
- `transaction_id` (UUID, Foreign Key ke `transactions`)
- `file_url` (TEXT, URL file pada cloud storage)
- `file_name` (VARCHAR)
- `created_at` (TIMESTAMP)

---

## 5. Rekomendasi Tech Stack (Lean, Serverless, & Modern UI)
- **Frontend:** Vite + React + TypeScript + Tailwind CSS.
- **UI Library & Animasi:**
  - **shadcn/ui:** Komponen dasar (Dialog, Form, Button, Table, Input, Badge, Popover).
  - **Magic UI:** Animasi dan visual polish:
    - `Number Ticker`: Animasi perubahan nominal total sisa utang.
    - `Magic Card` / `Border Beam`: Kartu ringkasan teman (menggantikan kartu Trello).
    - `Animated List`: Transisi daftar riwayat transaksi / cicilan.
    - `Blur Fade`: Efek loading smooth saat buka riwayat.
    - `Confetti`: Animasi saat utang dinyatakan lunas (Settled).
- **Hosting:** Cloudflare Pages (Frontend Vite SPA + Cloudflare Pages Functions untuk endpoint API R2).
- **Database & Auth Admin:** Supabase (PostgreSQL free tier + Supabase Auth hanya untuk login kamu).
- **Storage Bukti Transfer:** Cloudflare R2 (10 GB gratis per bulan, zero egress fee).
  - **Foto Bukti:** Kompresi client-side ke WebP + Watermark permanen via native HTML5 Canvas API (0 packages tambahan).
  - **Video Bukti:** Diunggah langsung apa adanya (*as-is*), tanpa kompresi, dan tanpa batas ukuran/durasi ke Cloudflare R2 via presigned/multipart upload.
- **Backend API Ringan:** Cloudflare Pages Functions (`/functions/api/...`) untuk:
  - Proxy query data portal teman via secret token (aman & terisolasi).
  - Endpoint presigned URL / upload handler langsung ke Cloudflare R2.

---

## 6. Langkah Kerja Implementasi Bertahap
1. **Inisialisasi Project:**
   - Setup project React + Vite di direktori repo `utangmu`.
   - Setup Tailwind CSS & styling lean.
2. **Setup Database & Storage (Supabase):**
   - Buat tabel `debtors`, `transactions`, dan `attachments`.
   - Setup RLS (Row Level Security) untuk akses Admin dan Postgres Function (RPC) untuk view teman berdasarkan token.
   - Buat storage bucket untuk bukti transfer.
3. **Bangun Halaman Admin:**
   - Halaman login admin via Supabase Auth.
   - Dashboard daftar piutang, form input pinjaman/cicilan, upload bukti.
4. **Bangun Portal Teman (`/view/:token`):**
   - Halaman statis ringan di Vite yang mengambil data via token, responsif di HP.
5. **Deploy ke Cloudflare Pages:**
   - Sambungkan repo GitHub ke Cloudflare Pages, build command `npm run build` / `bun run build`, output dir `dist`.
