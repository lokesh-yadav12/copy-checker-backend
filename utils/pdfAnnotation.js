import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

/**
 * Merge canvas annotations with PDF
 * @param {string} originalPdfPath - Path to original PDF
 * @param {Array} annotations - Array of annotation strokes
 * @param {string} outputPath - Path to save annotated PDF
 */
export const mergeAnnotationsWithPDF = async (originalPdfPath, annotations, outputPath) => {
  try {
    // Read the original PDF
    const existingPdfBytes = fs.readFileSync(originalPdfPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    
    const pages = pdfDoc.getPages();
    
    // Group annotations by page
    const annotationsByPage = {};
    annotations.forEach(stroke => {
      if (!annotationsByPage[stroke.page]) {
        annotationsByPage[stroke.page] = [];
      }
      annotationsByPage[stroke.page].push(stroke);
    });
    
    // Draw annotations on each page
    for (const [pageNum, strokes] of Object.entries(annotationsByPage)) {
      const pageIndex = parseInt(pageNum) - 1;
      if (pageIndex < 0 || pageIndex >= pages.length) continue;
      
      const page = pages[pageIndex];
      const { width, height } = page.getSize();
      
      strokes.forEach(stroke => {
        if (stroke.points.length < 2) return;
        
        // Convert hex color to RGB
        const color = hexToRgb(stroke.color);
        
        // Draw lines between points
        for (let i = 0; i < stroke.points.length - 1; i++) {
          const start = stroke.points[i];
          const end = stroke.points[i + 1];
          
          // Convert canvas coordinates to PDF coordinates
          // Canvas: top-left origin, PDF: bottom-left origin
          const x1 = start.x;
          const y1 = height - start.y;
          const x2 = end.x;
          const y2 = height - end.y;
          
          page.drawLine({
            start: { x: x1, y: y1 },
            end: { x: x2, y: y2 },
            thickness: stroke.width,
            color: rgb(color.r, color.g, color.b),
            opacity: 1,
          });
        }
      });
    }
    
    // Save the annotated PDF
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, pdfBytes);
    
    return outputPath;
  } catch (error) {
    console.error('Error merging annotations with PDF:', error);
    throw error;
  }
};

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 0, g: 0, b: 0 };
}
