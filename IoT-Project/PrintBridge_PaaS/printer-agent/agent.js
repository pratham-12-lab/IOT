const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const config = require('./config');

// Configuration
const SERVER_URL = config.SERVER_URL;
const POLL_INTERVAL = config.POLL_INTERVAL;
const DOWNLOAD_DIR = path.join(__dirname, 'downloads');
const PRINTER_NAME = config.PRINTER_NAME;
const PRINTED_JOBS_FILE = path.join(__dirname, 'printed-jobs.json');

// Demo Mode Configuration
const DEMO_MODE = process.env.DEMO_MODE === 'true' || false;

// Create downloads directory if it doesn't exist
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

console.log('=================================');
console.log('PrintBridge-PaaS');
console.log('Printer as a Service');
console.log('HP LaserJet Professional P1108 Controller');
console.log('=================================\n');

if (DEMO_MODE) {
  console.log('🎭 DEMO MODE ENABLED');
  console.log('   Print jobs will be simulated (no actual printing)');
  console.log('   No files will be downloaded');
  console.log('');
}

console.log('Download directory:', DOWNLOAD_DIR);
console.log('Server URL:', SERVER_URL);
console.log('Printer:', PRINTER_NAME);
console.log('Polling interval:', POLL_INTERVAL / 1000, 'seconds');
console.log('Demo Mode:', DEMO_MODE ? 'ACTIVE' : 'DISABLED');
console.log('');

// Track printed jobs to avoid duplicates (persistent storage)
let printedJobs = new Set();

// Load printed jobs from file
function loadPrintedJobs() {
  try {
    if (fs.existsSync(PRINTED_JOBS_FILE)) {
      const data = fs.readFileSync(PRINTED_JOBS_FILE, 'utf8');
      const jobsData = JSON.parse(data);
      
      // Clean up old entries (older than 30 days)
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const validJobs = jobsData.filter(job => job.timestamp > thirtyDaysAgo);
      
      printedJobs = new Set(validJobs.map(job => job.id));
      
      console.log(`✓ Loaded ${printedJobs.size} printed job(s) from history`);
      
      // Save cleaned data back if we removed old entries
      if (validJobs.length !== jobsData.length) {
        savePrintedJobs();
        console.log(`  Cleaned up ${jobsData.length - validJobs.length} old entries\n`);
      }
    } else {
      console.log('✓ No previous print history found (fresh start)\n');
    }
  } catch (error) {
    console.error('✗ Error loading printed jobs history:', error.message);
    console.log('  Starting with empty history\n');
    printedJobs = new Set();
  }
}

// Save printed jobs to file (preserves original timestamps)
function savePrintedJobs() {
  try {
    // Load existing jobs with their original timestamps
    let existing = [];
    if (fs.existsSync(PRINTED_JOBS_FILE)) {
      const data = fs.readFileSync(PRINTED_JOBS_FILE, 'utf8');
      existing = JSON.parse(data);
    }
    
    // Create a map of existing jobs: id -> timestamp
    const existingMap = new Map(existing.map(j => [j.id, j.timestamp]));
    
    // Add new IDs with current time; keep old IDs' original timestamps
    for (const id of printedJobs) {
      if (!existingMap.has(id)) {
        existingMap.set(id, Date.now()); // Only set timestamp for NEW jobs
      }
    }
    
    // Clean up old entries (older than 30 days)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const merged = Array.from(existingMap.entries())
      .filter(([, timestamp]) => timestamp > thirtyDaysAgo)
      .map(([id, timestamp]) => ({ id, timestamp }));
    
    fs.writeFileSync(PRINTED_JOBS_FILE, JSON.stringify(merged, null, 2), 'utf8');
  } catch (error) {
    console.error('✗ Error saving printed jobs history:', error.message);
  }
}

// Load printed jobs on startup
loadPrintedJobs();

console.log('✓ Printer agent ready - All paid jobs will be printed\n');

let isProcessing = false; // Flag to prevent concurrent processing

