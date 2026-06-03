# Wound Analyzer AI 🩹🤖
### Tugas Akhir Mata Kuliah Sistem Multimedia | UNNES

Aplikasi Web Progresif (PWA) untuk pemantauan berkala kondisi kesembuhan luka secara mandiri menggunakan teknologi kamera HP dan analisis visual. Dirancang dengan desain antarmuka **Warm Clinical Premium** yang modern, bersih, dan menenangkan.

---

## 🎯 Fokus Utama Proyek
1. **Pemanfaatan Kamera HP**: Akses kamera *live* secara langsung untuk mengambil foto kondisi kulit/luka terbaru.
2. **Unggah Foto Galeri**: Sebagai opsi alternatif penting untuk melakukan demo menggunakan berkas foto luka yang diunduh dari dataset publik (misalnya Kaggle).
3. **Analisis AI Realistis (Simulasi)**: Menampilkan masker segmentasi visual (SVG blob) di atas area luka dan menghitung persentase proporsi serta perkiraan ukuran area luka dalam satuan cm².
4. **Grafik Perkembangan Berkala**: Menyajikan tren perkembangan luka yang menurun (membaik) dari waktu ke waktu secara teratur.
5. **Ekspor Laporan PDF**: Menyusun ringkasan sesi pelaporan berkala lengkap dengan komparasi visual foto awal vs terbaru dan tabel riwayat untuk dibagikan.

---

## 🛠️ Arsitektur & Teknologi
- **Struktur Core**: HTML5 Semantik, Vanilla CSS3 (Tanpa framework CSS agar performa maksimal), JavaScript Modern (ES6+).
- **Database Lokal**: **IndexedDB** untuk penyimpanan foto terkompresi (< 500 KB per berkas) dan data riwayat secara luring penuh (offline-first).
- **Service Worker**: PWA Caching untuk akses luring tanpa membutuhkan internet.
- **Pustaka Pihak Ketiga (via CDN)**:
  - **Chart.js**: Render grafik garis (*line chart*) progresif.
  - **jsPDF**: Pembuat dokumen PDF langsung dari peramban client.
- **Ikon & Tipografi**: Google Fonts *Be Vietnam Pro* & *Material Symbols Outlined*.

---

## 📁 Struktur Folder Proyek
```
Projek_Akhir/
├── index.html              ← Halaman utama tunggal (Single Page App)
├── manifest.json           ← Konfigurasi manifest instalasi PWA
├── sw.js                   ← Service Worker untuk akses luring
│
├── css/
│   ├── variables.css       ← Token desain (warna, huruf, bayangan)
│   ├── base.css            ← Reset global & tata letak dasar frame HP
│   ├── components.css      ← Tombol, kartu, form, modal, toast, navigasi
│   ├── animations.css      ← Transisi layar, pulsa masker, laser scan line
│   └── screens.css         ← Pengaturan tata letak spesifik per halaman
│
├── js/
│   ├── app.js              ← Router SPA, pengendali interaksi & alur layar
│   ├── db.js               ← CRUD IndexedDB (database lokal browser)
│   ├── camera.js           ← Manajer WebRTC MediaDevices, flash & upload
│   ├── ai-mock.js          ← Simulasi segmentasi & matematika progres
│   ├── chart.js            ← Konfigurasi render grafik Chart.js
│   ├── export.js           ← Pembuat laporan PDF berbasis jsPDF
│   └── utils.js            ← Kompresor gambar, format tanggal & ripple tap
│
└── assets/
    ├── icons/
    │   ├── icon-192.png    ← Ikon PWA 192px
    │   └── icon-512.png    ← Ikon PWA 512px
    └── dummy/
        ├── wound-1.jpg     ← Contoh foto luka 1 (Mulai - Besar)
        ├── wound-2.jpg     ← Contoh foto luka 2 (Progres - Sedang)
        └── wound-3.jpg     ← Contoh foto luka 3 (Hampir Sembuh - Kecil)
```

---

## ⚡ Cara Menjalankan Aplikasi Secara Lokal
Aplikasi ini memanfaatkan modul **WebRTC (Kamera)** dan **IndexedDB** yang memerlukan protokol aman (`https://`) atau lokal tepercaya (`http://localhost`) untuk berfungsi dengan baik.

1. **Gunakan Dev Server Ringan**:
   - Jika Anda memiliki Node.js, jalankan:
     ```bash
     npx http-server ./
     ```
   - Jika menggunakan Python, jalankan:
     ```bash
     python -m http-server 8000
     ```
   - Atau cukup gunakan ekstensi **Live Server** di VS Code.
