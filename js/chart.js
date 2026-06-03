/* js/chart.js */

class ChartController {
  constructor() {
    this.chartInstance = null;
  }

  /**
   * Destroys existing chart instance if any.
   */
  destroyChart() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }

  /**
   * Render the wound progression line chart.
   * @param {HTMLCanvasElement} canvasElement - The canvas to draw the chart on
   * @param {Array} entries - List of entries for the session, sorted ascending by time
   */
  renderProgressChart(canvasElement, entries) {
    this.destroyChart();

    if (typeof Chart === 'undefined') {
      console.error('Chart.js is not loaded');
      const insightEl = document.getElementById('chart-insight-text');
      if (insightEl) {
        insightEl.innerHTML = '<span style="color:var(--error)">Gagal memuat grafik. Hubungkan ke internet untuk memuat visualisasi tren.</span>';
      }
      return;
    }

    if (!entries || entries.length === 0) {
      console.warn('No entries provided for progress chart');
      return;
    }

    const ctx = canvasElement.getContext('2d');
    
    // Sort entries ascending by date to be sure
    const sortedEntries = [...entries].sort((a, b) => a.takenAt - b.takenAt);
    
    // Extract data points
    const labels = sortedEntries.map(entry => {
      const date = new Date(entry.takenAt);
      return `${date.getDate()} ${date.toLocaleString('id-ID', { month: 'short' })}`;
    });
    
    const areaData = sortedEntries.map(entry => entry.areaCm2);

    // Create gradient fill underneath the curve
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(0, 107, 95, 0.25)'); // Secondary accent color at top
    gradient.addColorStop(1, 'rgba(0, 107, 95, 0.00)'); // Fades out at bottom

    const config = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Ukuran Luka (cm²)',
          data: areaData,
          borderColor: '#006b5f', // Medical Teal
          borderWidth: 3,
          backgroundColor: gradient,
          fill: true,
          tension: 0.35, // Smooth spline
          pointBackgroundColor: '#006b5f',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointHoverBackgroundColor: '#006b5f',
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false // We use our own legends or header
          },
          tooltip: {
            enabled: true,
            backgroundColor: '#131b2e', // Deep Slate
            titleFont: {
              family: 'Be Vietnam Pro',
              size: 12,
              weight: 'bold'
            },
            bodyFont: {
              family: 'Be Vietnam Pro',
              size: 14
            },
            padding: 12,
            cornerRadius: 12,
            displayColors: false,
            callbacks: {
              label: (context) => {
                const index = context.dataIndex;
                const entry = sortedEntries[index];
                return [
                  `Ukuran: ${context.parsed.y} cm²`,
                  `Persentase: ${entry.areaPercent}%`,
                  `Metode: ${entry.source === 'camera' ? 'Kamera HP' : 'Galeri'}`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#45464d',
              font: {
                family: 'Be Vietnam Pro',
                size: 11
              }
            }
          },
          y: {
            grid: {
              color: '#eff4ff',
              drawBorder: false
            },
            ticks: {
              color: '#45464d',
              font: {
                family: 'Be Vietnam Pro',
                size: 11
              },
              // Ensure integer ticks or simple fractions
              callback: (value) => `${value} cm²`
            },
            min: 0
          }
        },
        interaction: {
          mode: 'index',
          intersect: false
        }
      }
    };

    // Instantiate Chart.js
    this.chartInstance = new Chart(canvasElement, config);
  }
}

// Attach globally
window.WoundChart = new ChartController();
