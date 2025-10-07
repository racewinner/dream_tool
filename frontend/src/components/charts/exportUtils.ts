import { Chart, ChartType, ChartData, Plugin } from 'chart.js';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Options for exporting a chart
 */
export interface ExportOptions {
  /**
   * The chart instance to export
   */
  chart: Chart;
  /**
   * The title of the chart (for PDF export)
   */
  title?: string;
  /**
   * The subtitle of the chart (for PDF export)
   */
  subtitle?: string;
  /**
   * The width of the exported image/PDF (in pixels)
   * @default 1200
   */
  width?: number;
  /**
   * The height of the exported image/PDF (in pixels)
   * @default 800
   */
  height?: number;
  /**
   * The background color of the exported image/PDF
   * @default '#FFFFFF' (white)
   */
  backgroundColor?: string;
  /**
   * The format of the exported file
   * @default 'png'
   */
  format?: 'png' | 'jpeg' | 'pdf';
  /**
   * The quality of the exported image (0-1)
   * @default 1
   */
  quality?: number;
  /**
   * Whether to include the legend in the export
   * @default true
   */
  includeLegend?: boolean;
  /**
   * The filename to use when downloading the file
   * @default 'chart-export'
   */
  filename?: string;
}

/**
 * Default export options
 */
const DEFAULT_EXPORT_OPTIONS: Partial<ExportOptions> = {
  width: 1200,
  height: 800,
  backgroundColor: '#FFFFFF',
  format: 'png',
  quality: 1,
  includeLegend: true,
  filename: 'chart-export',
};

/**
 * Exports a chart as an image or PDF
 * @param options Export options
 */
