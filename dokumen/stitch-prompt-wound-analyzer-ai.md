# 🩺 Stitch UI/UX Prompt — Wound Analyzer AI
## Aplikasi Mobile Monitoring Luka Berbasis AI (Flutter)

---

## 🎯 KONTEKS PROYEK

**Nama Aplikasi:** Wound Analyzer AI  
**Platform:** Mobile (Android & iOS) — Flutter  
**Target Pengguna:** Pasien luka kronis, caregiver keluarga, tenaga kesehatan lapangan  
**Tone & Feel:** Medical-grade tapi bukan dingin/steril — *warm clinical*. Bersih, terpercaya, mudah dipahami oleh orang awam. Mirip kombinasi antara **Headspace** (ramah, tenang) + **Samsung Health** (data-driven, clean). Bukan tampilan rumah sakit yang menakutkan.

**Palet Warna yang Direkomendasikan:**
- Primary: Deep Teal `#0D7377` atau Soft Medical Blue `#2563EB`
- Accent: Warm Amber `#F59E0B` (untuk tren membaik) / Coral Red `#EF4444` (memburuk) / Sage Green `#10B981` (stabil)
- Background: Off-white `#F8FAFC` atau `#FAFAF9` — bukan putih keras
- Cards: Pure White `#FFFFFF` dengan shadow lembut
- Text Primary: `#1E293B`, Secondary: `#64748B`

**Typography Style:** Clean, legible, non-intimidating. Cocok untuk pengguna 40-60 tahun.

---

## 📱 DAFTAR HALAMAN / SCREENS YANG DIBUTUHKAN

---

### 1. 🚀 ONBOARDING SCREENS (4 Slide)

**Tujuan:** Orientasi pengguna baru, minta izin kamera & penyimpanan.

**Slide 1 — Welcome**
- Ilustrasi: ikon atau animasi kamera + luka yang terhubung dengan grafik progres
- Headline: "Pantau Luka Anda Setiap Hari"
- Subtext: "Dokumentasi visual otomatis dengan AI, langsung dari kamera HP Anda"
- Tidak perlu scroll — satu viewport penuh
- Tombol: "Lanjut →" (bottom) + "Lewati" (top-right, text button)

**Slide 2 — Cara Kerja**
- 3 langkah visual berurutan (icon + text):
  1. 📸 Foto Luka → 2. 🤖 Analisis AI → 3. 📊 Lihat Progres
- Animasi sederhana: langkah 1→2→3 menyala bergantian
- Tombol: "Lanjut →"

**Slide 3 — Privasi & Keamanan**
- Icon: gembok + simbol HP
- Headline: "Data Anda Aman di HP Anda"
- Poin-poin (max 3 baris):
  - ✓ Semua data tersimpan lokal, tidak ke server
  - ✓ Tidak ada iklan, tidak ada pelacakan
  - ✓ Bisa dihapus kapan saja
- Tombol: "Lanjut →"

**Slide 4 — Izin Aplikasi**
- Headline: "Butuh Izin Kamera & Penyimpanan"
- Penjelasan singkat kenapa diperlukan
- Dua tombol izin (masing-masing dengan ikon):
  - "Izinkan Kamera" (primary button)
  - "Izinkan Penyimpanan" (secondary button)
- Tombol bawah: "Mulai Sekarang" (disabled sampai izin granted)
- Progress dots (4 dots) di bagian bawah setiap slide

---

### 2. 🏠 HOME SCREEN — Dashboard Utama

**Tujuan:** Overview semua sesi luka aktif + akses cepat ke aksi utama.

**Layout:**
- AppBar: Logo "Wound Analyzer" + ikon notifikasi (bell) kanan atas
- Greeting dinamis: "Selamat Pagi, 👋" dengan tanggal hari ini
- **Summary Card** (full-width, prominent):
  - Total sesi aktif: angka besar
  - Ringkasan: berapa sesi "membaik", "stabil", "memburuk" (3 chip berwarna)
  - Tanggal foto terakhir
