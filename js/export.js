/* js/export.js */

/**
 * Generate and download a PDF report for a session.
 * @param {Object} session - The session object
 * @param {Array} entries - The chronological list of entries
 * @returns {Promise<boolean>} Success state
 */
async function exportSessionToPDF(session, entries) {
  if (!session) {
    throw new Error('Sesi tidak valid untuk diekspor');
  }
  if (!entries || entries.length === 0) {
    throw new Error('Sesi belum memiliki foto untuk dilaporkan');
  }
  if (!window.jspdf) {
    throw new Error('Pustaka PDF (jsPDF) tidak termuat. Pastikan Anda terhubung ke internet untuk mengunduh laporan.');
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm
  
  let currentY = 15;

  // --- 1. BRAND HEADER ---
  doc.setFillColor(19, 27, 46); // Deep Slate (#131b2e)
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('LAPORAN PERKEMBANGAN LUKA', 15, 18);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Dihasilkan secara otomatis oleh Wound Analyzer AI', 15, 24);
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TA Sistem Multimedia', pageWidth - 15, 18, { align: 'right' });
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Unduh: ${new Date().toLocaleDateString('id-ID')}`, pageWidth - 15, 24, { align: 'right' });
  
  currentY = 40;

  // --- 2. SESSION METADATA ---
  doc.setFillColor(248, 249, 255); // Background light (#f8f9ff)
  doc.setDrawColor(198, 198, 205); // Outline (#c6c6cd)
  doc.roundedRect(15, currentY, pageWidth - 30, 32, 3, 3, 'FD');

  doc.setTextColor(11, 28, 48); // On surface
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(session.name, 20, currentY + 8);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Lokasi Tubuh: ${session.bodyLocation}`, 20, currentY + 16);
  doc.text(`Mulai Dipantau: ${window.WoundUtils.formatDate(session.createdAt)}`, 20, currentY + 24);

  // Latest status metrics on the right side
  const latestEntry = entries[entries.length - 1];
  const firstEntry = entries[0];
  const totalChange = latestEntry.areaCm2 - firstEntry.areaCm2;
  const progressPercent = latestEntry.areaPercent;
  
  let trendText = 'Stabil';
  if (latestEntry.trend === 'improving') trendText = 'Membaik';
  if (latestEntry.trend === 'worsening') trendText = 'Memburuk';

  doc.setFont('Helvetica', 'bold');
  doc.text(`Jumlah Foto: ${entries.length}`, pageWidth - 25, currentY + 8, { align: 'right' });
  
  doc.setFont('Helvetica', 'normal');
  doc.text(`Ukuran Terkini: ${latestEntry.areaCm2} cm² (${progressPercent}%)`, pageWidth - 25, currentY + 16, { align: 'right' });
  
  // Highlight trend in color if possible
  if (latestEntry.trend === 'improving') {
    doc.setTextColor(0, 107, 95); // Teal
  } else if (latestEntry.trend === 'worsening') {
    doc.setTextColor(186, 26, 26); // Red
  }
  doc.setFont('Helvetica', 'bold');
  doc.text(`Tren: ${trendText} (${totalChange <= 0 ? '' : '+'}${totalChange.toFixed(1)} cm²)`, pageWidth - 25, currentY + 24, { align: 'right' });
  
  currentY += 40;

  // --- 3. TIMELINE TABLE ---
  doc.setTextColor(11, 28, 48);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Riwayat Dokumentasi Berkala', 15, currentY);
  currentY += 5;

  // Table Headers
  const tableHeaders = ['No', 'Tanggal', 'Sumber', 'Area (%)', 'Ukuran', 'Perubahan', 'Catatan'];
  const colWidths = [10, 30, 22, 22, 22, 24, 50]; // Total: 180mm
  const startX = 15;

  doc.setFillColor(19, 27, 46);
  doc.rect(startX, currentY, pageWidth - 30, 8, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  
  let headerX = startX;
  tableHeaders.forEach((header, index) => {
    doc.text(header, headerX + 2, currentY + 5.5);
    headerX += colWidths[index];
  });
  
  currentY += 8;

  // Table Rows
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  
  entries.forEach((entry, idx) => {
    // Alternating row color
    if (idx % 2 === 1) {
      doc.setFillColor(239, 244, 255);
      doc.rect(startX, currentY, pageWidth - 30, 7.5, 'F');
    }
    
    doc.setTextColor(11, 28, 48);
    let rowX = startX;
    
    // No
    doc.text((idx + 1).toString(), rowX + 2, currentY + 5);
    rowX += colWidths[0];
    
    // Tanggal
    const entryDate = new Date(entry.takenAt).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    doc.text(entryDate, rowX + 2, currentY + 5);
    rowX += colWidths[1];
    
    // Sumber
    const sourceLabel = entry.source === 'camera' ? 'Kamera HP' : 'Galeri';
    doc.text(sourceLabel, rowX + 2, currentY + 5);
    rowX += colWidths[2];
    
    // Area (%)
    doc.text(`${entry.areaPercent}%`, rowX + 2, currentY + 5);
    rowX += colWidths[3];
    
    // Ukuran (cm²)
    doc.text(`${entry.areaCm2} cm²`, rowX + 2, currentY + 5);
    rowX += colWidths[4];
    
    // Perubahan (delta)
    let changeLabel = '-';
    if (idx > 0) {
      const delta = entry.areaChange;
      changeLabel = delta < 0 ? `${delta} cm²` : delta > 0 ? `+${delta} cm²` : '0 cm²';
      if (delta < 0) {
        doc.setTextColor(0, 107, 95);
      } else if (delta > 0) {
        doc.setTextColor(186, 26, 26);
      }
    }
    doc.text(changeLabel, rowX + 2, currentY + 5);
    doc.setTextColor(11, 28, 48);
    rowX += colWidths[5];
    
    // Catatan
    const note = entry.notes ? (entry.notes.length > 25 ? entry.notes.slice(0, 22) + '...' : entry.notes) : '-';
    doc.text(note, rowX + 2, currentY + 5);
    
    currentY += 7.5;
  });

  currentY += 10;

  // --- 4. VISUAL TIMELINE COMPARISON (FIRST & LATEST PHOTO) ---
  doc.setTextColor(11, 28, 48);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Perbandingan Visual Progres Kondisi Luka', 15, currentY);
  currentY += 6;

  // Layout First and Last Photos side by side
  const imgWidth = 75;
  const imgHeight = 56;
  const gap = 10;
  
  // Left Panel: First photo
  doc.setFillColor(248, 249, 255);
  doc.roundedRect(15, currentY, imgWidth + 10, imgHeight + 16, 2, 2, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DOKUMENTASI AWAL', 20, currentY + 6);
  doc.setFont('Helvetica', 'normal');
  doc.text(`Tgl: ${window.WoundUtils.formatDate(firstEntry.takenAt)}`, 20, currentY + 11);
  doc.text(`Ukuran: ${firstEntry.areaCm2} cm² (${firstEntry.areaPercent}%)`, 20, currentY + 15);
  
  // Right Panel: Latest photo
  doc.setFillColor(248, 249, 255);
  doc.roundedRect(pageWidth - 15 - (imgWidth + 10), currentY, imgWidth + 10, imgHeight + 16, 2, 2, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.text('DOKUMENTASI AKHIR', pageWidth - 20 - imgWidth, currentY + 6);
  doc.setFont('Helvetica', 'normal');
  doc.text(`Tgl: ${window.WoundUtils.formatDate(latestEntry.takenAt)}`, pageWidth - 20 - imgWidth, currentY + 11);
  doc.text(`Ukuran: ${latestEntry.areaCm2} cm² (${latestEntry.areaPercent}%)`, pageWidth - 20 - imgWidth, currentY + 15);
  
  // Convert and add images (async helper handling)
  try {
    const firstImgDataUrl = await window.WoundUtils.blobToDataURL(firstEntry.photoBlob);
    doc.addImage(firstImgDataUrl, 'JPEG', 20, currentY + 18, imgWidth, imgHeight);
  } catch (err) {
    doc.setFillColor(220, 220, 220);
    doc.rect(20, currentY + 18, imgWidth, imgHeight, 'F');
    doc.setFont('Helvetica', 'italic');
    doc.text('Gagal memuat gambar', 20 + imgWidth/2, currentY + 18 + imgHeight/2, { align: 'center' });
  }

  try {
    const latestImgDataUrl = await window.WoundUtils.blobToDataURL(latestEntry.photoBlob);
    doc.addImage(latestImgDataUrl, 'JPEG', pageWidth - 20 - imgWidth, currentY + 18, imgWidth, imgHeight);
  } catch (err) {
    doc.setFillColor(220, 220, 220);
    doc.rect(pageWidth - 20 - imgWidth, currentY + 18, imgWidth, imgHeight, 'F');
    doc.setFont('Helvetica', 'italic');
    doc.text('Gagal memuat gambar', pageWidth - 20 - imgWidth/2, currentY + 18 + imgHeight/2, { align: 'center' });
  }

  currentY += imgHeight + 25;

  // --- 5. DISCLAIMER & FOOTER ---
  doc.setFont('Helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(118, 119, 125); // outline gray color
  const disclaimerText = [
    'Peringatan Medis: Laporan analisis ini dihasilkan menggunakan simulasi modular kecerdasan buatan.',
    'Informasi di atas hanya berfungsi sebagai bantuan dokumentasi visual berkala untuk perkembangan penyembuhan luka.',
    'Laporan ini bukan merupakan saran diagnosis medis formal. Konsultasikan perkembangan luka Anda dengan dokter spesialis secara berkala.'
  ];
  
  let disclaimerY = pageHeight - 24;
  disclaimerText.forEach(line => {
    doc.text(line, pageWidth / 2, disclaimerY, { align: 'center' });
    disclaimerY += 4;
  });

  // Save/Download PDF file
  const filename = `Laporan_Luka_${session.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
  return true;
}

// Attach to global scope
window.WoundExporter = {
  exportSessionToPDF
};