export const exportChart = async (options: ExportOptions): Promise<void> => {
  const {
    chart,
    title,
    subtitle,
    width = 1200,
    height = 800,
    backgroundColor = '#FFFFFF',
    format = 'png',
    quality = 1,
    includeLegend = true,
    filename = 'chart-export',
  } = { ...DEFAULT_EXPORT_OPTIONS, ...options };

  // Get the chart canvas
  const canvas = chart.canvas;
  const originalWidth = canvas.width;
  const originalHeight = canvas.height;
  const originalAspectRatio = originalWidth / originalHeight;

  try {
    // Create a temporary container for the export
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    container.style.backgroundColor = backgroundColor;
    container.style.padding = '20px';
    container.style.boxSizing = 'border-box';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    document.body.appendChild(container);

    // Add title and subtitle if provided
    if (title || subtitle) {
      const titleContainer = document.createElement('div');
      titleContainer.style.textAlign = 'center';
      titleContainer.style.marginBottom = '20px';
      titleContainer.style.fontFamily = 'Arial, sans-serif';
      
      if (title) {
        const titleEl = document.createElement('h2');
        titleEl.textContent = title;
        titleEl.style.margin = '0 0 8px 0';
        titleEl.style.color = '#333333';
        titleContainer.appendChild(titleEl);
      }
      
      if (subtitle) {
        const subtitleEl = document.createElement('p');
        subtitleEl.textContent = subtitle;
        subtitleEl.style.margin = '0';
        subtitleEl.style.color = '#666666';
        subtitleEl.style.fontSize = '14px';
        titleContainer.appendChild(subtitleEl);
      }
      
      container.appendChild(titleContainer);
    }

    // Create a new canvas for the chart
    const chartCanvas = document.createElement('canvas');
    const ctx = chartCanvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not create canvas context');
    }

    // Calculate the chart dimensions while maintaining aspect ratio
    let chartWidth = width - 40; // Account for padding
    let chartHeight = height - (title || subtitle ? 80 : 40); // Account for title/subtitle and padding
    
    if (chartWidth / chartHeight > originalAspectRatio) {
      chartWidth = chartHeight * originalAspectRatio;
    } else {
      chartHeight = chartWidth / originalAspectRatio;
    }

    // Set the canvas dimensions
    chartCanvas.width = chartWidth;
    chartCanvas.height = chartHeight;
    chartCanvas.style.maxWidth = '100%';
    chartCanvas.style.height = 'auto';
    container.appendChild(chartCanvas);

    // Draw the chart on the new canvas
    ctx.drawImage(canvas, 0, 0, chartWidth, chartHeight);

    // Add the legend if needed
    if (includeLegend) {
      try {
        const legendItems = (chart as any).legend?.legendItems || [];
        if (legendItems.length > 0) {
          const legendContainer = document.createElement('div');
          legendContainer.style.marginTop = '20px';
          legendContainer.style.display = 'flex';
          legendContainer.style.flexWrap = 'wrap';
          legendContainer.style.justifyContent = 'center';
          legendContainer.style.gap = '10px';
          
          legendItems.forEach((item: { fillStyle?: string; text?: string }) => {
            const legendItem = document.createElement('div');
            legendItem.style.display = 'flex';
            legendItem.style.alignItems = 'center';
            legendItem.style.margin = '0 10px 5px 0';
            
            const colorBox = document.createElement('div');
            colorBox.style.width = '12px';
            colorBox.style.height = '12px';
            colorBox.style.marginRight = '5px';
            colorBox.style.backgroundColor = item.fillStyle || '#CCCCCC';
            colorBox.style.border = '1px solid #999999';
            
            const label = document.createElement('span');
            label.textContent = item.text || '';
            label.style.fontSize = '12px';
            label.style.color = '#333333';
            
            legendItem.appendChild(colorBox);
            legendItem.appendChild(label);
            legendContainer.appendChild(legendItem);
          });
          
          container.appendChild(legendContainer);
        }
      } catch (error) {
        console.warn('Could not render legend:', error);
        // Continue without legend if there's an error
      }
    }

    // Export as image or PDF
    if (format === 'pdf') {
      // Use html2canvas to capture the container
      const canvas = await html2canvas(container as HTMLElement, {
        background: backgroundColor,
        useCORS: true,
        logging: false,
      });
      
      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: width > height ? 'landscape' : 'portrait',
        unit: 'mm',
      });
      
      // Calculate dimensions to fit the PDF
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add additional pages if the content is taller than one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Save the PDF
      pdf.save(`${filename}.pdf`);
    } else {
      // Export as image (PNG or JPEG)
      const exportCanvas = await html2canvas(container as HTMLElement, {
        background: backgroundColor,
        useCORS: true,
        logging: false,
      });
      
      // Create download link
      const link = document.createElement('a');
      link.download = `${filename}.${format}`;
      link.href = exportCanvas.toDataURL(`image/${format}`, quality);
      link.click();
    }
  } catch (error) {
    console.error('Error exporting chart:', error);
    throw error;
  } finally {
    // Clean up
    try {
      const containers = document.querySelectorAll('div[style*="position: absolute; left: -9999px"]');
      containers.forEach(container => {
        try {
          container.parentNode?.removeChild(container);
        } catch (cleanupError) {
          console.warn('Error during container cleanup:', cleanupError);
        }
      });
    } catch (error) {
      console.warn('Error during cleanup:', error);
    }
  }
};

/**
 * Gets a suggested filename based on chart title and current date
 * @param chart The chart instance
 * @param format The export format
 * @returns A suggested filename
 */
export const getSuggestedFilename = (chart: Chart, format: string = 'png'): string => {
  try {
    const title = (chart.options.plugins?.title as any)?.text || 'chart';
    const date = new Date().toISOString().split('T')[0];
    return `${String(title).toLowerCase().replace(/\s+/g, '-')}-${date}.${format}`;
  } catch (error) {
    console.warn('Error generating filename, using default:', error);
    return `chart-${new Date().toISOString().split('T')[0]}.${format}`;
  }
};

/**
 * Handles the download button click
 * @param chart The chart instance
 * @param options Optional export options
 */
export const handleDownloadClick = (chart: Chart, options: Partial<ExportOptions> = {}) => {
  const defaultOptions: Partial<ExportOptions> = {
    chart,
    filename: getSuggestedFilename(chart, options.format),
    ...options,
  };
  
  exportChart(defaultOptions as ExportOptions).catch(error => {
    console.error('Failed to export chart:', error);
  });
};
