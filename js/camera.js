/* js/camera.js */

class CameraController {
  constructor() {
    this.stream = null;
    this.videoElement = null;
    this.canvasElement = null;
    this.isTorchOn = false;
    this.track = null;
  }

  /**
   * Start the camera stream on the specified video element.
   * @param {HTMLVideoElement} videoElement 
   */
  async startCamera(videoElement) {
    this.videoElement = videoElement;
    this.isTorchOn = false;
    
    const constraints = {
      video: {
        facingMode: { ideal: 'environment' }, // Default to back camera
        width: { ideal: 1280 },
        height: { ideal: 960 }
      },
      audio: false
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      console.warn('Environment camera not found, trying default video source:', err);
      // Fallback to any camera
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    }

    this.videoElement.srcObject = this.stream;
    this.videoElement.setAttribute('playsinline', true);
    
    // Play video stream
    await this.videoElement.play();
    
    // Fetch video track for flash/torch control
    this.track = this.stream.getVideoTracks()[0];
  }

  /**
   * Stop the current camera stream and release resources.
   */
  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    this.stream = null;
    this.track = null;
    this.isTorchOn = false;
  }

  /**
   * Toggle the torch (flashlight) if supported by the browser and device.
   * @returns {Promise<boolean>} Current torch state
   */
  async toggleTorch() {
    if (!this.track) return false;
    
    const capabilities = this.track.getCapabilities();
    if (!capabilities.torch) {
      console.log('Torch is not supported on this device/browser.');
      return false;
    }

    try {
      this.isTorchOn = !this.isTorchOn;
      await this.track.applyConstraints({
        advanced: [{ torch: this.isTorchOn }]
      });
      return this.isTorchOn;
    } catch (err) {
      console.error('Failed to toggle torch:', err);
      this.isTorchOn = false;
      return false;
    }
  }

  /**
   * Capture a photo from the video feed.
   * Draws the current frame to a canvas and returns a Blob.
   * @returns {Promise<Blob>} Captured image blob
   */
  capturePhoto() {
    return new Promise((resolve, reject) => {
      if (!this.videoElement || !this.stream) {
        return reject(new Error('Camera is not running'));
      }

      const video = this.videoElement;
      const canvas = document.createElement('canvas');
      
      // Capture at actual video feed dimensions to preserve quality
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      // Draw mirror flip if using front camera (optional, keeping standard draw)
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas capture blob empty'));
          }
        },
        'image/jpeg',
        0.9 // high quality capture, compression occurs later
      );
    });
  }

  /**
   * Opens file selection from device gallery.
   * @returns {Promise<File>} Chosen file object
   */
  selectFromGallery() {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          resolve(file);
        } else {
          reject(new Error('No file selected'));
        }
      };

      input.onerror = (err) => {
        reject(err);
      };

      // Trigger selection
      input.click();
    });
  }
}

// Attach globally
window.WoundCamera = new CameraController();