- Section Header: "Sesi Luka Aktif" + link "Lihat Semua"
- **Daftar Session Cards** (scrollable vertikal):
  - Setiap card berisi:
    - Foto thumbnail luka terbaru (kiri, rounded)
    - Nama sesi (bold): contoh "Luka Kaki Kiri"
    - Lokasi tubuh: chip kecil (contoh "Kaki")
    - Tanggal mulai: "Mulai: 1 Jun 2025"
    - Status tren: badge berwarna → 📈 "Membaik" (hijau) / ➡️ "Stabil" (abu) / 📉 "Memburuk" (merah)
    - Persentase area luka terakhir: "8.2% area"
    - "Foto terakhir: 2 hari lalu"
    - Arrow icon kanan untuk navigasi
- **FAB (Floating Action Button):** + "Sesi Baru" di pojok kanan bawah, warna primary
- **Empty State** (jika belum ada sesi):
  - Ilustrasi sederhana (orang memegang HP)
  - Teks: "Belum ada sesi luka"
  - Sub: "Mulai dokumentasi pertama Anda"
  - Tombol: "+ Buat Sesi Pertama"

---

### 3. ➕ CREATE SESSION SCREEN — Buat Sesi Luka Baru

**Tujuan:** Input metadata awal sebelum mulai dokumentasi.

**Layout:** Form scrollable, bersih, satu kolom.

**Fields:**
- **Nama Sesi** (required):
  - Label: "Nama Luka"
  - Placeholder: "contoh: Luka Kaki Kiri"
  - Char counter (max 50 karakter)
- **Lokasi Tubuh** (required):
  - Label: "Area Tubuh"
  - Implementasi: Grid chip selector (bukan dropdown), pilihan:
    - Kepala | Leher | Lengan Kanan | Lengan Kiri
    - Dada | Perut | Punggung | Pinggul
    - Kaki Kanan | Kaki Kiri | Lainnya
  - Multi-select chip dengan toggle visual (selected = filled teal)
- **Tanggal Mulai** (required):
  - Label: "Tanggal Mulai Pemantauan"
  - Date picker dengan default = hari ini
- **Catatan Awal** (optional):
  - Label: "Catatan (opsional)"
  - Multiline text field, max 3 baris
  - Placeholder: "Kondisi awal luka, riwayat pengobatan, dll."
- **Tombol Simpan:**
  - Primary button full-width: "Buat Sesi & Mulai Foto"
  - Disabled jika nama & lokasi belum diisi

**Header:** Back button kiri + "Sesi Baru" title di tengah

---

### 4. 📸 CAMERA SCREEN — Pengambilan Foto Luka

**Tujuan:** Antarmuka kamera dengan panduan untuk konsistensi foto.

**Layout:** Full-screen camera preview dengan overlay UI.

**Elemen UI:**
- **Camera Viewfinder:** Penuh layar
- **Guide Overlay:**
  - Grid 3x3 (rule-of-thirds, warna putih transparan tipis)
  - Rounded rectangle guide di tengah: "Posisikan luka di dalam area ini"
  - Label jarak: "Jarak ideal: 15-30 cm"
- **Tips Bar** (di atas tombol capture):
  - Scrollable tips singkat:
    - 💡 "Cahaya cukup — hindari bayangan langsung"
    - 📐 "Pegang HP tegak lurus di atas luka"
    - 🔆 "Gunakan flash jika cahaya kurang"
- **Bottom Controls:**
  - Kiri: Thumbnail galeri (buka image picker)
  - Tengah: **Shutter Button** — lingkaran besar putih dengan ring luar
  - Kanan: Flash toggle (off/on/auto)
- **Top Controls:**
  - Kiri: Close/Back button (X)
  - Tengah: Nama sesi yang sedang aktif
  - Kanan: Flip kamera (front/back)
- **Zoom indicator** (pinch-to-zoom dengan indicator bar di sisi)

---

### 5. 🤖 ANALYSIS RESULT SCREEN — Hasil Analisis AI

