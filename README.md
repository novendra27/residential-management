# Residential Management System – Frontend

Antarmuka web untuk sistem administrasi keuangan dan penghuni perumahan yang dikelola oleh RT. Mencakup pengelolaan data penghuni, rumah, tagihan iuran bulanan, pengeluaran, dan laporan keuangan.

**Stack:** React 19 · TypeScript 5.9 · Vite 8 · Tailwind CSS v4 · shadcn/ui · TanStack Query v5 · React Router v7

---

## Daftar Isi

- [Penjelasan Aplikasi](#penjelasan-aplikasi)
- [Requirement](#requirement)
- [Panduan Instalasi](#panduan-instalasi)
- [Struktur Folder](#struktur-folder)
- [Fitur Aplikasi](#fitur-aplikasi)

---

## Penjelasan Aplikasi

**Residential Management System** adalah aplikasi web single-page (SPA) yang berfungsi sebagai antarmuka administrasi untuk pengurus RT perumahan. Aplikasi ini dibangun di atas backend Laravel terpisah dan berkomunikasi sepenuhnya melalui REST API menggunakan token autentikasi.

### Tujuan aplikasi

Membantu pengurus RT dalam menjalankan kegiatan administrasi perumahan sehari-hari secara digital dan terpusat, menggantikan pencatatan manual yang rentan kesalahan dan sulit ditelusuri:

- Mencatat dan memantau **data rumah** serta siapa penghuninya saat ini
- Mengelola **data penghuni** lengkap beserta riwayat perpindahan hunian
- Membuat dan melacak **tagihan iuran** (bulanan/tahunan) per rumah
- Mencatat setiap **pembayaran tagihan** beserta bukti dan catatan
- Mencatat **pengeluaran** operasional RT (rutin maupun insidental)
- Melihat **laporan keuangan** pemasukan, pengeluaran, dan saldo dalam bentuk tabel maupun grafik

### Autentikasi

Seluruh halaman dilindungi oleh `ProtectedRoute`. Pengguna yang belum login akan secara otomatis diarahkan ke halaman `/login`. Token yang diperoleh setelah login disimpan di Zustand store dan di-persist ke `localStorage`, sehingga sesi tetap aktif meskipun halaman di-refresh.

---

## Requirement

### Runtime

- **Node.js** >= 18 (direkomendasikan LTS terbaru)
- **npm** >= 9

### Dependensi utama

| Package | Versi | Kegunaan |
|---|---|---|
| react | 19 | UI framework utama |
| typescript | 5.9 | Static type checking |
| vite | 8 | Dev server & build tool |
| tailwindcss | v4 | Utility-first CSS framework |
| shadcn/ui | latest | Koleksi komponen UI berbasis Radix |
| @tanstack/react-query | v5 | Manajemen server state, cache, dan refetching |
| react-router-dom | v7 | Client-side routing & navigasi |
| react-hook-form | v7 | Manajemen state form yang efisien |
| zod | v4 | Validasi skema data (form & API response) |
| zustand | v5 | Lightweight state management untuk auth session |
| recharts | v3 | Visualisasi data keuangan dalam bentuk grafik |
| axios | latest | HTTP client untuk komunikasi dengan backend API |

---

## Panduan Instalasi

### 1. Siapkan backend API terlebih dahulu

Aplikasi frontend ini **tidak dapat berjalan tanpa backend API**. Backend dibangun dengan Laravel dan harus dijalankan secara lokal sebelum memulai frontend.

> Repository backend: **https://github.com/novendra27/residential-management-api**

Clone repository tersebut dan ikuti seluruh langkah instalasinya (migrasi, seeder, storage link, `php artisan serve`). Pastikan server API sudah aktif dan dapat diakses sebelum melanjutkan ke langkah berikutnya.

### 2. Clone repositori frontend

```bash
git clone <repository-url> residential-management-web
cd residential-management-web
```

### 3. Install dependensi

```bash
npm install
```

### 4. Sesuaikan base URL API

Semua request HTTP dikirim melalui `src/lib/apiClient.ts`. Di bagian atas file tersebut terdapat konstanta `BASE_URL` yang menentukan ke mana semua request API diarahkan:

```ts
// src/lib/apiClient.ts
const BASE_URL = 'http://127.0.0.1:8000'
```

Nilai default ini sesuai untuk backend yang dijalankan secara lokal dengan `php artisan serve`. **Jika Anda menjalankan backend di host atau port yang berbeda**, ubah nilai `BASE_URL` di file tersebut. Contoh:

```ts
// Backend berjalan di port lain
const BASE_URL = 'http://127.0.0.1:8080'

// Backend di-deploy ke server
const BASE_URL = 'https://api.example.com'
```

> **Catatan CORS:** Pastikan konfigurasi CORS di backend (`config/cors.php`) mengizinkan origin dari frontend Anda. Secara default, repository backend sudah mengizinkan semua origin (`paths = ['*']`), sehingga untuk development lokal tidak perlu perubahan tambahan.

### 5. Sesuaikan kunci penyimpanan token (opsional)

Token autentikasi disimpan di `localStorage` dengan kunci `auth_token`. Jika perlu mengubah nama kunci ini (misalnya karena konflik dengan aplikasi lain), cari string `'auth_token'` di `src/lib/apiClient.ts` dan `src/stores/auth.store.ts`, lalu ganti secara konsisten di kedua file tersebut.

### 6. Jalankan development server

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5173`. Buka URL tersebut di browser.

### 7. Login ke aplikasi

Gunakan akun admin yang sudah di-seed oleh backend. Kredensial default dapat dilihat di dokumentasi repository backend. Setelah login berhasil, token akan otomatis disimpan dan Anda akan diarahkan ke halaman Dashboard.

Jika halaman kosong atau terjadi error setelah login, periksa hal-hal berikut:
- Pastikan backend sudah berjalan dan dapat diakses di URL yang dikonfigurasi di `BASE_URL`
- Buka DevTools browser (F12) → tab **Network** — cek apakah ada request yang gagal (status `404`, `401`, atau `ERR_CONNECTION_REFUSED`)
- Pastikan nilai `BASE_URL` di `src/lib/apiClient.ts` sudah benar

### 8. Build untuk produksi

```bash
npm run build
```

Hasil build akan tersimpan di folder `dist/`. Isi folder ini dapat langsung di-deploy ke static hosting (Netlify, Vercel, Nginx, dll). Untuk mempratinjau hasil build secara lokal sebelum deploy:

```bash
npm run preview
```

> **Penting saat deploy:** Karena aplikasi ini adalah SPA (Single Page Application), server harus dikonfigurasi untuk selalu mengembalikan `index.html` untuk semua route — bukan 404. Untuk Nginx, tambahkan `try_files $uri $uri/ /index.html;` di konfigurasi server block.

---

## Struktur Folder

```
src/
├── assets/
│   └── react.svg
│
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx        # Layout utama: menggabungkan Sidebar + Header + konten halaman
│   │   ├── Header.tsx           # Header bagian atas (nama halaman, info user, tombol logout)
│   │   └── Sidebar.tsx          # Navigasi kiri berisi link ke semua modul
│   │
│   ├── shared/                  # Komponen reusable yang dipakai lintas halaman
│   │   ├── ConfirmDialog.tsx    # Dialog konfirmasi sebelum aksi destruktif (hapus data)
│   │   ├── ErrorMessage.tsx     # Tampilan pesan error dari API atau validasi
│   │   ├── LoadingSpinner.tsx   # Indikator loading saat data sedang difetch
│   │   └── Pagination.tsx       # Kontrol navigasi halaman untuk daftar data
│   │
│   └── ui/                      # Komponen primitif dari shadcn/ui (Button, Card, Table, dll)
│
├── hooks/
│   └── useToast.ts              # Custom hook untuk menampilkan notifikasi toast
│
├── lib/
│   ├── apiClient.ts             # Instance Axios terkonfigurasi base URL + interceptor Bearer token
│   └── utils.ts                 # Fungsi utilitas umum (format angka, tanggal, dll)
│
├── pages/
│   ├── bills/
│   │   ├── BillList.tsx         # Daftar tagihan dengan filter & paginasi
│   │   ├── BillDetail.tsx       # Detail satu tagihan beserta riwayat pembayaran
│   │   ├── BillForm.tsx         # Form buat / edit tagihan
│   │   └── PayBillModal.tsx     # Modal pembayaran tagihan
│   │
│   ├── expenses/
│   │   ├── ExpenseList.tsx      # Daftar pengeluaran dengan filter, pencarian, sortir
│   │   └── ExpenseForm.tsx      # Form tambah / edit pengeluaran
│   │
│   ├── houses/
│   │   ├── HouseList.tsx        # Daftar rumah dengan status hunian
│   │   ├── HouseDetail.tsx      # Detail rumah: penghuni aktif & riwayat
│   │   └── HouseForm.tsx        # Form tambah / edit rumah
│   │
│   ├── report/
│   │   └── ReportPage.tsx       # Laporan keuangan: tab Grafik & tab Ringkasan
│   │
│   ├── residents/
│   │   ├── ResidentList.tsx     # Daftar penghuni dengan pencarian & filter
│   │   ├── ResidentDetail.tsx   # Detail penghuni: info pribadi & riwayat hunian
│   │   └── ResidentForm.tsx     # Form tambah / edit penghuni
│   │
│   ├── Dashboard.tsx            # Halaman utama: ringkasan properti, keuangan, & grafik tren
│   └── Login.tsx                # Halaman autentikasi dengan split layout
│
├── services/                    # Satu file per entitas berisi semua fungsi pemanggilan API
│   ├── auth.service.ts          # login, logout, getMe
│   ├── bill.service.ts          # getAll, getById, create, update, pay, delete
│   ├── expense.service.ts       # getAll, getById, create, update, delete
│   ├── feetype.service.ts       # getAll, create, update, delete
│   ├── house.service.ts         # getAll, getById, create, update, delete, assign/unassign
│   ├── payment.service.ts       # create payment
│   ├── report.service.ts        # getSummary, getBalances
│   └── resident.service.ts      # getAll, getById, create, update, delete
│
├── stores/
│   └── auth.store.ts            # Zustand store: menyimpan token & data user yang sedang login
│
├── types/
│   └── index.ts                 # Seluruh TypeScript interface & type (ApiResult, User, House, dll)
│
├── App.tsx                      # Root component: definisi semua route & ProtectedRoute wrapper
├── main.tsx                     # Entry point: mount React ke DOM, setup QueryClient & Router
└── index.css                    # Global styles: Tailwind directives & CSS variable tema
```

### Pola arsitektur

Proyek ini menerapkan pola **Service Layer** untuk memisahkan logika pengambilan data dari komponen UI:

```
Page / Component
      |
      v
TanStack Query (useQuery / useMutation)
      |
      v
Service Layer  (/services/*.service.ts)
      |
      v
apiClient.ts  (Axios instance + Bearer token otomatis)
      |
      v
Backend REST API  (http://127.0.0.1:8000)
```

- **Page** hanya bertanggung jawab menampilkan UI dan mengelola interaksi pengguna.
- **Service** mengenkapsulasi semua detail HTTP (endpoint, method, body, params) komponen tidak perlu tahu URL API.
- **apiClient** secara otomatis menyisipkan header `Authorization: Bearer <token>` dari Zustand store ke setiap request keluar.
- **TanStack Query** menangani caching, background refetching, loading state, dan error state secara deklaratif.
- **Zustand** hanya dipakai untuk satu hal: menyimpan session autentikasi (token + data user).

---

## Fitur Aplikasi

### Dashboard

Halaman pertama yang dilihat setelah login. Memberikan gambaran cepat kondisi perumahan dan keuangan RT saat ini.

- **Stat card properti**: Total Rumah, Rumah Dihuni, Rumah Tidak Dihuni, Total Penghuni diambil langsung dari data aktual
- **Stat card keuangan**: Pemasukan bulan ini, Pengeluaran bulan ini, Saldo akhir berdasarkan data bulan dan tahun berjalan
- **Banner peringatan tagihan belum dibayar**: muncul secara otomatis jika ada tagihan yang statusnya belum lunas, disertai link langsung ke halaman tagihan
- **Grafik tren 6 bulan**: BarChart yang menampilkan perbandingan pemasukan dan pengeluaran di 6 bulan terakhir membantu melihat pola keuangan RT
- **Transaksi terkini**: daftar 5 pemasukan dan 5 pengeluaran terbaru untuk pemantauan cepat

---

### Manajemen Rumah

Mengelola seluruh unit rumah yang ada di perumahan.

- Daftar semua unit rumah dilengkapi status hunian secara real-time (dihuni / tidak dihuni)
- Halaman detail menampilkan informasi lengkap rumah, siapa penghuni aktif saat ini, dan riwayat seluruh penghuni sebelumnya
- Form tambah rumah: isi nomor/nama rumah dan alamat
- Edit data rumah yang sudah ada
- Hapus rumah dilindungi dialog konfirmasi agar tidak terhapus secara tidak sengaja

---

### Manajemen Penghuni

Mengelola data seluruh penghuni perumahan.

- Daftar penghuni dengan informasi nama, nomor telepon, dan rumah yang sedang ditempati
- Pencarian penghuni berdasarkan nama secara real-time
- Halaman detail menampilkan data lengkap penghuni: nama, NIK, nomor KTP, foto KTP, kontak, dan riwayat hunian (pindah masuk / pindah keluar dari unit rumah mana saja)
- Form tambah penghuni: isi data pribadi lengkap termasuk upload foto KTP
- Edit data penghuni yang sudah ada
- Hapus penghuni dari sistem

---

### Jenis Iuran

Mengelola master data jenis-jenis iuran yang berlaku di perumahan.

- Daftar semua jenis iuran yang aktif, beserta nominal dan periode tagih (bulanan / tahunan)
- Tambah jenis iuran baru contoh: Iuran Satpam Rp 100.000/bulan, Iuran Kebersihan Rp 15.000/bulan
- Edit nama, nominal, atau periode iuran yang sudah ada
- Hapus jenis iuran yang sudah tidak digunakan

---

### Manajemen Tagihan

Modul utama pencatatan tagihan iuran warga. Setiap tagihan terhubung ke satu rumah dan satu jenis iuran untuk periode tertentu.

- Daftar semua tagihan dengan filter multi-parameter: per rumah, per jenis iuran, per status bayar (lunas / belum), per bulan, dan per tahun
- Halaman detail menampilkan informasi lengkap tagihan: rumah, jenis iuran, periode, tanggal jatuh tempo, status, dan riwayat pembayaran
- **Buat tagihan baru**: pilih rumah, pilih jenis iuran, tentukan periode (bulan/tahun untuk iuran bulanan, atau tahun saja untuk iuran tahunan) sistem akan otomatis menghitung nominal berdasarkan jenis iuran yang dipilih
- **Bayar tagihan**: klik tombol "Bayar" pada tagihan mana pun untuk membuka modal pembayaran isi tanggal bayar, jumlah yang dibayarkan, dan catatan opsional
- Edit data tagihan yang sudah dibuat
- Hapus tagihan dilindungi dialog konfirmasi

---

### Manajemen Pengeluaran

Mencatat semua pengeluaran operasional RT, baik yang rutin (setiap bulan) maupun insidental (tidak terjadwal).

- Daftar pengeluaran dengan filter: tipe (rutin / insidental), bulan, dan tahun
- Pencarian berdasarkan nama/keterangan pengeluaran
- Sortir tabel berdasarkan kolom: nama, tanggal, jumlah, tipe klik header kolom untuk mengubah arah sortir
- **Tambah pengeluaran baru**: isi nama, tanggal, jumlah, tipe, dan catatan opsional
- Edit pengeluaran yang sudah dicatat
- Hapus pengeluaran

---

### Laporan Keuangan

Memberikan gambaran menyeluruh kondisi keuangan RT dalam dua format yang berbeda.

**Tab Grafik**

- Menampilkan ComposedChart (kombinasi bar chart dan line chart) untuk seluruh 12 bulan dalam satu tahun
- Bar biru = total pemasukan per bulan, bar merah = total pengeluaran per bulan, garis = saldo kumulatif
- Selector tahun di bagian atas halaman pilih tahun yang ingin dilihat grafiknya
- Berguna untuk melihat tren keuangan RT secara visual sepanjang tahun

**Tab Ringkasan**

- Selector bulan dan tahun untuk memilih periode yang ingin dilihat detailnya
- Tiga stat card: total pemasukan bulan itu, total pengeluaran bulan itu, dan saldo akhir bulan itu
- **Tabel Pemasukan**: daftar semua tagihan yang dibayarkan di bulan tersebut, dilengkapi pencarian (nama rumah / penghuni) dan sortir kolom (rumah, penghuni, tanggal bayar, jumlah)
- **Tabel Pengeluaran**: daftar semua pengeluaran di bulan tersebut, dilengkapi pencarian (nama pengeluaran) dan sortir kolom (nama, tanggal, jumlah, tipe)
