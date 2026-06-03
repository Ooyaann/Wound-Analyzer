/* js/ai-mock.js */

/**
 * Generates a smooth organic-looking SVG path representing a wound segmentation mask.
 * @param {number} width - Viewport width
 * @param {number} height - Viewport height
 * @param {number} areaPercent - The size of the wound, which controls radius
 * @returns {string} SVG Path string
 */
function generateBlobSVGPath(width, height, areaPercent) {
  if (areaPercent <= 0.5) return '';

  // Center coordinates with slight random jitter
  const cx = width / 2 + (Math.random() * 20 - 10);
  const cy = height / 2 + (Math.random() * 20 - 10);
  
  // Base radius derived from area percentage
  // SVG Area = PI * R^2. Let's scale it visually.
  const maxRadius = Math.min(width, height) * 0.4;
  const baseRadius = Math.max(15, Math.sqrt(areaPercent / 25) * maxRadius);
  
  const numPoints = 8;
  const points = [];
  
  // Generate outer points of the blob with random deviations
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    // Vary the radius for irregularity
    const randomFactor = 0.75 + Math.random() * 0.5; // between 0.75 and 1.25
    const r = baseRadius * randomFactor;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    points.push({ x, y });
  }
  
  // Create bezier curve linking points smoothly
  let path = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)} `;
  for (let i = 0; i < numPoints; i++) {
    const p0 = points[i];
    const p1 = points[(i + 1) % numPoints];
    const p2 = points[(i + 2) % numPoints];
    
    // Control points for smooth bezier
    const xc = (p0.x + p1.x) / 2;
    const yc = (p0.y + p1.y) / 2;
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
      // Draw preserving aspect ratio in center
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
 * Perform pixel-based color segmentation.
 * Identifies pixels that are distinctively reddish/darker (granulation/necrotic).
 */
function analyzePixels(imageData, sensitivity = 1.3) {
  const data = imageData.data;
  let woundPixels = 0;
  const totalPixels = data.length / 4;
  
  // Basic bounding box for SVG path approximation
  let minX = imageData.width, maxX = 0;
  let minY = imageData.height, maxY = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Heuristic: Red channel is dominant by the sensitivity factor over Green and Blue
    // Also ignore very bright (white) pixels which are usually glare or healthy skin
    if (r > 60 && r > g * sensitivity && r > b * sensitivity && (r + g + b) < 650) {
      woundPixels++;
      
      const x = (i / 4) % imageData.width;
      const y = Math.floor((i / 4) / imageData.width);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  const areaPercent = (woundPixels / totalPixels) * 100;
  return { areaPercent, boundingBox: { minX, maxX, minY, maxY } };
}

/**
 * Generate a rough SVG mask based on bounding box.
 */
function generateDynamicMask(box, width, height, areaPercent) {
  if (areaPercent < 0.5 || box.minX > box.maxX) return '';
  
  const cx = (box.minX + box.maxX) / 2;
  const cy = (box.minY + box.maxY) / 2;
  const rx = (box.maxX - box.minX) / 2 * 1.1; // Add 10% padding
  const ry = (box.maxY - box.minY) / 2 * 1.1;
  
  return `M ${cx} ${cy - ry} A ${rx} ${ry} 0 1 0 ${cx} ${cy + ry} A ${rx} ${ry} 0 1 0 ${cx} ${cy - ry}`;
}

/**
 * Main wound analysis function (replaces mock).
 */
async function analyzeWoundImage(imageBlob, source, previousEntries = [], sensitivity = 1.25) {
  // Simulate processing delay for UX (only on first load)
  await window.WoundUtils.delay(800);
  
  const width = 400;
  const height = 300;
  
  const imageData = await getImageDataFromBlob(imageBlob, width, height);
  const { areaPercent: rawArea, boundingBox } = analyzePixels(imageData, sensitivity);
  
  // Format figures
  let areaPercent = Math.round(rawArea * 10) / 10;
  
  // Force 0 for camera healthy skin demo if specifically requested by user (optional fallback)
  // For realistic demo, we just trust the algorithm.
  
  // Estimate absolute area in cm²
  const areaCm2 = Math.round(areaPercent * 1.2 * 10) / 10;
  
  // Calculate difference
  let areaChange = 0;
  let trend = 'stable';
  if (previousEntries.length > 0) {
    const lastEntry = previousEntries[previousEntries.length - 1];
    areaChange = Math.round((areaPercent - lastEntry.areaPercent) * 10) / 10;
    
    if (areaChange < -0.5) {
      trend = 'improving';
    } else if (areaChange > 0.5) {
      trend = 'worsening';
    }
  } else {
    trend = areaPercent > 0 ? 'stable' : 'stable';
  }
  
  const confidence = Math.min(99, Math.round(85 + (areaPercent > 0 ? 10 : 0) + Math.random() * 4));
  const maskPath = generateDynamicMask(boundingBox, width, height, areaPercent);
  
  return {
    maskData: { path: maskPath },
    areaPercent,
    areaCm2,
    areaChange,
    trend,
    confidence,
    rawImageData: imageData // Store for interactive recalculation
  };
}

// Attach to global scope
window.WoundAI = {
  analyzeWoundImage,
  analyzePixels,
  generateDynamicMask
};