**Tujuan:** Menampilkan hasil segmentasi AI dan menyimpan entri.

**Layout:** Single-scroll screen, fokus pada foto + data.

**Section 1 — Foto dengan Overlay Mask:**
- Full-width foto luka dengan **overlay merah transparan** di area yang terdeteksi sebagai luka
- Toggle switch: "Tampilkan Overlay" (on/off)
- Foto interaktif: bisa zoom/pan
- Chip di atas foto: "📍 [Nama Sesi]" + tanggal/waktu

**Section 2 — Hasil Analisis:**
- Card besar dengan metric utama:
  - Angka persentase besar (misal **"8.2%"**) — headline
  - Label di bawah: "Area Luka Terdeteksi"
  - Sub-label: "dari total area pengambilan gambar"
- **Tren Indicator** (jika bukan foto pertama):
  - Arrow up/down + perubahan: "↑ +1.3% dari foto sebelumnya" (merah)
  - ATAU "↓ -2.1% dari foto sebelumnya" (hijau = membaik)
  - ATAU "→ Tidak ada perubahan signifikan" (abu)
- Status Label: Badge "Membaik" / "Stabil" / "Memburuk"

**Section 3 — Mini Chart Preview:**
- Line chart kecil (sparkline) menampilkan 5 entri terakhir
- X-axis: tanggal, Y-axis: % area
- Titik terbaru di-highlight

**Section 4 — Catatan:**
- Text field: "Tambahkan catatan untuk foto ini..."
- Contoh placeholder: "Kondisi luka hari ini, obat yang dioleskan, dll."

**Bottom Actions:**
- Primary button: "✓ Simpan Entri"
- Secondary button (outline): "🔄 Foto Ulang"
- Danger/text button: "🗑 Buang Foto Ini"

---

### 6. 📋 SESSION DETAIL SCREEN — Detail Sesi Luka

**Tujuan:** Overview satu sesi lengkap dengan semua data dan foto.

**Layout:** Tab-based + Sticky Header

**Sticky Header:**
- Foto terbaru (thumbnail kecil kiri) + nama sesi (bold) + status badge
- Lokasi tubuh + tanggal mulai
- Edit icon (pensil) di kanan

**Tab 1 — Ringkasan:**
- **Progress Card:**
  - Perbandingan foto pertama vs terbaru (side-by-side mini preview)
  - Perubahan total: "Total berkurang: 3.8% area"
  - Durasi pemantauan: "Sudah 14 hari"
  - Total foto diambil: "12 foto"
- **Stat Row** (3 chip horizontal):
  - Foto terbaru: "2 hari lalu"
  - Area saat ini: "6.4%"
  - Tren 7 hari: "↓ Membaik"
- **Quick Chart:**
  - Line chart sedang, menampilkan seluruh history
  - Tap untuk masuk ke chart full-screen

**Tab 2 — Timeline Foto:**
- ListView vertikal dengan grup berdasarkan bulan
- Setiap entri:
  - Foto thumbnail (kiri, square rounded)
  - Tanggal & waktu
  - Persentase area + perubahan dari sebelumnya (delta dengan warna)
  - Catatan (truncated 1 baris jika ada)
  - Chevron kanan → detail entri
- Long press: opsi "Hapus entri ini"
- FAB: + "Tambah Foto Baru" (menavigasi ke kamera)

**Tab 3 — Grafik:**
- Full chart interaktif (fl_chart style):
  - Line chart area luka (%) vs waktu
  - Tap titik = tooltip dengan tanggal, %, delta
  - Zoom + pan horizontal
  - Tombol filter: 7H | 1B | 3B | Semua
  - Rata-rata tren (dashed line)
  - Area di bawah kurva berwarna sesuai tren (hijau/merah/abu gradasi)

---

### 7. 🔍 WOUND ENTRY DETAIL SCREEN — Detail Satu Foto

**Tujuan:** View lengkap satu entri foto dengan semua metadata.

**Layout:** Scrollable, foto dominan di atas.

