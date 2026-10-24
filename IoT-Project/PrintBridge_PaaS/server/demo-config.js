// Demo Mode Configuration
// Set to true to enable demo mode (no Cloudinary uploads, no printing)

const DEMO_MODE = process.env.DEMO_MODE === 'true' || false;

// Sample PDFs for demo mode (simulated page counts)
// Using publicly accessible placeholder PDFs
const DEMO_PDFS = [
  { 
    name: 'Sample Resume', 
    pages: 2, 
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    description: '2-page resume document'
  },
  { 
    name: 'Sample Report', 
    pages: 5, 
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    description: '5-page business report'
  },
  { 
    name: 'Sample Assignment', 
    pages: 8, 
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    description: '8-page college assignment'
  },
  { 
    name: 'Sample Presentation', 
    pages: 12, 
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    description: '12-page presentation slides'
  },
  { 
    name: 'Sample Notes', 
    pages: 3, 
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    description: '3-page study notes'
  },
  { 
    name: 'Sample Project', 
    pages: 15, 
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    description: '15-page project documentation'
  },
  { 
    name: 'Sample Certificate', 
    pages: 1, 
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    description: '1-page certificate'
  }
];

function getDemoMode() {
  return DEMO_MODE;
}

function getRandomDemoPDF() {
  return DEMO_PDFS[Math.floor(Math.random() * DEMO_PDFS.length)];
}

function getDemoPDFByPageCount(targetPages) {
  // Try to find a demo PDF with similar page count
  const closest = DEMO_PDFS.reduce((prev, curr) => {
    return Math.abs(curr.pages - targetPages) < Math.abs(prev.pages - targetPages) ? curr : prev;
  });
  return closest;
}

module.exports = {
  getDemoMode,
  getRandomDemoPDF,
  getDemoPDFByPageCount,
  DEMO_MODE
};
