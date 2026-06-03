/* js/app.js */

// Global App State
const AppState = {
  currentScreen: 'screen-splash',
  currentSessionId: null,
  activeTab: 'tab-home', // 'tab-home' | 'tab-reports' | 'tab-settings'
  onboardingIndex: 0,
  capturedBlob: null,
  capturedSource: 'gallery', // 'camera' | 'gallery'
  analysisResult: null,
  selectedReportSessionId: null,
  firstInstall: true
};

// Shorthand query selectors
// Functions are globally available from utils.js

/**
 * Main application initializer
 */
async function initApp() {
  // Init Ripple animations
  window.WoundUtils.initRippleListeners();

  // Check if onboarding completed before
  const onboarded = localStorage.getItem('onboarding_completed');
  if (onboarded === 'true') {
    AppState.firstInstall = false;
  }

  // Setup routing bindings
  setupEventBindings();

  // Register PWA Service Worker for offline capabilities
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('sw.js');
      console.log('Service Worker registered successfully with scope:', reg.scope);
    } catch (err) {
      console.error('Service Worker registration failed:', err);
    }
  }

  // Start with Splash Screen
  navigateTo('screen-splash');
}

// ==========================================
// DUMMY DATA SEEDER (CO2Wounds-V2 Leprosy Dataset)
// ==========================================
async function seedDummyData() {
  console.log("Seeding 3 dummy sessions with real Kaggle Leprosy Dataset images...");
  try {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    // 1. Ulkus Neuropatik (Plantar) - Khas Kusta
    const s1 = await window.WoundDb.createSession({
      name: 'Ulkus Neuropatik Plantar',
      bodyLocation: 'Kaki Kanan',
      notes: 'Pasien Tn. Budi (Kusta Tipe MB)'
    });
    await addDummyEntry(s1, 'wound1.jpg', 
      25.5, 45.2, 29.3, // necrotic, slough, granulation
      'worsening', 
      'Terdeteksi area nekrotik yang meluas di tepi luka. Jaringan slough mendominasi dasar luka akibat kurangnya vaskularisasi saraf tepi kaki. Disarankan debridement lanjutan dan pemeriksaan tekanan biomekanik pada area ulkus kaki kanan.',
      now - 2 * dayMs // 2 days ago
    );
    
    // 2. Ulkus Kronis Tungkai (Lesi Kusta) - 2 PHOTOS (TIMELINE)
    const s2 = await window.WoundDb.createSession({
      name: 'Ulkus Kronis Tungkai Bawah',
      bodyLocation: 'Kaki Kiri',
      notes: 'Pasien Ny. Siti (Riwayat Reaksi Reversal)'
    });
    // Entry 1 (14 days ago)
    await addDummyEntry(s2, 'wound2.jpg', 
      45.0, 40.0, 15.0, 
      'stable', 
      'Kunjungan awal: Luka didominasi jaringan mati hitam (eschar) dan slough tebal kekuningan. Mulai perawatan moist wound healing dan salep proteolitik.',
      now - 14 * dayMs
    );
    // Entry 2 (Today)
    await addDummyEntry(s2, 'wound4.jpg', 
      5.0, 30.0, 65.0, 
      'improving', 
      'Perkembangan sangat baik setelah 2 minggu. Area granulasi (jaringan merah sehat) kini mendominasi dasar luka sebesar 65%. Jaringan mati (nekrotik) sudah hampir bersih total. Pertahankan balutan.',
      now
    );
    
    // 3. Luka Lesi Ekstremitas Atas
    const s3 = await window.WoundDb.createSession({
      name: 'Lesi Tropik Lengan Kanan',
      bodyLocation: 'Lengan Kanan',
      notes: 'Observasi rawat jalan Hari ke-14'
    });
    await addDummyEntry(s3, 'wound3.jpg', 
      0.0, 15.0, 85.0, // necrotic, slough, granulation
      'stable', 
      'Kondisi luka stabil dan mulai memasuki fase epitelisasi. Tepi luka terlihat menyempit dengan jaringan granulasi yang padat. Tidak ditemukan tanda-tanda infeksi sekunder pada lesi.',
      now - 5 * dayMs // 5 days ago
    );
    
    console.log("Dummy data seeded successfully.");
  } catch (err) {
    console.warn("Failed to seed dummy data:", err);
  }
}