async function pollJobs() {
  // Skip if already processing a job
  if (isProcessing) {
    process.stdout.write('⏳');
    return;
  }
  
  try {
    const res = await axios.get(`${SERVER_URL}/api/jobs`);
    
    // Filter for jobs that are:
    // 1. Approved and paid
    // 2. NOT already printed (server-side tracking)
    // 3. NOT in local printed history (backup protection)
    const jobs = res.data.filter(j => {
      return j.status === 'approved' && 
             j.paymentStatus === 'paid' &&
             !j.printed &&                 // Truthy check (handles undefined/null)
             !printedJobs.has(j.id);       // Local backup deduplication
    });
    
    // Sort by job.id (actual creation timestamp) for reliable FCFS
    jobs.sort((a, b) => {
      const aTime = typeof a.id === 'number' ? a.id : new Date(a.id).getTime();
      const bTime = typeof b.id === 'number' ? b.id : new Date(b.id).getTime();
      return aTime - bTime; // Oldest first (FCFS)
    });

    // Process ONLY the first job (one at a time)
    if (jobs.length > 0) {
      const job = jobs[0]; // Get first job in queue
      const jobTime = new Date(job.id).toLocaleTimeString('en-IN');
      const ticketNumber = job.ticketNumber || 'N/A';
      const copies = job.copies || 1;
      
      console.log(`\n✓ NEW PAID JOB FOUND!`);
      console.log(`  Queue Position: 1 of ${jobs.length}`);
      console.log(`  Ticket Number: #${ticketNumber}`);
      console.log(`  Job ID: ${job.id}`);
      console.log(`  Created at: ${jobTime}`);
      console.log(`  Payment ID: ${job.paymentId}`);
      console.log(`  Payment Status: ${job.paymentStatus}`);
      console.log(`  Pages: ${job.pageCount}`);
      console.log(`  Copies: ${copies}`);
      console.log(`  Color: ${job.isColor ? 'Yes' : 'No (B&W)'}`);
      console.log(`  File URL: ${job.fileUrl}`);
      console.log(`  Printed: ${job.printed}`);
      
      if (jobs.length > 1) {
        console.log(`\n📋 ${jobs.length - 1} more job(s) waiting in queue...`);
      }
      
      isProcessing = true; // Set flag before processing
      try {
        await printJob(job);
      } finally {
        isProcessing = false; // Always clear flag, even if printJob throws
      }
    } else {
      process.stdout.write('.');
    }

  } catch (error) {
    console.error('\n✗ Error polling jobs:', error.message);
  }
}