**Section 1 — Foto:**
- Foto full-width, aspect ratio original
- Overlay mask toggle (switch di pojok foto)
- Gesture: pinch-to-zoom, double-tap to zoom 2x
- Chip tanggal & waktu di atas foto

**Section 2 — Data Analisis:**
- Area luka: angka besar + satuan
- Perubahan dari sebelumnya: delta + arrow + warna
- Status: badge besar

**Section 3 — Catatan:**
- Text catatan pengguna (editable, tap-to-edit)
- Placeholder jika kosong: "Belum ada catatan — tap untuk tambahkan"

**Section 4 — Aksi:**
- "Bandingkan dengan Foto Lain" → masuk Compare Screen
- "Hapus Entri Ini" (merah, destructive)

**AppBar:**
- Back button
- "Entri [Tanggal]" sebagai title
- Share icon (share foto ini)

---

### 8. ↔️ COMPARE SCREEN — Perbandingan Dua Foto

**Tujuan:** Melihat dua foto secara side-by-side untuk bandingkan kondisi luka.

**Layout:** Dua panel vertikal berdampingan.

**Header:**
- "Perbandingan Foto" + back button
- Label di bawah: "[Nama Sesi]"

**Panel Kiri & Kanan (masing-masing ~50% lebar):**
- Foto luka (dengan/tanpa mask, sesuai toggle)
- Tanggal foto di bawah
- Persentase area luka

**Tengah (separator area):**
- Drag handle (slider vertikal) untuk mengubah proporsi panel kiri/kanan
- ATAU: Swiping reveal (foto bawah tersembunyi di balik foto atas)

**Bottom Info Panel:**
- Perbandingan data:
  - Tanggal foto A: [tanggal] → Tanggal foto B: [tanggal]
  - Area A: 10.2% → Area B: 6.8%
  - Selisih: "↓ 3.4% — Membaik!"
  - Durasi antara dua foto: "14 hari"
- Tombol "Ganti Foto" untuk kedua panel (opens date picker / thumbnail grid)

**Toggle global:** "Tampilkan Overlay Mask" — berlaku untuk kedua panel

---

### 9. 📊 PROGRESS CHART SCREEN — Grafik Full Screen

**Tujuan:** Analisis tren mendalam dengan grafik interaktif.

**Layout:** Full screen dengan chart dominan.

**Header:**
- Back button + "[Nama Sesi] — Grafik Progres"

**Chart Area (60% layar):**
- Line chart dengan area shading
- Dot pada setiap data point (tap = tooltip)
- Tooltip berisi: tanggal, % area, delta vs sebelumnya
- Pinch zoom horizontal
- Reference line: "Rata-rata" (dashed, abu)

**Filter Bar (di atas chart):**
- Chip toggle: 7 Hari | 1 Bulan | 3 Bulan | Semua

**Stats Summary (di bawah chart):**
- 4 kartu statistik dalam grid 2x2:
  1. Area Terbesar: "12.4%" (tanggal)
  2. Area Terkecil: "5.1%" (tanggal)
  3. Total Perubahan: "-7.3%" (dari awal)
  4. Tren 7 Hari: "Membaik ↓"

**Table Section (bisa di-collapse):**
- Tabel data: Tanggal | Area % | Perubahan | Status
- Sortable kolom
- Max 10 baris tampil, dengan "Lihat Semua" di bawah

---

### 10. 📄 EXPORT / REPORT SCREEN — Laporan & Export

**Tujuan:** Generate dan share laporan PDF atau CSV.

**Layout:** Single scroll, preview laporan + aksi export.

**Header:**
- Back button + "Laporan" title

**Section 1 — Pilih Sesi:**
- Dropdown atau list pilihan sesi yang akan di-export
- Multi-select jika ingin export semua sesi

**Section 2 — Konfigurasi Laporan:**
- Toggle-toggle kecil:
  - ✓ Sertakan semua foto (atau "Pilih rentang tanggal")
  - ✓ Sertakan grafik progres
  - ✓ Sertakan tabel data
  - ✓ Sertakan catatan
  - ○ Sertakan catatan medis (optional input)