async function addDummyEntry(sessionId, imgUrl, necrotic, slough, granulation, trend, aiNotes, timestampOverride = null) {
  try {
    let blob;
    // Fallback: If it's one of the dummy image keys, load from base64 global
    if (window.DUMMY_IMAGES && window.DUMMY_IMAGES[imgUrl]) {
      const dataUrl = window.DUMMY_IMAGES[imgUrl];
      // Convert base64 dataURL directly to Blob to avoid any fetch CORS/network issues
      const arr = dataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      blob = new Blob([u8arr], { type: mime });
    } else {
      const res = await fetch('./assets/dummy/' + imgUrl);
      blob = await res.blob();
    }
    
    // Set a realistic areaPercent:
    let areaPercent = 10.0;
    if (imgUrl === 'wound1.jpg') areaPercent = 12.5;
    else if (imgUrl === 'wound2.jpg') areaPercent = 15.0;
    else if (imgUrl === 'wound4.jpg') areaPercent = 8.3;
    else if (imgUrl === 'wound3.jpg') areaPercent = 4.2;

    const areaCm2 = Math.round(areaPercent * 1.2 * 10) / 10;
    
    // Calculate areaChange if we have previous entries for this session
    let areaChange = 0;
    const previousEntries = await window.WoundDb.getEntriesBySession(sessionId);
    if (previousEntries.length > 0) {
      const lastEntry = previousEntries[previousEntries.length - 1];
      areaChange = Math.round((areaCm2 - lastEntry.areaCm2) * 10) / 10;
    }

    // Generate a mock mask SVG path
    const mockBox = { minX: 100, maxX: 300, minY: 80, maxY: 220 };
    const maskPath = window.WoundAI ? window.WoundAI.generateDynamicMask(mockBox, 400, 300, areaPercent) : '';

    // Create the entry object in the schema format expected by WoundDb.addEntry
    const entryObj = {
      sessionId: sessionId,
      photoBlob: blob,
      source: 'gallery',
      maskData: { path: maskPath },
      areaPercent: areaPercent,
      areaCm2: areaCm2,
      areaChange: areaChange,
      trend: trend,
      confidence: 95,
      notes: aiNotes,
      takenAt: timestampOverride || Date.now()
    };
    
    await window.WoundDb.addEntry(entryObj);
  } catch (e) {
    console.warn("Could not add dummy image:", e);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

/**
 * Screen Navigator
 * @param {string} screenId - HTML ID of the target screen
 * @param {Object} data - Parameters to pass to the screen initializer
 */
async function navigateTo(screenId, data = null) {
  const previousScreen = AppState.currentScreen;
  AppState.currentScreen = screenId;

  // Stop camera if navigating away from camera screen
  if (previousScreen === 'screen-camera' && screenId !== 'screen-camera') {
    window.WoundCamera.stopCamera();
  }

  // Hide all screens
  $$('.screen-container').forEach(screen => {
    screen.classList.add('hidden');
    screen.classList.remove('screen-enter-right', 'screen-enter-left', 'screen-fade-in');
  });

  // Reveal target screen
  const targetScreen = $(`#${screenId}`);
  if (!targetScreen) {
    console.error(`Screen ID #${screenId} not found`);
    return;
  }
  
  targetScreen.classList.remove('hidden');

  // Apply smooth page transition animation based on navigation type
  if (screenId === 'screen-splash') {
    targetScreen.classList.add('screen-fade-in');
  } else if (screenId === 'screen-home') {
    targetScreen.classList.add('screen-fade-in');
  } else if (previousScreen === 'screen-splash' && screenId === 'screen-onboarding') {
    targetScreen.classList.add('screen-fade-in');
  } else if (previousScreen === 'screen-onboarding' && screenId === 'screen-home') {
    targetScreen.classList.add('screen-fade-in');
  } else if (screenId === 'screen-create-session' || screenId === 'screen-camera') {
    targetScreen.classList.add('screen-enter-right');
  } else if (screenId === 'screen-session-detail' && previousScreen === 'screen-home') {
    targetScreen.classList.add('screen-enter-right');
  } else if (screenId === 'screen-session-detail' && previousScreen === 'screen-analysis-result') {
    targetScreen.classList.add('screen-fade-in');
  } else {
    targetScreen.classList.add('screen-fade-in');
  }

  // Execute Screen-Specific Init logic
  switch (screenId) {
    case 'screen-splash':
      initSplashScreen();
      break;
    case 'screen-onboarding':
      initOnboardingScreen();
      break;
    case 'screen-home':
      await initHomeScreen();
      break;
    case 'screen-create-session':
      initCreateSessionScreen();
      break;
    case 'screen-camera':
      await initCameraScreen(data);
      break;
    case 'screen-loading-analysis':
      await initLoadingAnalysisScreen(data);
      break;
    case 'screen-analysis-result':
      initAnalysisResultScreen();
      break;
    case 'screen-session-detail':
      await initSessionDetailScreen(data || AppState.currentSessionId);
      break;
  }
}

/**
 * Bind global UI triggers
 */
function setupEventBindings() {
  // Navigation Tabs binding
  $$('.nav-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = tab.dataset.tab;
      
      // Visual active switch
      $$('.nav-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Animate active icon bounce
      const icon = tab.querySelector('.icon');
      if (icon) {
        icon.classList.add('nav-bounce');
        icon.addEventListener('animationend', () => icon.classList.remove('nav-bounce'), { once: true });
      }

      AppState.activeTab = tabId;
      
      // Toggle tab subviews in home container
      $$('.tab-subview').forEach(view => view.classList.add('hidden'));
      $(`#view-${tabId.split('-')[1]}`).classList.remove('hidden');

      // Refresh data on view swap
      if (tabId === 'tab-home') {
        renderDashboard();
      } else if (tabId === 'tab-reports') {
        renderReportsTab();
      } else if (tabId === 'tab-settings') {
        renderSettingsTab();
      }
    });
  });

  // FAB button in Home dashboard
  $('#fab-add-session').addEventListener('click', () => navigateTo('screen-create-session'));
  $('#btn-empty-create-session').addEventListener('click', () => navigateTo('screen-create-session'));

  // Create session form logic
  const sessionForm = $('#form-new-session');
  const sessionNameInput = $('#input-session-name');
  const btnSubmitSession = $('#btn-submit-session');

  // Input listener to enable button when filled
  sessionNameInput.addEventListener('input', () => {
    const isFilled = sessionNameInput.value.trim().length > 0 && $('.chip.selected');
    btnSubmitSession.disabled = !isFilled;
  });

  sessionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = sessionNameInput.value.trim();
    const selectedChip = $('.chip.selected');
    const location = selectedChip ? selectedChip.dataset.val : 'Lainnya';
    const notes = $('#textarea-session-notes').value.trim();
    
    try {
      const newId = await window.WoundDb.createSession({
        name,
        bodyLocation: location,
        notes
      });
      AppState.currentSessionId = newId;
      showToast('Sesi pemantauan berhasil dibuat', 'success');
      
      // After session created, immediately open bottom sheet selection for camera / upload
      navigateTo('screen-session-detail', newId);
      openAddPhotoSheet();
    } catch (err) {
      console.error(err);
      showToast('Gagal membuat sesi', 'error');
    }
  });

  // Body location chips selection binding
  $$('#body-location-chips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      $$('#body-location-chips .chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      
      // Trigger input listener manually
      const isFilled = sessionNameInput.value.trim().length > 0;
      btnSubmitSession.disabled = !isFilled;
    });
  });

  // Back buttons binding
  $$('.back-btn-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      const dest = btn.dataset.dest;
      if (dest) {
        navigateTo(dest);
      }
    });
  });

  // Retake photo binding
  $('#btn-retake-photo').addEventListener('click', () => {
    navigateTo('screen-camera', { sessionId: AppState.currentSessionId });
  });

  // Save analysis result binding
  $('#btn-save-analysis').addEventListener('click', async () => {
    if (!AppState.analysisResult || !AppState.capturedBlob) return;
    
    const userNote = $('#input-result-notes').value.trim();
    
    try {
      // Add user note to entry details
      AppState.analysisResult.notes = userNote;
      AppState.analysisResult.photoBlob = AppState.capturedBlob;
      AppState.analysisResult.source = AppState.capturedSource;
      AppState.analysisResult.takenAt = Date.now();
      AppState.analysisResult.sessionId = AppState.currentSessionId;
      
      await window.WoundDb.addEntry(AppState.analysisResult);
      showToast('Foto luka berhasil disimpan', 'success');
      navigateTo('screen-session-detail', AppState.currentSessionId);
    } catch (err) {
      console.error(err);
      showToast('Gagal menyimpan analisis', 'error');
    }
  });

  // Bottom Sheet backdrop closing
  $('#bottom-sheet-backdrop').addEventListener('click', closeAddPhotoSheet);
  $('#btn-sheet-close-handle').addEventListener('click', closeAddPhotoSheet);

  // AI Sensitivity Slider
  const slider = $('#input-ai-sensitivity');
  if (slider) {
    slider.addEventListener('input', async (e) => {
      const val = parseFloat(e.target.value);
      $('#ai-sensitivity-val').textContent = val.toFixed(2) + 'x';
      
      if (AppState.analysisResult && AppState.analysisResult.rawImageData) {
        // Recalculate
        const { areaPercent, boundingBox } = window.WoundAI.analyzePixels(AppState.analysisResult.rawImageData, val);
        const areaCm2 = Math.round(areaPercent * 1.2 * 10) / 10;
        const maskPath = window.WoundAI.generateDynamicMask(boundingBox, 400, 300, areaPercent);
        
        // Update AppState
        AppState.analysisResult.areaPercent = areaPercent;
        AppState.analysisResult.areaCm2 = areaCm2;
        AppState.analysisResult.maskData.path = maskPath;
        
        // Redraw Mask
        const svgOverlay = $('#result-mask-svg');
        const pathElement = svgOverlay.querySelector('path');
        if (maskPath) {
          pathElement.setAttribute('d', maskPath);
          svgOverlay.classList.remove('hidden');
        } else {
          pathElement.setAttribute('d', '');
          svgOverlay.classList.add('hidden');
        }
        
        // Update Metrics (no animation, instant)
        $('#result-metric-area').textContent = areaPercent.toFixed(1) + '%';
        $('#result-metric-size').textContent = areaCm2.toFixed(1) + ' cm²';
      }
    });
  }

  // Bottom sheet Kamera live click
  $('#btn-sheet-camera').addEventListener('click', () => {
    closeAddPhotoSheet();
    navigateTo('screen-camera', { sessionId: AppState.currentSessionId });
  });

  // Bottom sheet Galeri upload click
  $('#btn-sheet-gallery').addEventListener('click', async () => {
    closeAddPhotoSheet();
    try {
      const file = await window.WoundCamera.selectFromGallery();
      const compressed = await window.WoundUtils.compressImage(file);
      
      AppState.capturedBlob = compressed;
      AppState.capturedSource = 'gallery';
      
      navigateTo('screen-loading-analysis', { blob: compressed, source: 'gallery' });
    } catch (err) {
      console.warn('Gallery select cancelled/failed:', err);
    }
  });

  // Details screen floating buttons
  $('#detail-btn-camera').addEventListener('click', () => {
    navigateTo('screen-camera', { sessionId: AppState.currentSessionId });
  });
  $('#detail-btn-gallery').addEventListener('click', async () => {
    try {
      const file = await window.WoundCamera.selectFromGallery();
      const compressed = await window.WoundUtils.compressImage(file);
      AppState.capturedBlob = compressed;
      AppState.capturedSource = 'gallery';
      navigateTo('screen-loading-analysis', { blob: compressed, source: 'gallery' });
    } catch (err) {
      console.warn(err);
    }
  });

  // Reports select field binding
  $('#select-report-session').addEventListener('change', (e) => {
    AppState.selectedReportSessionId = e.target.value;
    renderReportPreview(e.target.value);
  });

  // PDF Export trigger
  $('#btn-export-pdf').addEventListener('click', async () => {
    const sessionId = AppState.selectedReportSessionId;
    if (!sessionId) {
      showToast('Silakan pilih sesi terlebih dahulu', 'info');
      return;
    }

    // Check jsPDF library availability before proceeding
    if (!window.jspdf) {
      showToast('Pustaka PDF belum termuat. Pastikan koneksi internet aktif, lalu refresh halaman.', 'error');
      return;
    }

    const btn = $('#btn-export-pdf');
    const originalText = btn.innerHTML;
    
    // Set loading state in button
    btn.disabled = true;
    btn.innerHTML = `<span class="icon spinner-anim">neurology</span> Membuat Laporan...`;
    
    try {
      const session = await window.WoundDb.getSessionById(Number(sessionId));
      const entries = await window.WoundDb.getEntriesBySession(Number(sessionId));
      
      if (!session) {
        throw new Error('Sesi tidak ditemukan. Coba pilih ulang sesi.');
      }
      if (!entries || entries.length === 0) {
        throw new Error('Sesi ini belum memiliki foto untuk dilaporkan.');
      }
      
      await window.WoundExporter.exportSessionToPDF(session, entries);
      showToast('Laporan PDF berhasil diunduh!', 'success');
    } catch (err) {
      console.error('PDF Export Error:', err);
      showToast(err.message || 'Gagal ekspor PDF', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  });

  // Nuke database triggers (Settings)
  $('#btn-settings-nuke').addEventListener('click', () => {
    openConfirmDialog(
      'Hapus Semua Data?',
      'Tindakan ini akan menghapus semua riwayat sesi dan foto secara permanen. Tindakan ini tidak dapat dibatalkan.',
      async () => {
        await window.WoundDb.nukeDatabase();
        showToast('Semua data berhasil dibersihkan', 'error');
        navigateTo('screen-home');
        // Reset navigation tab to home
        $('.nav-tab[data-tab="tab-home"]').click();
      }
    );
  });

  // Detail screen action menu (delete session)
  $('#btn-detail-menu').addEventListener('click', () => {
    openConfirmDialog(
      'Hapus Sesi Ini?',
      'Seluruh foto dan grafik perkembangan dalam sesi ini akan dihapus secara permanen.',
      async () => {
        await window.WoundDb.deleteSession(AppState.currentSessionId);
        showToast('Sesi telah dihapus', 'error');
        navigateTo('screen-home');
      }
    );
  });
}

/**
 * 1. Splash Screen Logic
 */
async function initSplashScreen() {
  await delay(1500); // 1.5 seconds auto-dismiss
  if (AppState.firstInstall) {
    navigateTo('screen-onboarding');
  } else {
    navigateTo('screen-home');
  }
}

/**
 * 2. Onboarding Slide Navigator
 */
function initOnboardingScreen() {
  AppState.onboardingIndex = 0;
  renderOnboardingSlide();
  
  // Next button click
  const btnNext = $('#btn-onboarding-next');
  btnNext.onclick = () => {
    if (AppState.onboardingIndex < 2) {
      AppState.onboardingIndex++;
      renderOnboardingSlide();
    } else {
      completeOnboarding();
    }
  };

  // Skip button click
  $('#btn-onboarding-skip').onclick = () => {
    completeOnboarding();
  };
}

function renderOnboardingSlide() {
  const index = AppState.onboardingIndex;
  
  // Update slides visual
  $$('.onboarding-slide').forEach((slide, idx) => {
    slide.classList.remove('active', 'prev');
    if (idx === index) {
      slide.classList.add('active');
    } else if (idx < index) {
      slide.classList.add('prev');
    }
  });

  // Update dots indicator
  $$('.onboarding-dot').forEach((dot, idx) => {
    dot.className = 'onboarding-dot';
    if (idx === index) {
      dot.classList.add('dot-active');
    } else {
      dot.classList.add('dot-inactive');
    }
  });

  // Update button content
  const btnNext = $('#btn-onboarding-next');
  if (index === 2) {
    btnNext.innerHTML = `<span class="icon">check</span>`;
    btnNext.classList.add('btn-shimmer'); // Apply CTA premium shimmer
  } else {
    btnNext.innerHTML = `<span class="icon">arrow_forward</span>`;
    btnNext.classList.remove('btn-shimmer');
  }
}

function completeOnboarding() {
  localStorage.setItem('onboarding_completed', 'true');
  AppState.firstInstall = false;
  navigateTo('screen-home');
}

/**
 * 3. Home Dashboard Init
 */
async function initHomeScreen() {
  // Ensure we are viewing correct tab
  const activeTab = AppState.activeTab;
  $$('.nav-tab').forEach(t => t.classList.remove('active'));
  $(`.nav-tab[data-tab="${activeTab}"]`).classList.add('active');

  $$('.tab-subview').forEach(view => view.classList.add('hidden'));
  $(`#view-${activeTab.split('-')[1]}`).classList.remove('hidden');

  if (activeTab === 'tab-home') {
    await renderDashboard();
  } else if (activeTab === 'tab-reports') {
    await renderReportsTab();
  } else if (activeTab === 'tab-settings') {
    await renderSettingsTab();
  }
}

async function renderDashboard() {
  // 1. Dynamic Greeting
  const hour = new Date().getHours();
  let greeting = 'Selamat Pagi';
  if (hour >= 11 && hour < 15) greeting = 'Selamat Siang';
  if (hour >= 15 && hour < 19) greeting = 'Selamat Sore';
  if (hour >= 19 || hour < 4) greeting = 'Selamat Malam';
  
  $('#home-greeting').textContent = greeting;
  
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const now = new Date();
  $('#home-date').textContent = `${days[now.getDay()]}, ${formatDate(now.getTime())}`;

  // Check for dummy data seeding (Force wipe old dummy data to use new detailed Kaggle images)
  let sessions = await window.WoundDb.getAllSessions();
  if (localStorage.getItem('dummySeededV8') !== 'true') {
    console.log("Upgrading dummy data to include base64 images...");
    for (const s of sessions) {
      // Clean up previous placeholder sessions
      await window.WoundDb.deleteSession(s.id);
    }
    await seedDummyData();
    localStorage.setItem('dummySeededV8', 'true');
    sessions = await window.WoundDb.getAllSessions();
  }

  // Restore session state
  if (sessions.length > 0) {
    AppState.currentSessionId = sessions[sessions.length - 1].id;
  }
  
  if (sessions.length === 0) {
    $('#home-dashboard-content').classList.add('hidden');
    $('#home-empty-state').classList.remove('hidden');
    return;
  }

  $('#home-empty-state').classList.add('hidden');
  $('#home-dashboard-content').classList.remove('hidden');

  // 3. Render Summary Card stats
  let activeCount = sessions.length;
  let improvingCount = 0;
  let stableCount = 0;
  let worseningCount = 0;

  const containerList = $('#session-list-container');
  containerList.innerHTML = ''; // Clear

  // 4. Render Session Items
  for (let i = 0; i < sessions.length; i++) {
    const session = sessions[i];
    const entries = await window.WoundDb.getEntriesBySession(session.id);
    
    let trend = 'stable';
    let lastTimeStr = 'Belum ada foto';
    let thumbHTML = `<div class="session-thumb-empty"><span class="icon">healing</span></div>`;
    let sparklineHTML = '';
    
    if (entries.length > 0) {
      const lastEntry = entries[entries.length - 1];
      trend = lastEntry.trend;
      lastTimeStr = `Terakhir: ${formatRelativeTime(lastEntry.takenAt)}`;
      
      // Convert image blob to preview
      const thumbUrl = URL.createObjectURL(lastEntry.photoBlob);
      thumbHTML = `<img src="${thumbUrl}" class="session-thumb" onload="URL.revokeObjectURL('${thumbUrl}')" alt="Wound thumb">`;
      
      // Compile stats
      if (trend === 'improving') improvingCount++;
      if (trend === 'stable') stableCount++;
      if (trend === 'worsening') worseningCount++;

      // Draw SVG Sparkline representing progression values
      sparklineHTML = generateSparklineSVG(entries);
    } else {
      stableCount++; // default baseline
    }

    // Trend badge markup
    let trendBadge = '';
    if (trend === 'improving') {
      trendBadge = `<span class="badge badge-success"><span class="icon" style="font-size:14px">trending_down</span>Membaik</span>`;
    } else if (trend === 'worsening') {
      trendBadge = `<span class="badge badge-danger"><span class="icon" style="font-size:14px">trending_up</span>Memburuk</span>`;
    } else {
      trendBadge = `<span class="badge badge-warning"><span class="icon" style="font-size:14px">trending_flat</span>Stabil</span>`;
    }

    const card = document.createElement('div');
    card.className = 'card card-pressable session-item-card session-card-enter';
    card.style.animationDelay = `${i * 60}ms`; // Stagger loading entry animations
    card.innerHTML = `
      ${thumbHTML}
      <div class="session-info">
        <h4 class="session-name">${session.name}</h4>
        <div class="session-meta">
          <span class="session-location-chip">${session.bodyLocation}</span>
          <span class="session-time">${lastTimeStr}</span>
        </div>
      </div>
      <div class="session-item-right">
        ${trendBadge}
        <div class="session-sparkline">${sparklineHTML}</div>
      </div>
    `;

    // Tap cards navigate to details
    card.addEventListener('click', () => {
      navigateTo('screen-session-detail', session.id);
    });

    containerList.appendChild(card);
  }

  // Set counters
  $('#home-active-sessions-count').textContent = `${activeCount} Sesi`;
  $('#count-badge-improving').textContent = `${improvingCount} Membaik`;
  $('#count-badge-stable').textContent = `${stableCount} Stabil`;
  $('#count-badge-worsening').textContent = `${worseningCount} Memburuk`;
}

/**
 * Draw custom sparkline path inside SVG
 */
function generateSparklineSVG(entries) {
  if (entries.length < 2) return '';
  
  const width = 60;
  const height = 24;
  const padding = 3;
  
  const values = entries.map(e => e.areaPercent);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;
  
  // Compile coordinates
  const points = values.map((val, index) => {
    const x = padding + (index / (values.length - 1)) * (width - padding * 2);
    // Y is inverted in SVG (highest value at bottom). We want highest value at top.
    const y = height - padding - ((val - minVal) / range) * (height - padding * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  
  // Decide stroke color based on overall direction
  const first = values[0];
  const last = values[values.length - 1];
  const strokeColor = last < first ? '#006b5f' : last > first ? '#ba1a1a' : '#b45309';

  return `
    <svg width="${width}" height="${height}">
      <path d="M ${points.join(' L ')}" fill="none" stroke="${strokeColor}" stroke-width="2.5" class="sparkline-path" />
    </svg>
  `;
}

/**
 * 4. Buat Sesi Baru Screen Init
 */
function initCreateSessionScreen() {
  $('#form-new-session').reset();
  
  // Reset chips selection
  $$('#body-location-chips .chip').forEach(chip => {
    chip.classList.remove('selected');
    // Set default select Kepala if needed, or leave unselected
  });

  $('#btn-submit-session').disabled = true;
}

/**
 * 5. Camera Screen Init
 */
async function initCameraScreen(data) {
  AppState.currentSessionId = data.sessionId;
  
  const video = $('#camera-video');
  const flashBtn = $('#btn-camera-flash');
  
  // Update header title with session name
  try {
    const session = await window.WoundDb.getSessionById(data.sessionId);
    $('#camera-session-title').textContent = session.name;
  } catch {
    $('#camera-session-title').textContent = 'Foto Luka';
  }

  // Trigger camera start
  try {
    await window.WoundCamera.startCamera(video);
    flashBtn.classList.remove('hidden');
  } catch (err) {
    console.error('Camera initialization failed:', err);
    showToast('Tidak dapat mengakses kamera. Beralih ke mode Galeri.', 'error');
    // Fallback: trigger file input automatically
    triggerUploadFallback();
  }

  // Flash Button listener
  flashBtn.onclick = async () => {
    const isOn = await window.WoundCamera.toggleTorch();
    flashBtn.innerHTML = `<span class="icon">${isOn ? 'flash_on' : 'flash_off'}</span>`;
  };

  // Shutter action button
  const captureBtn = $('#btn-camera-capture');
  captureBtn.onclick = async () => {
    // Trigger visual screen flash animation
    const flashOverlay = $('#camera-flash-overlay');
    flashOverlay.classList.add('trigger');
    flashOverlay.addEventListener('animationend', () => flashOverlay.classList.remove('trigger'), { once: true });
    
    // Play light vibration (standard tactile feel)
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    try {
      const rawBlob = await window.WoundCamera.capturePhoto();
      const compressed = await window.WoundUtils.compressImage(rawBlob);
      
      AppState.capturedBlob = compressed;
      AppState.capturedSource = 'camera';
      
      // Move to Loading AI
      navigateTo('screen-loading-analysis', { blob: compressed, source: 'camera' });
    } catch (err) {
      console.error('Capture failed:', err);
      showToast('Gagal mengambil gambar', 'error');
    }
  };

  // Close camera button
  $('#btn-camera-close').onclick = () => {
    navigateTo('screen-session-detail', AppState.currentSessionId);
  };

  // Gallery button on camera screen
  $('#btn-camera-gallery').onclick = async () => {
    try {
      const file = await window.WoundCamera.selectFromGallery();
      const compressed = await window.WoundUtils.compressImage(file);
      AppState.capturedBlob = compressed;
      AppState.capturedSource = 'gallery';
      navigateTo('screen-loading-analysis', { blob: compressed, source: 'gallery' });
    } catch (err) {
      console.warn(err);
    }
  };
}

/**
 * Handle camera missing / permission denied error fallback
 */
async function triggerUploadFallback() {
  navigateTo('screen-session-detail', AppState.currentSessionId);
  try {
    const file = await window.WoundCamera.selectFromGallery();
    const compressed = await window.WoundUtils.compressImage(file);
    AppState.capturedBlob = compressed;
    AppState.capturedSource = 'gallery';
    navigateTo('screen-loading-analysis', { blob: compressed, source: 'gallery' });
  } catch (err) {
    console.warn('Gallery select cancelled:', err);
  }
}

/**
 * 6. Loading AI Analysis Screen
 */
async function initLoadingAnalysisScreen(data) {
  const loadingImgBg = $('#loading-image-bg');
  const spinnerRing = $('#loading-pulse-ring');
  const textSub = $('#loading-text-sub');
  
  // Set image background as blurred placeholder
  const url = URL.createObjectURL(data.blob);
  loadingImgBg.style.backgroundImage = `url(${url})`;
  
  // Animate pulse ring
  spinnerRing.classList.add('pulse-ring-anim');
  
  // Cyclic text swapping script
  const textSequences = [
    'Mendeteksi area luka...',
    'Menghitung proporsi segmentasi...',
    'Membandingkan dengan riwayat...',
    'Hampir selesai...'
  ];
  
  let seqIndex = 0;
  textSub.textContent = textSequences[seqIndex];
  
  const textInterval = setInterval(() => {
    seqIndex = (seqIndex + 1) % textSequences.length;
    textSub.textContent = textSequences[seqIndex];
  }, 800);

  // Invoke simulated AI model
  try {
    const previousEntries = await window.WoundDb.getEntriesBySession(AppState.currentSessionId);
    
    // Pass parameters
    const result = await window.WoundAI.analyzeWoundImage(data.blob, data.source, previousEntries);
    
    AppState.analysisResult = result;
    
    clearInterval(textInterval);
    URL.revokeObjectURL(url);
    
    // Move to Result View
    navigateTo('screen-analysis-result');
  } catch (err) {
    clearInterval(textInterval);
    URL.revokeObjectURL(url);
    console.error(err);
    showToast('AI gagal menganalisis foto', 'error');
    navigateTo('screen-session-detail', AppState.currentSessionId);
  }
}

/**
 * 7. AI Result Screen Init
 */
function initAnalysisResultScreen() {
  const result = AppState.analysisResult;
  const imgElement = $('#result-preview-photo');
  const svgOverlay = $('#result-mask-svg');
  
  // Reset notes textarea
  $('#input-result-notes').value = '';

  // Render Captured Image
  const imgUrl = URL.createObjectURL(AppState.capturedBlob);
  imgElement.src = imgUrl;
  imgElement.onload = () => URL.revokeObjectURL(imgUrl);

  // Setup SVG size constraints
  svgOverlay.setAttribute('viewBox', '0 0 400 300');
  
  // Draw mask
  const pathElement = svgOverlay.querySelector('path');
  if (result.maskData && result.maskData.path) {
    pathElement.setAttribute('d', result.maskData.path);
    pathElement.classList.add('wound-mask-pulse');
    $('#result-toggle-overlay').classList.remove('hidden');
    $('#result-toggle-overlay').classList.add('active');
    svgOverlay.classList.remove('hidden');
  } else {
    // Healthy skin, no mask
    pathElement.setAttribute('d', '');
    $('#result-toggle-overlay').classList.add('hidden');
    svgOverlay.classList.add('hidden');
  }

  // Toggle mask overlay click listener
  $('#result-toggle-overlay').onclick = () => {
    const isActive = $('#result-toggle-overlay').classList.toggle('active');
    if (isActive && result.maskData && result.maskData.path) {
      svgOverlay.classList.remove('hidden');
    } else {
      svgOverlay.classList.add('hidden');
    }
  };

  // Run Count-Up Numbers animation
  const areaValEl = $('#result-metric-area');
  const sizeValEl = $('#result-metric-size');
  const sizeDiffEl = $('#result-metric-size-desc');
  const confidenceEl = $('#result-accuracy-val');
  
  // Call countup helper on percentage
  animateCountUp(areaValEl, result.areaPercent, '%');
  animateCountUp(sizeValEl, result.areaCm2, ' cm²');
  
  confidenceEl.textContent = `Tingkat Deteksi: ${result.confidence}%`;

  // Dynamic Delta Change description styling
  const changeVal = result.areaChange;
  const trendBar = $('#result-trend-bar');
  
  trendBar.className = 'trend-info-bar'; // reset
  
  if (result.areaPercent === 0) {
    trendBar.classList.add('badge-success');
    trendBar.innerHTML = `<span class="icon">check_circle</span> <span>Kulit sehat. Tidak ada area luka terdeteksi.</span>`;
  } else if (changeVal < 0) {
    trendBar.classList.add('badge-success');
    trendBar.innerHTML = `<span class="icon">trending_down</span> <span>Luka mengecil <strong>${Math.abs(changeVal)} cm²</strong> dibanding foto sebelumnya.</span>`;
  } else if (changeVal > 0) {
    trendBar.classList.add('badge-error');
    trendBar.innerHTML = `<span class="icon">trending_up</span> <span>Luka membesar <strong>${changeVal} cm²</strong> dibanding foto sebelumnya.</span>`;
  } else {
    trendBar.classList.add('badge-warning');
    trendBar.innerHTML = `<span class="icon">trending_flat</span> <span>Ukuran luka stabil dibanding foto sebelumnya.</span>`;
  }

  // Load General Care Tips
  const tipsContainer = $('#result-tips-list');
  tipsContainer.innerHTML = ''; // reset
  
  let tips = [];
  if (result.areaPercent === 0) {
    tips = [
      'Jaga kebersihan kulit secara umum',
      'Gunakan pelindung tabir surya saat terpapar matahari',
      'Pantau berkala jika muncul gejala gatal atau kemerahan'
    ];
  } else if (result.trend === 'improving') {
    tips = [
      'Lanjutkan metode perawatan perban bersih saat ini',
      'Jaga area sekitar luka tetap higienis dan kering',
      'Konsumsi makanan bergizi kaya protein untuk mempercepat jaringan baru'
    ];
  } else if (result.trend === 'worsening') {
    tips = [
      'Bersihkan luka dengan cairan steril saline',
      'Kurangi tekanan berlebih pada lokasi area luka',
      'Segera hubungi dokter jika luka berbau tidak sedap atau bernanah'
    ];
  } else {
    tips = [
      'Bersihkan perban secara teratur',
      'Perhatikan tanda-tanda infeksi seperti bengkak atau demam',
      'Lakukan foto kembali dalam 2 hari untuk memverifikasi tren'
    ];
  }

  tips.forEach(tip => {
    const li = document.createElement('li');
    li.textContent = tip;
    tipsContainer.appendChild(li);
  });
}

/**
 * Programmatic Count Up UI animation
 */
function animateCountUp(element, targetValue, suffix = '', duration = 1000) {
  const start = 0;
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease out cubic curves
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    const currentValue = start + (targetValue - start) * easedProgress;
    
    element.textContent = currentValue.toFixed(1) + suffix;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = targetValue.toFixed(1) + suffix;
    }
  }
  requestAnimationFrame(update);
}

/**
 * 8. Session Detail Screen Init
 */
async function initSessionDetailScreen(sessionId) {
  AppState.currentSessionId = sessionId;
  
  const session = await window.WoundDb.getSessionById(sessionId);
  if (!session) {
    navigateTo('screen-home');
    return;
  }

  $('#detail-title-text').textContent = session.name;

  const entries = await window.WoundDb.getEntriesBySession(sessionId);
  const totalPhotos = entries.length;

  // 1. Calculate and count statistics parameters
  let daysTracked = 0;
  let currentTrend = 'stable';
  let minArea = 0;
  
  if (totalPhotos > 0) {
    const firstTime = entries[0].takenAt;
    const lastTime = entries[totalPhotos - 1].takenAt;
    
    // Count days tracked (at least 1 day)
    const diffTime = Math.abs(lastTime - firstTime);
    daysTracked = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    // Current trend
    currentTrend = entries[totalPhotos - 1].trend;
    
    // Smallest wound area recorded (excluding 0% healthy skin checks)
    const woundSizes = entries.filter(e => e.areaCm2 > 0).map(e => e.areaCm2);
    minArea = woundSizes.length > 0 ? Math.min(...woundSizes) : 0;
  }

  // Count ups
  animateCountUp($('#detail-stat-days'), daysTracked, '');
  animateCountUp($('#detail-stat-photos'), totalPhotos, '');
  animateCountUp($('#detail-stat-min-area'), minArea, ' cm²');

  // Trend status badge color mapping
  const trendBadgeEl = $('#detail-stat-trend');
  trendBadgeEl.className = 'badge'; // reset
  
  let trendName = 'Stabil';
  if (currentTrend === 'improving') {
    trendName = 'Membaik';
    trendBadgeEl.classList.add('badge-success');
  } else if (currentTrend === 'worsening') {
    trendName = 'Memburuk';
    trendBadgeEl.classList.add('badge-danger');
  } else {
    trendBadgeEl.classList.add('badge-warning');
  }
  trendBadgeEl.textContent = trendName;

  // 2. Draw line graph (Chart.js wrapper call)
  const chartCanvas = $('#progress-chart-canvas');
  if (totalPhotos >= 2) {
    $('#detail-chart-card').classList.remove('hidden');
    window.WoundChart.renderProgressChart(chartCanvas, entries);
    
    // Display chart insights text
    const firstWound = entries.find(e => e.areaCm2 > 0);
    const lastWound = entries[totalPhotos - 1];
    
    if (firstWound && lastWound && firstWound.id !== lastWound.id) {
      const sizeDiff = lastWound.areaCm2 - firstWound.areaCm2;
      const pctDiff = lastWound.areaPercent - firstWound.areaPercent;
      
      const chartInsightText = $('#chart-insight-text');
      if (sizeDiff < 0) {
        chartInsightText.innerHTML = `Ukuran luka berkurang <strong>${Math.abs(sizeDiff).toFixed(1)} cm²</strong> (${Math.abs(pctDiff).toFixed(1)}%) sejak pemantauan awal.`;
      } else if (sizeDiff > 0) {
        chartInsightText.innerHTML = `Ukuran luka bertambah <strong>${sizeDiff.toFixed(1)} cm²</strong> (${pctDiff.toFixed(1)}%) dibanding awal.`;
      } else {
        chartInsightText.innerHTML = `Ukuran luka stabil dibanding awal pemantauan.`;
      }
    }
  } else {
    $('#detail-chart-card').classList.add('hidden');
    window.WoundChart.destroyChart();
  }

  // 3. Render side-by-side Before / After Panels
  const beforeAfterCard = $('#detail-before-after-card');
  if (totalPhotos >= 2) {
    beforeAfterCard.classList.remove('hidden');
    const firstEntry = entries[0];
    const latestEntry = entries[totalPhotos - 1];
    
    const imgBeforeUrl = URL.createObjectURL(firstEntry.photoBlob);
    const imgAfterUrl = URL.createObjectURL(latestEntry.photoBlob);
    
    $('#before-image').src = imgBeforeUrl;
    $('#after-image').src = imgAfterUrl;
    
    $('#before-date').textContent = formatDate(firstEntry.takenAt);
    $('#after-date').textContent = formatDate(latestEntry.takenAt);
    
    $('#before-area').textContent = `${firstEntry.areaCm2} cm² (${firstEntry.areaPercent}%)`;
    $('#after-area').textContent = `${latestEntry.areaCm2} cm² (${latestEntry.areaPercent}%)`;
    
    // Revoke
    $('#before-image').onload = () => URL.revokeObjectURL(imgBeforeUrl);
    $('#after-image').onload = () => URL.revokeObjectURL(imgAfterUrl);
    
    // Delta percentage changes label
    const totalChange = latestEntry.areaCm2 - firstEntry.areaCm2;
    const labelDelta = $('#before-after-delta-label');
    if (totalChange < 0) {
      labelDelta.style.color = 'var(--secondary)';
      labelDelta.textContent = `Perubahan: -${Math.abs(totalChange).toFixed(1)} cm² dalam ${daysTracked} hari`;
    } else if (totalChange > 0) {
      labelDelta.style.color = 'var(--error)';
      labelDelta.textContent = `Perubahan: +${totalChange.toFixed(1)} cm² dalam ${daysTracked} hari`;
    } else {
      labelDelta.style.color = 'var(--warning)';
      labelDelta.textContent = `Perubahan: 0 cm² dalam ${daysTracked} hari`;
    }
  } else {
    beforeAfterCard.classList.add('hidden');
  }

  // 4. Render timeline tracking points list
  const timelineContainer = $('#detail-timeline-list');
  timelineContainer.innerHTML = ''; // reset
  
  if (totalPhotos === 0) {
    timelineContainer.innerHTML = `<div style="text-align:center; padding: 24px; color: var(--on-surface-variant)">Belum ada foto. Silakan tambahkan foto luka pertama Anda.</div>`;
    return;
  }

  // Iterate backwards (newest first for tracking list)
  const reversedEntries = [...entries].reverse();
  
  reversedEntries.forEach((entry, index) => {
    const item = document.createElement('div');
    item.className = 'timeline-item';
    
    const timeStr = new Date(entry.takenAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const fullDateStr = `${formatDate(entry.takenAt)}, ${timeStr}`;
    
    // Convert Blob preview
    const url = URL.createObjectURL(entry.photoBlob);
    
    let changeBadgeHTML = '';
    if (entry.areaPercent > 0) {
      const delta = entry.areaChange;
      if (delta < 0) {
        changeBadgeHTML = `<span class="timeline-item-delta" style="color:var(--secondary)">-${Math.abs(delta)} cm²</span>`;
      } else if (delta > 0) {
        changeBadgeHTML = `<span class="timeline-item-delta" style="color:var(--error)">+${delta} cm²</span>`;
      } else {
        changeBadgeHTML = `<span class="timeline-item-delta" style="color:var(--on-surface-variant)">0 cm²</span>`;
      }
    }
    
    item.innerHTML = `
      <div class="timeline-item-header-row">
        <img src="${url}" class="timeline-item-thumb" onload="URL.revokeObjectURL('${url}')" alt="Wound log">
        <div class="timeline-item-details">
          <div class="timeline-item-date">${fullDateStr}</div>
          <div class="timeline-item-area">Ukuran: ${entry.areaCm2} cm² (${entry.areaPercent}%)</div>
        </div>
        ${changeBadgeHTML}
      </div>
      <div class="timeline-item-note">${entry.notes || 'Tidak ada catatan untuk foto ini.'}</div>
    `;

    // Expand details on click
    item.addEventListener('click', (e) => {
      // Don't expand if clicking on image (prevent overlay trigger)
      item.classList.toggle('expanded');
    });

    timelineContainer.appendChild(item);
  });
}

/**
 * Visual Sheet opener
 */
function openAddPhotoSheet() {
  $('#bottom-sheet-backdrop').classList.remove('hidden');
  $('#bottom-sheet-add-photo').classList.remove('hidden');
  // Trigger reflow to apply CSS transitions
  $('#bottom-sheet-add-photo').offsetHeight;
  $('#bottom-sheet-backdrop').classList.add('active');
  $('#bottom-sheet-add-photo').classList.add('active');
}

/**
 * Visual Sheet closer
 */
function closeAddPhotoSheet() {
  $('#bottom-sheet-backdrop').classList.remove('active');
  $('#bottom-sheet-add-photo').classList.remove('active');
  
  // Hide element entirely after slide transition finishes
  setTimeout(() => {
    // Check again to avoid hiding if user reopened it quickly
    if (!$('#bottom-sheet-add-photo').classList.contains('active')) {
      $('#bottom-sheet-backdrop').classList.add('hidden');
      $('#bottom-sheet-add-photo').classList.add('hidden');
    }
  }, 300); // 300ms matches transition duration in variables.css
}

/**
 * 5. Reports View Page Init
 */
async function renderReportsTab() {
  const sessions = await window.WoundDb.getAllSessions();
  
  // Custom Select DOM Elements
  const customWrapper = $('#reports-custom-select');
  const customTrigger = $('.custom-select-trigger', customWrapper);
  const customValue = $('.custom-select-value', customWrapper);
  const customOptionsContainer = $('#reports-custom-options');
  const hiddenSelect = $('#select-report-session');
  
  // Clear previous options
  customOptionsContainer.innerHTML = '';
  hiddenSelect.innerHTML = '';
  
  if (sessions.length === 0) {
    customValue.textContent = 'Belum ada sesi';
    $('#report-preview-container').classList.add('hidden');
    $('#btn-export-pdf').disabled = true;
    
    // Disable interactions
    customTrigger.style.pointerEvents = 'none';
    customTrigger.style.opacity = '0.6';
    return;
  }
  
  // Enable interactions
  customTrigger.style.pointerEvents = 'auto';
  customTrigger.style.opacity = '1';
  
  // Add sessions options to both custom and hidden select
  sessions.forEach(session => {
    // Hidden Select
    const opt = document.createElement('option');
    opt.value = session.id;
    opt.textContent = `${session.name} (${session.bodyLocation})`;
    hiddenSelect.appendChild(opt);

    // Custom Select Option
    const customOpt = document.createElement('div');
    customOpt.className = 'custom-option';
    customOpt.dataset.value = session.id;
    customOpt.textContent = `${session.name} (${session.bodyLocation})`;
    
    // Handle Custom Option Click
    customOpt.addEventListener('click', (e) => {
      // Update UI
      $$('.custom-option', customOptionsContainer).forEach(el => el.classList.remove('selected'));
      customOpt.classList.add('selected');
      customValue.textContent = customOpt.textContent;
      
      // Sync hidden select and trigger change logic
      hiddenSelect.value = session.id;
      AppState.selectedReportSessionId = session.id;
      renderReportPreview(session.id);
      
      // Close dropdown
      customWrapper.classList.remove('open');
      e.stopPropagation();
    });

    customOptionsContainer.appendChild(customOpt);
  });

  // Default select first session (or last viewed session)
  const defaultSessionId = AppState.currentSessionId || sessions[0].id;
  
  // Initialize Default State
  hiddenSelect.value = defaultSessionId;
  AppState.selectedReportSessionId = defaultSessionId;
  
  const defaultCustomOpt = $(`.custom-option[data-value="${defaultSessionId}"]`, customOptionsContainer);
  if (defaultCustomOpt) {
    defaultCustomOpt.classList.add('selected');
    customValue.textContent = defaultCustomOpt.textContent;
  }

  // Render Preview Card
  renderReportPreview(defaultSessionId);
}

// Bind global custom select toggle logic (only run once)
if (!window.customSelectBound) {
  document.addEventListener('click', (e) => {
    const isClickInside = e.target.closest('.custom-select-wrapper');
    const customWrappers = $$('.custom-select-wrapper');
    
    // Close all custom selects if clicked outside
    if (!isClickInside) {
      customWrappers.forEach(w => w.classList.remove('open'));
      return;
    }

    // Toggle specific select
    const trigger = e.target.closest('.custom-select-trigger');
    if (trigger) {
      const wrapper = trigger.closest('.custom-select-wrapper');
      // Close others
      customWrappers.forEach(w => {
        if (w !== wrapper) w.classList.remove('open');
      });
      // Toggle this one
      wrapper.classList.toggle('open');
    }
  });
  window.customSelectBound = true;
}

async function renderReportPreview(sessionId) {
  if (!sessionId) return;

  const preview = $('#report-preview-container');
  const session = await window.WoundDb.getSessionById(Number(sessionId));
  const entries = await window.WoundDb.getEntriesBySession(Number(sessionId));

  if (!session) return;

  preview.classList.remove('hidden');
  
  $('#preview-session-name').textContent = session.name;
  $('#preview-session-location').textContent = session.bodyLocation;
  $('#preview-session-start').textContent = formatDate(session.createdAt);
  $('#preview-total-entries').textContent = `${entries.length} Foto`;

  const btn = $('#btn-export-pdf');
  if (entries.length === 0) {
    $('#preview-status-box').innerHTML = `
      <div style="color:var(--error); text-align:center; font-weight:600; padding: 12px 0;">
        <span class="icon" style="font-size:32px; display:block; margin-bottom:8px">add_a_photo</span>
        Sesi ini belum memiliki entri foto.<br>Tambahkan foto terlebih dahulu untuk diekspor ke PDF.
      </div>`;
    btn.disabled = true;
  } else {
    const latest = entries[entries.length - 1];
    const first = entries[0];
    let trendLabel = 'Stabil';
    let trendIcon = 'trending_flat';
    let trendColor = 'var(--warning)';
    if (latest.trend === 'improving') { trendLabel = 'Membaik'; trendIcon = 'trending_down'; trendColor = 'var(--secondary)'; }
    if (latest.trend === 'worsening') { trendLabel = 'Memburuk'; trendIcon = 'trending_up'; trendColor = 'var(--error)'; }
    
    // Generate thumbnail preview
    let thumbHTML = '';
    try {
      const thumbUrl = URL.createObjectURL(latest.photoBlob);
      thumbHTML = `<div style="margin-bottom:12px; border-radius:12px; overflow:hidden; border:2px solid var(--outline-variant)">
        <img src="${thumbUrl}" onload="URL.revokeObjectURL('${thumbUrl}')" alt="Preview" style="width:100%; height:120px; object-fit:cover; display:block">
      </div>`;
    } catch(e) { /* skip thumbnail */ }
    
    // Calculate total change
    const totalChange = latest.areaCm2 - first.areaCm2;
    const changeStr = totalChange <= 0 ? `${totalChange.toFixed(1)}` : `+${totalChange.toFixed(1)}`;

    $('#preview-status-box').innerHTML = `
      ${thumbHTML}
      <div class="preview-grid">
        <div class="preview-item">
          <span class="preview-label">Ukuran Awal</span>
          <span class="preview-value">${first.areaCm2} cm² (${first.areaPercent}%)</span>
        </div>
        <div class="preview-item">
          <span class="preview-label">Ukuran Terkini</span>
          <span class="preview-value">${latest.areaCm2} cm² (${latest.areaPercent}%)</span>
        </div>
        <div class="preview-item">
          <span class="preview-label">Tren Perkembangan</span>
          <span class="preview-value" style="color:${trendColor}"><span class="icon" style="font-size:16px; vertical-align:middle">${trendIcon}</span> ${trendLabel}</span>
        </div>
        <div class="preview-item">
          <span class="preview-label">Selisih Luas</span>
          <span class="preview-value" style="color:${trendColor}">${changeStr} cm²</span>
        </div>
        <div class="preview-item">
          <span class="preview-label">Update Terakhir</span>
          <span class="preview-value">${formatDate(latest.takenAt)}</span>
        </div>
        <div class="preview-item">
          <span class="preview-label">Catatan Terkini</span>
          <span class="preview-value" style="font-size:12px; line-height:1.4">${(latest.notes || '-').substring(0, 60)}${(latest.notes || '').length > 60 ? '...' : ''}</span>
        </div>
      </div>
    `;
    btn.disabled = false;
  }
}

/**
 * 6. Settings Page Init
 */
async function renderSettingsTab() {
  const usageMB = await window.WoundDb.getStorageUsage();
  
  // Show storage usage string
  $('#settings-storage-text').textContent = `${usageMB} MB digunakan dari ~50 MB estimasi kuota`;
  
  // Animate progress bar fill width (up to 50MB quota check)
  const pct = Math.min(100, Math.max(1, (usageMB / 50) * 100));
  $('#settings-storage-bar').style.width = `${pct}%`;
}

/**
 * Global Toast Notification Helper
 * @param {string} text - Message text
 * @param {string} type - 'success' (green), 'error' (red), 'info' (slate)
 */
function showToast(text, type = 'info') {
  const container = $('#toast-container-box');
  const toast = document.createElement('div');
  
  toast.className = `toast toast-${type}`;
  
  let iconName = 'info';
  if (type === 'success') iconName = 'check_circle';
  if (type === 'error') iconName = 'warning';
  
  toast.innerHTML = `
    <span class="icon">${iconName}</span>
    <span>${text}</span>
  `;

  container.appendChild(toast);
  
  // Trigger slide up animation
  setTimeout(() => toast.classList.add('show'), 50);

  // Auto remove toast
  setTimeout(() => {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => toast.remove());
  }, 3000);
}

/**
 * Confirmation dialog helper popup
 */
function openConfirmDialog(title, text, onConfirm) {
  const overlay = $('#dialog-confirm-overlay');
  const titleEl = $('#dialog-confirm-title');
  const textEl = $('#dialog-confirm-text');
  const btnConfirm = $('#btn-dialog-confirm');
  const btnCancel = $('#btn-dialog-cancel');

  titleEl.textContent = title;
  textEl.textContent = text;

  overlay.classList.add('active');

  btnConfirm.onclick = () => {
    overlay.classList.remove('active');
    onConfirm();
  };

  btnCancel.onclick = () => {
    overlay.classList.remove('active');
  };
}

// Export functions to global scope
window.WoundApp = {
  navigateTo,
  showToast,
  openAddPhotoSheet,
  closeAddPhotoSheet
};
