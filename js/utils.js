/* js/utils.js */

/**
 * Format a timestamp into an Indonesian date string.
 * e.g., "3 Juni 2026"
 */
function formatDate(timestamp) {
  const date = new Date(timestamp);
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Format timestamp to a relative time string.
 * e.g., "Baru saja", "5 menit lalu", "2 jam lalu", "Kemarin", "3 hari lalu"
 */
function formatRelativeTime(timestamp) {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  
  if (diffSecs < 60) {
    return 'Baru saja';
  } else if (diffMins < 60) {
    return `${diffMins} menit lalu`;
  } else if (diffHours < 24) {
    return `${diffHours} jam lalu`;
  } else if (diffHours < 48) {
    return 'Kemarin';
  } else {
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
      return `${diffDays} hari lalu`;
    } else {
      return formatDate(timestamp);
    }
  }
}

/**
 * Helper to pause execution.
 * @param {number} ms - Milliseconds to sleep.
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Compress and downscale an image file or blob to save space in IndexedDB (under 500KB limit).
 * Scales down to max 800px width/height and outputs JPEG at 0.7 quality.
 * @param {Blob|File} imageBlob
 * @returns {Promise<Blob>}
 */
function compressImage(imageBlob) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(imageBlob);
    
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const maxDim = 800;
      let width = img.width;
      let height = img.height;
      
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw image to canvas
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert canvas to compressed JPEG blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas compression failed'));
          }
        },
        'image/jpeg',
        0.7 // quality setting
      );
    };
    
    img.onerror = (err) => {
      reject(err);
    };
  });
}

/**
 * Converts a Blob to a DataURL (Base64) for pdf exporting and layout representation.
 * @param {Blob} blob 
 * @returns {Promise<string>}
 */
function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Programmatically create a visual ripple click feedback on elements.
 * @param {MouseEvent} event 
 * @param {HTMLElement} element 
 */
function createRipple(event, element) {
  const circle = document.createElement('span');
  const diameter = Math.max(element.clientWidth, element.clientHeight);
  const radius = diameter / 2;

  const rect = element.getBoundingClientRect();
  
  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - rect.left - radius}px`;
  circle.style.top = `${event.clientY - rect.top - radius}px`;
  circle.classList.add('ripple-effect');

  // Remove existing ripples
  const ripple = element.getElementsByClassName('ripple-effect')[0];
  if (ripple) {
    ripple.remove();
  }

  element.appendChild(circle);
}

/**
 * Attach ripple animation listeners to elements matching class selector.
 */
function initRippleListeners() {
  document.addEventListener('click', (e) => {
    const target = e.target.closest('.btn, .chip, .card-pressable, .settings-item, .nav-tab');
    if (target) {
      // Ensure element position is relative for ripple absolute positioning
      const originalPosition = window.getComputedStyle(target).position;
      if (originalPosition === 'static') {
        target.style.position = 'relative';
      }
      createRipple(e, target);
    }
  });
}

/**
 * Shorthand for query selectors.
 */
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => parent.querySelectorAll(selector);

// Export to global scope
window.WoundUtils = {
  formatDate,
  formatRelativeTime,
  delay,
  compressImage,
  blobToDataURL,
  createRipple,
  initRippleListeners,
  $,
  $$
};
