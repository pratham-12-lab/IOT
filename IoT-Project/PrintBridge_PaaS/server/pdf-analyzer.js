const pdfParse = require('pdf-parse');
const https = require('https');
const http = require('http');

async function analyzePDF(fileUrl) {
  try {
    // Download PDF from URL
    const pdfBuffer = await downloadFile(fileUrl);
    
    // Parse PDF to get page count
    const data = await pdfParse(pdfBuffer);
    
    return {
      pageCount: data.numpages,
      text: data.text.substring(0, 200), // First 200 chars for preview
      info: data.info
    };
  } catch (error) {
    console.error('Error analyzing PDF:', error.message);
    // Default to 1 page if analysis fails
    return {
      pageCount: 1,
      text: '',
      info: {}
    };
  }
}

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Download failed with status: ${response.statusCode}`));
        return;
      }
      
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

module.exports = { analyzePDF };