2. **Akses via Peramban (Browser)**:
   - Buka alamat yang diberikan (misalnya `http://localhost:8080` atau `http://127.0.0.1:8000`).
3. **Instalasi PWA**:
   - Di Chrome desktop/HP: Klik ikon **Instal** (panah ke bawah di bilah alamat) untuk memasang aplikasi langsung ke layar utama perangkat Anda.

---

## 🚀 Skenario Demo Presentasi Tugas Akhir (5 - 7 Menit)
*Skenario ini dirancang khusus untuk mendemonstrasikan kedua fitur input secara adil dan menunjukkan grafik tren yang membaik secara meyakinkan tanpa membutuhkan pasien luka sungguhan.*

1. **Langkah 1: Perkenalan & Onboarding (Menit 0:00)**
   - Buka aplikasi. Tunjukkan layar Splash Screen yang memudar masuk ke halaman Onboarding.
   - Usap (*swipe/next*) 3 halaman Onboarding untuk memamerkan desain transisi yang premium dan animasi titik indikator.
   - Tekan tombol **Mulai Sekarang** (yang memiliki efek berkilau/shimmer menarik).
2. **Langkah 2: Buat Sesi Luka (Menit 0:45)**
   - Pada halaman utama yang kosong, klik tombol **+ Buat Sesi Baru**.
   - Isi formulir dengan nama sesi: `"Luka Kaki Kiri"`.
   - Pilih lokasi tubuh melalui *chip selector*: `"Kaki Kiri"`.
   - Tulis catatan tambahan, lalu klik **Buat Sesi**.
3. **Langkah 3: Demo Kamera HP - Deteksi Sehat (Menit 1:15)**
   - Halaman detail sesi akan memicu pilihan bawah (*bottom sheet*). Pilih **Kamera HP Live**.
   - Sorot kamera HP/laptop Anda ke area kulit yang sehat (misalnya telapak tangan).
   - Tekan tombol lingkaran capture. Aplikasi akan menampilkan efek lampu kilat putih dan masuk ke layar loading pemindaian laser AI.
   - Hasil analisis akan mendeteksi area **0.0% (Kulit Sehat)**. Simpan entri tersebut untuk membuktikan kamera HP berfungsi baik.
4. **Langkah 4: Demo Unggah Galeri - Progres Luka (Menit 2:30)**
   - Klik **Galeri** (atau Tambah Foto -> Galeri).
   - Unggah gambar **`wound-1.jpg`** dari folder `assets/dummy/` (mensimulasikan foto luka hari pertama).
   - AI akan mendeteksi area luka sebesar **~15% - 25%** dengan overlay masker visual. Tambahkan catatan *"Hari pertama luka jatuh"* lalu simpan.
   - Ulangi langkah di atas untuk mengunggah **`wound-2.jpg`** (mensimulasikan hari ke-5). AI secara otomatis memformulasikan tren menyusut (misalnya **~10%**). Simpan.
   - Ulangi untuk mengunggah **`wound-3.jpg`** (mensimulasikan hari ke-10). AI akan mendeteksi area luka sangat kecil (misalnya **~2%**). Simpan.
5. **Langkah 5: Pamerkan Analisis & Grafik (Menit 4:30)**
   - Scroll pada halaman detail sesi. Pamerkan grafik garis (*line chart*) progresif yang secara meyakinkan menurun dari hari pertama hingga terbaru.
   - Tunjukkan kartu perbandingan visual **Sebelum vs Sesudah** (*Before/After*) yang otomatis bersandingan secara dinamis.
   - Ketuk entri riwayat untuk memperlihatkan detail perluasan catatan (*expanded list*).
6. **Langkah 6: Ekspor Laporan PDF (Menit 5:30)**
   - Pindah ke tab **Laporan** di navigasi bawah.
   - Pilih sesi `"Luka Kaki Kiri"`. Preview ringkasan laporan akan tampil secara elegan.
   - Klik tombol **Ekspor Laporan PDF**. Buka file PDF yang terunduh dan tunjukkan tata letak dokumen A4 yang tertata rapi berisi logo, tabel data riwayat, dan panel perbandingan foto.
7. **Langkah 7: Demo Luring & Penutup (Menit 6:15)**
   - Pindah ke tab **Pengaturan**. Tunjukkan pembacaan otomatis kapasitas penyimpanan lokal IndexedDB.
   - Tutup aplikasi dan matikan koneksi internet, lalu buka kembali untuk membuktikan kemampuan luring (*offline capability*) PWA. Semua data tetap utuh tersimpan di perangkat lokal.