// Mark job as printed with retry logic (prevents duplicate prints)
async function markJobPrinted(jobId, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await axios.post(`${SERVER_URL}/api/jobs/${jobId}/printed`);
      console.log(`✓ Job ${jobId} marked as PRINTED on server`);
      return true;
    } catch (err) {
      console.error(`✗ Attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt < retries) {
        const delay = 2000 * attempt; // Exponential backoff
        console.log(`  Retrying in ${delay/1000} seconds...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  console.error(`✗ All ${retries} attempts failed. Local dedup will block reprint.`);
  return false;
}

async function printJob(job) {
  try {
    const ticketNumber = job.ticketNumber || 'N/A';  // Backward compatible
    const copies = job.copies || 1;  // Get number of copies
    
    console.log(`\n╔════════════════════════════════════════╗`);
    console.log(`║   NOW PRINTING TICKET #${String(ticketNumber).padEnd(16, ' ')}║`);
    console.log(`╚════════════════════════════════════════╝`);
    console.log(`\n→ Processing print job ${job.id}...`);
    console.log(`  Ticket Number: #${ticketNumber}`);
    console.log(`  Copies: ${copies}`);
    
    // ★ CRITICAL: Add to local Set IMMEDIATELY - BEFORE download/print
    // This prevents reprint even if the script crashes mid-job
    printedJobs.add(job.id);
    savePrintedJobs();
    console.log(`✓ Job ${job.id} locked in local history (duplicate protection active)`);
    
    // ============ DEMO MODE ============
    if (DEMO_MODE) {
      console.log(`\n🎭 DEMO MODE: Simulating print job`);
      console.log(`   Would print: ${job.pageCount} page(s) × ${copies} ${copies > 1 ? 'copies' : 'copy'}`);
      console.log(`   Color: ${job.isColor ? 'Yes' : 'No (B&W)'}`);
      console.log(`   File URL: ${job.fileUrl}`);
      console.log(`   (No actual download or printing in demo mode)`);
      
      // Simulate print delay (2 seconds per page)
      const simulatedDelay = job.pageCount * copies * 500; // 500ms per page
      console.log(`   Simulating print time: ${simulatedDelay}ms`);
      await new Promise(resolve => setTimeout(resolve, simulatedDelay));
      
      console.log(`\n✓ Demo print simulation complete!`);
      console.log(`✓ Ticket #${ticketNumber} - ${job.pageCount} page(s) × ${copies} ${copies > 1 ? 'copies' : 'copy'}`);
      
      // Mark job as printed on the SERVER with retry logic
      await markJobPrinted(job.id);
      
      console.log(`\n╔════════════════════════════════════════╗`);
      console.log(`║   TICKET #${String(ticketNumber).padEnd(16, ' ')} COMPLETE   ║`);
      console.log(`║   (Demo Mode - Simulated)            ║`);
      console.log(`╚════════════════════════════════════════╝\n`);
      
      return;
    }
    // ============ END DEMO MODE ============
    
    // Download file
    const filePath = await downloadFile(job.fileUrl, job.id);
    console.log(`✓ File downloaded: ${filePath}`);
    
    // Print file multiple times based on copies
    for (let i = 1; i <= copies; i++) {
      console.log(`\n→ Printing copy ${i} of ${copies}...`);
      await printFileOnHP(filePath, job.isColor);
      console.log(`✓ Copy ${i} sent to HP LaserJet P1108!`);
      
      // Small delay between copies
      if (i < copies) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`\n✓ All ${copies} ${copies > 1 ? 'copies' : 'copy'} printed!`);
    console.log(`✓ Ticket #${ticketNumber} - ${job.pageCount} page(s) × ${copies} ${copies > 1 ? 'copies' : 'copy'}`);
    
    // Mark job as printed on the SERVER with retry logic
    await markJobPrinted(job.id);
    
    console.log(`\n╔════════════════════════════════════════╗`);
    console.log(`║   TICKET #${String(ticketNumber).padEnd(16, ' ')} COMPLETE   ║`);
    console.log(`║   Please collect your pages!         ║`);
    console.log(`╚════════════════════════════════════════╝\n`);
    
    // Optional: Delete file after printing
    // fs.unlinkSync(filePath);
    
  } catch (error) {
    console.error(`✗ Error printing job ${job.id}:`, error.message);
    // ★ Do NOT remove from printedJobs - if download worked but print failed,
    //    manual intervention is safer than auto-reprint (avoids double billing)
    console.error(`  Job locked in local history. Remove manually if reprint needed.`);
  }
}

function downloadFile(url, jobId) {
  return new Promise((resolve, reject) => {
    const fileName = `job_${jobId}_${Date.now()}${getFileExtension(url)}`;
    const filePath = path.join(DOWNLOAD_DIR, fileName);
    const file = fs.createWriteStream(filePath);
    
    const protocol = url.startsWith('https') ? https : http;
    
    console.log(`→ Downloading file from: ${url}`);
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Download failed with status: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(filePath);
      });
      
    }).on('error', (err) => {
      fs.unlink(filePath, () => {});
      reject(err);
    });
  });
}

function getFileExtension(url) {
  const urlPath = url.split('?')[0];
  const ext = path.extname(urlPath);
  return ext || '.pdf';
}

function printFileOnHP(filePath, isColor) {
  return new Promise((resolve, reject) => {
    const platform = process.platform;
    
    if (platform === 'win32') {
      // Windows: Try multiple methods
      printOnWindows(filePath, resolve, reject);
    } else if (platform === 'darwin') {
      // macOS: Use lpr command
      const command = `lpr -P "${PRINTER_NAME}" "${filePath}"`;
      executePrintCommand(command, resolve, reject);
    } else {
      // Linux: Use lp command
      const command = `lp -d "${PRINTER_NAME}" "${filePath}"`;
      executePrintCommand(command, resolve, reject);
    }
  });
}