- Date range picker (tanggal mulai s/d akhir)
- Nama dokter / klinik (opsional, untuk header laporan)

**Section 3 — Preview Laporan:**
- Card preview halaman pertama laporan PDF (thumbnail non-interaktif):
  - Header: Logo app + nama sesi + periode
  - Foto pertama & terakhir (side by side)
  - Grafik mini
- Label: "Preview Laporan"

**Section 4 — Tombol Export:**
- Primary: "📄 Export PDF" (full-width)
- Secondary: "📊 Export CSV" (full-width, outline)
- Setelah generate: bottom sheet share muncul dengan opsi:
  - WhatsApp, Email, Simpan ke File, Cetak

---

### 11. 🔔 NOTIFICATION / REMINDER SETTINGS SCREEN

**Tujuan:** Atur pengingat foto harian.

**Layout:** Simple settings screen.

**Konten:**
- Toggle utama: "Aktifkan Pengingat Harian" (on/off)
- Jika ON, tampilkan:
  - Time Picker: "Waktu Pengingat" — default 08:00
  - Day selector: hari-hari dalam seminggu (chip toggle: Sen Sel Rab Kam Jum Sab Min)
  - Preview teks: "Pengingat aktif: Setiap hari pukul 08:00"
- Notification Preview: simulasi tampilan notifikasi di HP
- Tombol "Simpan Pengaturan"

---

### 12. ⚙️ SETTINGS SCREEN — Pengaturan Aplikasi

**Tujuan:** Konfigurasi umum aplikasi.

**Layout:** Standard settings dengan ListTile.

**Sections:**
- **Umum:**
  - Bahasa: Indonesia / English
  - Ukuran Font: Kecil / Normal / Besar
  - Tema: Terang / Gelap / Ikuti Sistem
- **Notifikasi:**
  - → masuk ke Notification Settings Screen
- **Data & Privasi:**
  - Backup Data (export semua data sebagai ZIP)
  - Hapus Semua Data (destructive, confirm dialog)
  - Kebijakan Privasi (external link)
- **Tentang:**
  - Versi aplikasi
  - Info pengembang
  - Disclaimer medis
  - Sumber dataset (Kaggle)

---

### 13. ❌ ERROR / LOADING STATES (States Penting)

**Loading State — Saat AI Memproses:**
- Full overlay gelap semi-transparan di atas foto
- Spinner / progress indicator melingkar (animated)
- Teks beranimasi:
  - "Mendeteksi area luka..." → "Menghitung ukuran..." → "Hampir selesai..."
- Estimasi waktu: "Biasanya kurang dari 2 detik"

**Error State — Model Gagal:**
- Ilustrasi lembut (ikon HP + tanda tanya)
- Heading: "Analisis Gagal"
- Subtext: "Kami tidak bisa mendeteksi area luka. Pastikan foto cukup terang dan luka terlihat jelas."
- Tombol: "Coba Foto Ulang" + "Simpan Tanpa Analisis"

**Empty State — Tidak Ada Foto:**
- Ilustrasi: kalender kosong atau kamera sederhana
- Teks: "Belum ada foto untuk sesi ini"
- Sub: "Ambil foto pertama untuk mulai memantau perkembangan luka"
- Tombol: "📸 Ambil Foto Sekarang"

**No Wound Detected State:**
- Overlay kuning/amber
- Teks: "Luka tidak terdeteksi di foto ini"
- Saran: "Coba ambil foto lebih dekat, atau pastikan area luka terlihat"
- Tombol: "Foto Ulang" + "Tetap Simpan Foto"

---

## 🧩 KOMPONEN UI REUSABLE

### Session Card
- Thumbnail foto + info ringkas + status badge
- Digunakan di Home Screen dan Select Session (export)

### Wound Progress Badge
- Small chip: warna + ikon arrow + label "Membaik/Stabil/Memburuk"
- Digunakan hampir di semua screen yang menampilkan data sesi

