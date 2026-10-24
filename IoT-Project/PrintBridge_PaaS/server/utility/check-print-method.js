const fs = require('fs');

console.log('========================================');
console.log('CHECKING AVAILABLE PRINT METHODS');
console.log('========================================\n');

// Method 1: PDFtoPrinter
const pdfToPrinterPath = 'C:\\PDFtoPrinter\\PDFtoPrinter.exe';
if (fs.existsSync(pdfToPrinterPath)) {
  console.log('✅ Method 1: PDFtoPrinter');
  console.log('   Path:', pdfToPrinterPath);
  console.log('   Status: AVAILABLE (Most reliable)');
  console.log('   This will be used for printing\n');
} else {
  console.log('❌ Method 1: PDFtoPrinter');
  console.log('   Path:', pdfToPrinterPath);
  console.log('   Status: NOT FOUND\n');
}

// Method 2: SumatraPDF
const sumatraPaths = [
  'C:\\Users\\Varun\\AppData\\Local\\SumatraPDF\\SumatraPDF.exe',
  'C:\\Program Files\\SumatraPDF\\SumatraPDF.exe',
  'C:\\Program Files (x86)\\SumatraPDF\\SumatraPDF.exe'
];

let sumatraFound = false;
console.log('Method 2: SumatraPDF');
for (const sumatraPath of sumatraPaths) {
  if (fs.existsSync(sumatraPath)) {
    console.log('   ✅ Found at:', sumatraPath);
    console.log('   Status: AVAILABLE');
    if (!fs.existsSync(pdfToPrinterPath)) {
      console.log('   This will be used for printing');
    }
    sumatraFound = true;
    break;
  }
}
if (!sumatraFound) {
  console.log('   ❌ Not found in any location');
}
console.log();

// Method 3: Adobe Acrobat Reader
const adobePaths = [
  'C:\\Program Files\\Adobe\\Acrobat DC\\Acrobat\\Acrobat.exe',
  'C:\\Program Files (x86)\\Adobe\\Acrobat Reader DC\\Reader\\AcroRd32.exe',
  'C:\\Program Files\\Adobe\\Acrobat Reader DC\\Reader\\AcroRd32.exe'
];

let adobeFound = false;
console.log('Method 3: Adobe Acrobat Reader');
for (const adobePath of adobePaths) {
  if (fs.existsSync(adobePath)) {
    console.log('   ✅ Found at:', adobePath);
    console.log('   Status: AVAILABLE');
    if (!fs.existsSync(pdfToPrinterPath) && !sumatraFound) {
      console.log('   This will be used for printing');
    }
    adobeFound = true;
    break;
  }
}
if (!adobeFound) {
  console.log('   ❌ Not found in any location');
}
console.log();

// Method 4: PowerShell
console.log('Method 4: PowerShell');
console.log('   Status: ALWAYS AVAILABLE (fallback)');
if (!fs.existsSync(pdfToPrinterPath) && !sumatraFound && !adobeFound) {
  console.log('   This will be used for printing');
}
console.log();

console.log('========================================');
console.log('SUMMARY');
console.log('========================================\n');

if (fs.existsSync(pdfToPrinterPath)) {
  console.log('🖨️  ACTIVE METHOD: PDFtoPrinter');
  console.log('   Most reliable method for Windows printing');
} else if (sumatraFound) {
  console.log('🖨️  ACTIVE METHOD: SumatraPDF');
  console.log('   Good alternative for PDF printing');
} else if (adobeFound) {
  console.log('🖨️  ACTIVE METHOD: Adobe Acrobat Reader');
  console.log('   Standard PDF reader printing');
} else {
  console.log('🖨️  ACTIVE METHOD: PowerShell');
  console.log('   Fallback method (may require PDF association)');
  console.log('\n   ⚠️  RECOMMENDATION: Install SumatraPDF for better reliability');
  console.log('   Download: https://www.sumatrapdfreader.org/download-free-pdf-viewer');
}

console.log('\n========================================\n');