function printOnWindows(filePath, resolve, reject) {
  // Method 1: Try using PDFtoPrinter (most reliable for Windows)
  // Download from: https://github.com/jbmchd/PDFtoPrinter/releases
  const pdfToPrinterPath = 'C:\\PDFtoPrinter\\PDFtoPrinter.exe';
  
  if (fs.existsSync(pdfToPrinterPath)) {
    const command = `"${pdfToPrinterPath}" "${filePath}" "${PRINTER_NAME}"`;
    console.log(`→ Using PDFtoPrinter...`);
    console.log(`  Command: ${command}`);
    
    exec(command, (error, stdout, stderr) => {
      if (!error) {
        console.log(`✓ Document sent to HP LaserJet P1108 successfully!`);
        resolve();
      } else {
        console.log(`✗ PDFtoPrinter failed, trying alternative method...`);
        tryPowerShellPrint(filePath, resolve, reject);
      }
    });
    return;
  }
  
  // Method 2: Try SumatraPDF (check multiple locations)
  const sumatraPaths = [
    'C:\\Users\\Varun\\AppData\\Local\\SumatraPDF\\SumatraPDF.exe',
    'C:\\Program Files\\SumatraPDF\\SumatraPDF.exe',
    'C:\\Program Files (x86)\\SumatraPDF\\SumatraPDF.exe'
  ];
  
  for (const sumatraPath of sumatraPaths) {
    if (fs.existsSync(sumatraPath)) {
      const command = `"${sumatraPath}" -print-to "${PRINTER_NAME}" "${filePath}"`;
      console.log(`→ Using SumatraPDF at: ${sumatraPath}`);
      executePrintCommand(command, resolve, reject);
      return;
    }
  }
  
  // Method 3: Try Adobe Acrobat Reader
  const adobePaths = [
    'C:\\Program Files\\Adobe\\Acrobat DC\\Acrobat\\Acrobat.exe',
    'C:\\Program Files (x86)\\Adobe\\Acrobat Reader DC\\Reader\\AcroRd32.exe',
    'C:\\Program Files\\Adobe\\Acrobat Reader DC\\Reader\\AcroRd32.exe'
  ];
  
  for (const adobePath of adobePaths) {
    if (fs.existsSync(adobePath)) {
      const command = `"${adobePath}" /t "${filePath}" "${PRINTER_NAME}"`;
      console.log(`→ Using Adobe Reader...`);
      executePrintCommand(command, resolve, reject);
      return;
    }
  }
  
  // Method 4: Fallback to PowerShell
  tryPowerShellPrint(filePath, resolve, reject);
}

function tryPowerShellPrint(filePath, resolve, reject) {
  // Use PowerShell to print via default PDF handler
  const psScript = `
    Add-Type -AssemblyName System.Drawing
    Add-Type -AssemblyName System.Printing
    $printer = "${PRINTER_NAME}"
    $file = "${filePath.replace(/\\/g, '\\\\')}"
    
    # Try to print using shell execute
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo.FileName = $file
    $process.StartInfo.Verb = "printto"
    $process.StartInfo.Arguments = "\`"$printer\`""
    $process.StartInfo.CreateNoWindow = $true
    $process.StartInfo.WindowStyle = "Hidden"
    
    try {
      $process.Start() | Out-Null
      $process.WaitForExit(30000)
      Write-Output "Print job sent"
    } catch {
      Write-Error $_.Exception.Message
      exit 1
    }
  `;
  
  const command = `powershell -NoProfile -ExecutionPolicy Bypass -Command "${psScript.replace(/"/g, '\\"')}"`;
  
  console.log(`→ Using PowerShell print method...`);
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`\n✗ All print methods failed!`);
      console.error(`\nTo fix this, install one of these tools:`);
      console.error(`1. PDFtoPrinter (Recommended): https://github.com/jbmchd/PDFtoPrinter/releases`);
      console.error(`   Extract to C:\\PDFtoPrinter\\PDFtoPrinter.exe`);
      console.error(`\n2. SumatraPDF: https://www.sumatrapdfreader.org/download-free-pdf-viewer`);
      console.error(`\n3. Adobe Acrobat Reader: https://get.adobe.com/reader/`);
      console.error(`\nFile is ready at: ${filePath}`);
      console.error(`You can manually print it for now.\n`);
      reject(error);
    } else {
      console.log(`✓ Document sent to HP LaserJet P1108 successfully!`);
      resolve();
    }
  });
}

function executePrintCommand(command, resolve, reject) {
  console.log(`  Command: ${command}`);
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      reject(new Error(`Print command failed: ${error.message}`));
      return;
    }
    
    if (stderr) {
      console.log(`  Print stderr: ${stderr}`);
    }
    
    if (stdout) {
      console.log(`  Print stdout: ${stdout}`);
    }
    
    console.log(`✓ Document sent to HP LaserJet P1108 successfully!`);
    resolve();
  });
}

// Start polling
console.log('✓ Printer agent started!');
console.log('Polling for paid jobs...\n');

setInterval(pollJobs, POLL_INTERVAL);
pollJobs(); // Initial poll
