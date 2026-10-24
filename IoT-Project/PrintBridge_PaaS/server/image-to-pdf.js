/**
 * Image to PDF Converter
 * Converts multiple images into a single PDF with layout options
 */

const PDFDocument = require('pdfkit');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * Convert images to PDF with specified layout
 * @param {Array} imagePaths - Array of image file paths
 * @param {number} imagesPerPage - Number of images per page (1, 2, 4, 9, 16)
 * @param {string} outputPath - Output PDF file path
 */
async function imagesToPDF(imagePaths, imagesPerPage, outputPath) {
  return new Promise(async (resolve, reject) => {
    try {
      // A4 size in points (72 points = 1 inch)
      const pageWidth = 595.28;  // A4 width in points
      const pageHeight = 841.89; // A4 height in points
      const margin = 20;
      
      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: margin
      });
      
      // Pipe to file
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);
      
      // Calculate layout
      const layout = getLayout(imagesPerPage);
      const cols = layout.cols;
      const rows = layout.rows;
      
      const availableWidth = pageWidth - (2 * margin);
      const availableHeight = pageHeight - (2 * margin);
      
      const imageWidth = availableWidth / cols - (margin / cols);
      const imageHeight = availableHeight / rows - (margin / rows);
      
      console.log(`📄 Creating PDF with ${imagesPerPage} images per page`);
      console.log(`   Layout: ${cols}x${rows} grid`);
      console.log(`   Image size: ${imageWidth.toFixed(0)}x${imageHeight.toFixed(0)} points`);
      
      // Process images
      let imageIndex = 0;
      
      while (imageIndex < imagePaths.length) {
        // Add new page (except for first page)
        if (imageIndex > 0) {
          doc.addPage();
        }
        
        // Add images to current page
        for (let row = 0; row < rows && imageIndex < imagePaths.length; row++) {
          for (let col = 0; col < cols && imageIndex < imagePaths.length; col++) {
            const imagePath = imagePaths[imageIndex];
            
            try {
              // Resize image to fit
              const resizedImageBuffer = await sharp(imagePath)
                .resize({
                  width: Math.floor(imageWidth * 2), // 2x for better quality
                  height: Math.floor(imageHeight * 2),
                  fit: 'inside'
                })
                .toBuffer();
              
              // Calculate position
              const x = margin + (col * (imageWidth + margin / cols));
              const y = margin + (row * (imageHeight + margin / rows));
              
              // Add image to PDF
              doc.image(resizedImageBuffer, x, y, {
                fit: [imageWidth, imageHeight],
                align: 'center',
                valign: 'center'
              });
              
              console.log(`   ✓ Added image ${imageIndex + 1}/${imagePaths.length}`);
              
            } catch (error) {
              console.error(`   ✗ Error processing image ${imageIndex + 1}:`, error.message);
            }
            
            imageIndex++;
          }
        }
      }
      
      // Finalize PDF
      doc.end();
      
      stream.on('finish', () => {
        console.log(`✓ PDF created: ${outputPath}`);
        console.log(`   Total pages: ${Math.ceil(imagePaths.length / imagesPerPage)}`);
        resolve(outputPath);
      });
      
      stream.on('error', reject);
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get grid layout for images per page
 */
function getLayout(imagesPerPage) {
  const layouts = {
    1: { cols: 1, rows: 1 },
    2: { cols: 1, rows: 2 },
    4: { cols: 2, rows: 2 },
    9: { cols: 3, rows: 3 },
    16: { cols: 4, rows: 4 }
  };
  
  return layouts[imagesPerPage] || layouts[1];
}

module.exports = { imagesToPDF };
