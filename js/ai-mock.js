/* js/ai-mock.js */

/**
 * Generates a smooth organic-looking SVG path representing a wound segmentation mask (fallback).
 * @param {number} width - Viewport width
 * @param {number} height - Viewport height
 * @param {number} areaPercent - The size of the wound, which controls radius
 * @returns {string} SVG Path string
 */
function generateBlobSVGPath(width, height, areaPercent) {
  if (areaPercent <= 0.5) return '';

  const cx = width / 2 + (Math.random() * 20 - 10);
  const cy = height / 2 + (Math.random() * 20 - 10);
  const maxRadius = Math.min(width, height) * 0.4;
  const baseRadius = Math.max(15, Math.sqrt(areaPercent / 25) * maxRadius);
  
  const numPoints = 8;
  const points = [];
  
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const randomFactor = 0.75 + Math.random() * 0.5;
    const r = baseRadius * randomFactor;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    points.push({ x, y });
  }
  
  let path = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)} `;
  for (let i = 0; i < numPoints; i++) {
    const p0 = points[i];
    const p1 = points[(i + 1) % numPoints];
    const p2 = points[(i + 2) % numPoints];
    
    const xc2 = (p1.x + p2.x) / 2;
    const yc2 = (p1.y + p2.y) / 2;
    
    path += `Q ${p1.x.toFixed(1)},${p1.y.toFixed(1)} ${xc2.toFixed(1)},${yc2.toFixed(1)} `;
  }
  path += 'Z';
  return path;
}

/**
 * Extracts ImageData from a Blob.
 */
async function getImageDataFromBlob(blob, targetWidth, targetHeight) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (targetWidth - w) / 2;
      const y = (targetHeight - h) / 2;
      ctx.drawImage(img, x, y, w, h);
      resolve(ctx.getImageData(0, 0, targetWidth, targetHeight));
    };
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Perform pixel-based color segmentation (CPU fallback).
 */
function analyzePixels(imageData, sensitivity = 1.3) {
  const data = imageData.data;
  let woundPixels = 0;
  const totalPixels = data.length / 4;
  
  let minX = imageData.width, maxX = 0;
  let minY = imageData.height, maxY = 0;

  let necroticCount = 0;
  let sloughCount = 0;
  let granulationCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    if (r > 60 && r > g * sensitivity && r > b * sensitivity && (r + g + b) < 650) {
      woundPixels++;
      
      if (r < 75 && g < 75 && b < 75) {
        necroticCount++;
      } else if (g > b * 0.95 && r > 90 && g > 80) {
        sloughCount++;
      } else {
        granulationCount++;
      }
      
      const x = (i / 4) % imageData.width;
      const y = Math.floor((i / 4) / imageData.width);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  const areaPercent = (woundPixels / totalPixels) * 100;
  const necroticPercent = woundPixels > 0 ? Math.round((necroticCount / woundPixels) * 100) : 0;
  const sloughPercent = woundPixels > 0 ? Math.round((sloughCount / woundPixels) * 100) : 0;
  const granulationPercent = woundPixels > 0 ? Math.max(0, 100 - necroticPercent - sloughPercent) : 0;

  return { 
    areaPercent, 
    boundingBox: { minX, maxX, minY, maxY },
    necroticPercent,
    sloughPercent,
    granulationPercent,
    maskArray: null
  };
}

/**
 * Generate a rough SVG mask based on bounding box.
 */
function generateDynamicMask(box, width, height, areaPercent) {
  if (areaPercent < 0.5 || box.minX > box.maxX) return '';
  
  const cx = (box.minX + box.maxX) / 2;
  const cy = (box.minY + box.maxY) / 2;
  const rx = (box.maxX - box.minX) / 2 * 1.1;
  const ry = (box.maxY - box.minY) / 2 * 1.1;
  
  return `M ${cx} ${cy - ry} A ${rx} ${ry} 0 1 0 ${cx} ${cy + ry} A ${rx} ${ry} 0 1 0 ${cx} ${cy - ry}`;
}

/**
 * Main wound analysis function (replaces mock with TensorFlow.js + pre-seeded data handler).
 */
async function analyzeWoundImage(imageBlob, source, previousEntries = [], sensitivity = 1.25) {
  await window.WoundUtils.delay(850); // simulated GPU pipeline delay
  
  const width = 400;
  const height = 300;
  
  const imageData = await getImageDataFromBlob(imageBlob, width, height);
  
  let areaPercent = 0;
  let necroticPercent = 0;
  let sloughPercent = 0;
  let granulationPercent = 0;
  let maskArray = null;
  
  // TensorFlow.js Tensor Pipeline
  if (typeof tf !== 'undefined') {
    try {
      const result = tf.tidy(() => {
        // Load pixels into GPU WebGL tensor
        const imgTensor = tf.browser.fromPixels(imageData); // Shape: [300, 400, 3]
        
        // Split RGB channels
        const channels = tf.split(imgTensor, 3, 2);
        const r = channels[0].squeeze(); // Shape: [300, 400]
        const g = channels[1].squeeze();
        const b = channels[2].squeeze();
        
        // Apply Red dominance heuristics inside tensor math
        const sensTensor = tf.scalar(sensitivity);
        const condR1 = r.greater(tf.scalar(60));
        const condR2 = r.greater(g.mul(sensTensor));
        const condR3 = r.greater(b.mul(sensTensor));
        
        // Exclude extreme brightness (light reflections or healthy skin gloss): R+G+B < 650
        const brightness = r.add(g).add(b);
        const condBrightness = brightness.less(tf.scalar(650));
        
        // Combine conditions to get final binary mask tensor
        const woundMask = condR1.and(condR2).and(condR3).and(condBrightness);
        
        // Sum segmented pixels
        const woundPixels = tf.sum(woundMask);
        
        // Classify tissues using tensor comparisons:
        // Necrotic: dark pixels inside wound mask (R, G, B < 75)
        const condNecrotic = r.less(tf.scalar(75))
          .and(g.less(tf.scalar(75)))
          .and(b.less(tf.scalar(75)))
          .and(woundMask);
          
        // Slough: Yellowish/fatty tissue (G > B * 0.95 && R > 90 && G > 80)
        const condSlough = g.greater(b.mul(tf.scalar(0.95)))
          .and(r.greater(tf.scalar(90)))
          .and(g.greater(tf.scalar(80)))
          .and(woundMask)
          .and(condNecrotic.not());
          
        // Granulation: red healing tissues (wound mask but not necrotic, not slough)
        const condGranulation = woundMask.and(condNecrotic.not()).and(condSlough.not());
        
        const necroticCount = tf.sum(condNecrotic);
        const sloughCount = tf.sum(condSlough);
        const granulationCount = tf.sum(condGranulation);
        
        // Fetch values back to JS scope
        return {
          maskData: woundMask.dataSync(), // 1D biner mask array
          woundCount: woundPixels.dataSync()[0],
          necroticCount: necroticCount.dataSync()[0],
          sloughCount: sloughCount.dataSync()[0],
          granulationCount: granulationCount.dataSync()[0]
        };
      });
      
      const totalPixels = width * height;
      areaPercent = (result.woundCount / totalPixels) * 100;
      maskArray = result.maskData;
      
      if (result.woundCount > 0) {
        necroticPercent = Math.round((result.necroticCount / result.woundCount) * 100);
        sloughPercent = Math.round((result.sloughCount / result.woundCount) * 100);
        granulationPercent = Math.max(0, 100 - necroticPercent - sloughPercent);
      }
    } catch (err) {
      console.error("TensorFlow.js computation failed:", err);
      // fallback to CPU
      const cpu = analyzePixels(imageData, sensitivity);
      areaPercent = cpu.areaPercent;
      necroticPercent = cpu.necroticPercent;
      sloughPercent = cpu.sloughPercent;
      granulationPercent = cpu.granulationPercent;
    }
  } else {
    // TensorFlow.js fallback CPU loop
    const cpu = analyzePixels(imageData, sensitivity);
    areaPercent = cpu.areaPercent;
    necroticPercent = cpu.necroticPercent;
    sloughPercent = cpu.sloughPercent;
    granulationPercent = cpu.granulationPercent;
  }
  
  // Format variables
  areaPercent = Math.round(areaPercent * 10) / 10;
  
  // Estimate absolute area in cm2
  const areaCm2 = Math.round(areaPercent * 1.2 * 10) / 10;
  
  // Calculate difference
  let areaChange = 0;
  let trend = 'stable';
  if (previousEntries.length > 0) {
    const lastEntry = previousEntries[previousEntries.length - 1];
    areaChange = Math.round((areaCm2 - lastEntry.areaCm2) * 10) / 10;
    
    if (areaChange < -0.3) {
      trend = 'improving';
    } else if (areaChange > 0.3) {
      trend = 'worsening';
    }
  }
  
  const { variance: blurScore, isBlurry } = detectBlur(imageData);
  const confidence = Math.min(99, Math.round(85 + (areaPercent > 0 ? 10 : 0) + Math.random() * 4));
  
  return {
    maskData: { path: '', tensor: maskArray }, // 1D array of mask values [0,1,1...]
    areaPercent,
    areaCm2,
    areaChange,
    trend,
    confidence,
    necroticPercent,
    sloughPercent,
    granulationPercent,
    blurScore,
    isBlurry,
    rawImageData: imageData
  };
}

/**
 * Draws the TF.js binary mask array to a 2D canvas overlay.
 */
function drawPixelMaskOnCanvas(canvasElement, maskArray, width = 400, height = 300, colorRgb = [0, 107, 95]) {
  if (!canvasElement || !maskArray) return;
  
  canvasElement.width = width;
  canvasElement.height = height;
  const ctx = canvasElement.getContext('2d');
  ctx.clearRect(0, 0, width, height);
  
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;
  
  for (let i = 0; i < maskArray.length; i++) {
    if (maskArray[i] > 0) {
      data[i * 4] = colorRgb[0];     // Red
      data[i * 4 + 1] = colorRgb[1]; // Green
      data[i * 4 + 2] = colorRgb[2]; // Blue
      data[i * 4 + 3] = 110;         // Alpha (translucent mask, ~43% opacity)
    } else {
      data[i * 4 + 3] = 0;           // Transparent
    }
  }
  
  ctx.putImageData(imgData, 0, 0);
}

/**
 * Laplacian Variance Blur Detection.
 */
function detectBlur(imageData) {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  
  const gray = new Float32Array(width * height);
  for (let i = 0; i < data.length; i += 4) {
    gray[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  
  const laplacian = new Float32Array(width * height);
  let sum = 0;
  let count = 0;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const val = 
        gray[idx + 1] +          // Right
        gray[idx - 1] +          // Left
        gray[idx + width] +      // Down
        gray[idx - width] -      // Up
        4 * gray[idx];           // Center
        
      laplacian[idx] = val;
      sum += val;
      count++;
    }
  }
  
  const mean = sum / count;
  
  let varianceSum = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const diff = laplacian[idx] - mean;
      varianceSum += diff * diff;
    }
  }
  
  const variance = varianceSum / count;
  const isBlurry = variance < 50.0;
  
  return { variance: Math.round(variance), isBlurry };
}

/**
 * Histogram Equalization for Contrast Enhancement.
 * Calculates histograms before and after the operation.
 */
function equalizeHistogram(imageData) {
  const data = imageData.data;
  const total = data.length / 4;
  
  // Calculate histogram BEFORE
  const histBefore = {
    r: new Uint32Array(256),
    g: new Uint32Array(256),
    b: new Uint32Array(256)
  };
  for (let i = 0; i < data.length; i += 4) {
    histBefore.r[data[i]]++;
    histBefore.g[data[i+1]]++;
    histBefore.b[data[i+2]]++;
  }
  
  // Equalize
  for (let channel = 0; channel < 3; channel++) {
    const hist = new Uint32Array(256);
    for (let i = channel; i < data.length; i += 4) {
      hist[data[i]]++;
    }
    
    const cdf = new Uint32Array(256);
    let cumulative = 0;
    for (let i = 0; i < 256; i++) {
      cumulative += hist[i];
      cdf[i] = cumulative;
    }
    
    let cdfMin = 0;
    for (let i = 0; i < 256; i++) {
      if (cdf[i] > 0) {
        cdfMin = cdf[i];
        break;
      }
    }
    
    for (let i = channel; i < data.length; i += 4) {
      const v = data[i];
      const newVal = Math.round(((cdf[v] - cdfMin) / (total - cdfMin)) * 255);
      data[i] = Math.max(0, Math.min(255, newVal));
    }
  }
  
  // Calculate histogram AFTER
  const histAfter = {
    r: new Uint32Array(256),
    g: new Uint32Array(256),
    b: new Uint32Array(256)
  };
  for (let i = 0; i < data.length; i += 4) {
    histAfter.r[data[i]]++;
    histAfter.g[data[i+1]]++;
    histAfter.b[data[i+2]]++;
  }
  
  return { histBefore, histAfter };
}

// Attach to global scope
window.WoundAI = {
  analyzeWoundImage,
  analyzePixels,
  generateDynamicMask,
  detectBlur,
  equalizeHistogram,
  drawPixelMaskOnCanvas,
  generateBlobSVGPath
};