### Mini Sparkline Chart
- Chart kecil horizontal showing 5-7 titik data terakhir
- Digunakan di Session Card dan Result Screen

### Mask Overlay Toggle
- Switch kecil dengan label "Tampilkan Overlay"
- Konsisten di semua screen yang menampilkan foto luka

### Photo Thumbnail with Overlay
- Foto dengan mask overlay merah transparan
- Border radius 12px, shadow lembut
- Tap → masuk ke full detail

---

## 📐 SPESIFIKASI TEKNIS UNTUK STITCH

| Atribut | Nilai |
|---|---|
| Platform Target | Android & iOS (Mobile) |
| Framework | Flutter (Dart) |
| Min Screen Width | 360px |
| Layout | Single-column, mobile-first |
| Navigasi | Bottom Tab (opsional) atau Stack Navigation |
| State Kosong | Selalu ada empty state di setiap list |
| Aksesibilitas | Font bisa 14-18px, contrast ratio ≥ 4.5:1 |
| Gesture | Swipe back, pinch-to-zoom pada foto |

---

## 🎨 DESIGN TOKENS YANG DISARANKAN

```
Color Palette:
- primary: #0D7377 (Deep Teal)
- primary-light: #14A0A5
- primary-dark: #095E62
- accent-success: #10B981 (Membaik/Improving)
- accent-warning: #F59E0B (Stabil/Stable)
- accent-danger: #EF4444 (Memburuk/Worsening)
- background: #F8FAFC
- surface: #FFFFFF
- text-primary: #1E293B
- text-secondary: #64748B
- text-hint: #94A3B8
- border: #E2E8F0
- overlay-wound: rgba(239, 68, 68, 0.45) — mask luka

Spacing Scale: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48px

Border Radius: 8 / 12 / 16 / 24 / 32px (rounded-xl untuk card)

Shadow:
- card: 0 2px 8px rgba(0,0,0,0.08)
- elevated: 0 4px 16px rgba(0,0,0,0.12)

Typography:
- heading-xl: 28px bold
- heading-lg: 22px semibold
- heading-md: 18px semibold
- body: 14-16px regular
- label: 12px medium
- caption: 11px regular
```

---

## 🗺️ USER FLOW UTAMA (untuk referensi navigasi)

```
[Onboarding] → [Home]
     |
     └─ Home
         ├─ + FAB → [Create Session] → [Camera] → [Result] → [Session Detail]
         ├─ Tap Session Card → [Session Detail]
         │       ├─ Tab Timeline → [Entry Detail] → [Compare Screen]
         │       ├─ Tab Chart → [Full Chart Screen]
         │       └─ + FAB → [Camera] → [Result]
         └─ Menu / Bottom Nav
                 ├─ [Export/Report Screen]
                 └─ [Settings] → [Notification Settings]
```

---

## 💡 CATATAN TAMBAHAN UNTUK STITCH

1. **Foto luka adalah elemen utama** — desain harus memberikan ruang penuh untuk foto di semua screen yang relevan
2. **Mask overlay** adalah fitur AI kunci — toggle harus selalu terlihat saat foto ditampilkan
3. **Tren indicator** (badge + warna) adalah informasi paling penting kedua — harus langsung terbaca tanpa penjelasan
4. **Aplikasi ini untuk orang non-teknis** — hindari jargon, gunakan bahasa kasual ("area luka", bukan "segmentation area ratio")
5. **Offline-first** — tidak ada loading spinner untuk data lama; hanya untuk inferensi AI
6. **Disclaimer medis** — pertimbangkan menambahkan footer kecil "Bukan alat diagnosis medis" di screen Result dan Report
7. **Warna merah** digunakan untuk mask luka (bukan untuk error) — hati-hati konsistensi penggunaan warna merah

---

*Prompt ini dibuat berdasarkan PRD + Implementation Plan Wound Analyzer AI v1.0*  
*Skripsi Teknik Informatika | Flutter + TensorFlow Lite + AI Segmentation*
