const express = require('express');
const router = express.Router();
const cloudinary = require('./cloudinary');
const { createJob, approveJob, getJobs, updateJobPayment, markJobAsPrinted, clearAllJobs, deleteJob, getShopStatus, setShopStatus } = require('./jobs');
const { processPayment, generateReceipt, getPayment, verifyPayment } = require('./payment');
const shopConfig = require('./shop-config');
const demoConfig = require('./demo-config');
const pdfParse = require('pdf-parse');
const axios = require('axios');

// ============ SECURITY & SHOP STATUS ROUTES ============

// Get demo mode status (public)
router.get('/demo-status', (req, res) => {
  res.json({
    demoMode: demoConfig.getDemoMode(),
    message: demoConfig.getDemoMode() 
      ? 'Demo mode active: No actual uploads or printing' 
      : 'Production mode: Full functionality enabled'
  });
});

// Get shop status (public - for customer page)
router.get('/shop-status', (req, res) => {
  const status = shopConfig.getShopStatus();
  res.json(status);
});

// Update shop status (admin only)
router.post('/shop-status', (req, res) => {
  const { isOpen } = req.body;
  
  const status = shopConfig.setShopStatus(isOpen);
  console.log('✅ Shop status updated by admin:', isOpen ? 'OPEN' : 'CLOSED');
  
  res.json({ 
    success: true, 
    status: status 
  });
});

// Admin login verification
router.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  console.log('📥 Admin login attempt received');
  console.log('   Request body:', { username, password: password ? '***' : 'empty' });
  
  if (!username || !password) {
    console.log('❌ Missing credentials');
    return res.status(400).json({ 
      success: false, 
      message: 'Username and password are required' 
    });
  }
  
  if (shopConfig.verifyAdmin(username, password)) {
    console.log('✅ Admin login successful:', username);
    res.json({ 
      success: true, 
      message: 'Login successful',
      dailyPassword: shopConfig.getDailyPassword()
    });
  } else {
    console.log('❌ Admin login failed:', username);
    res.status(401).json({ 
      success: false, 
      message: 'Invalid credentials' 
    });
  }
});

// Update password of the day (admin only)
router.post('/admin/update-password', (req, res) => {
  const { newPassword } = req.body;
  
  if (shopConfig.updateDailyPassword(newPassword)) {
    console.log('✅ Daily password updated');
    res.json({ 
      success: true, 
      message: 'Password updated successfully',
      newPassword: shopConfig.getDailyPassword()
    });
  } else {
    res.status(400).json({ 
      success: false, 
      message: 'Invalid password (minimum 4 characters)' 
    });
  }
});

// Verify customer password of the day
router.post('/verify-daily-password', (req, res) => {
  const { password } = req.body;
  
  if (shopConfig.verifyDailyPassword(password)) {
    console.log('✅ Customer password verified');
    res.json({ 
      success: true, 
      message: 'Password verified' 
    });
  } else {
    console.log('❌ Customer password incorrect');
    res.status(401).json({ 
      success: false, 
      message: 'Incorrect password' 
    });
  }
});

// ============ EXISTING ROUTES ============

// Upload document and calculate price
router.post('/upload', async (req, res) => {
  try {
    // Check if shop is open
    const shopStatus = shopConfig.getShopStatus();
    if (!shopStatus.isOpen) {
      return res.status(403).json({ 
        error: 'Shop is closed',
        message: shopStatus.message,
        isOpen: false
      });
    }
    
    const { file, samplePDF, samplePages, autoDeleteAfter = 'immediately' } = req.body;
    
    console.log('📤 Upload request received');
    
    // ============ DEMO MODE or SAMPLE PDF ============
    if (demoConfig.getDemoMode() || samplePDF) {
      console.log('🎭 DEMO MODE: Using sample PDF');
      
      // If sample PDF specified, use those details
      let pageCount = samplePages || 5;
      let pdfUrl = `/ui/${samplePDF}` || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
      let documentName = samplePDF || 'Sample Document';
      
      const job = createJob(pdfUrl, pageCount, 'pdf', autoDeleteAfter);
      
      console.log(`✅ Demo job created: ${job.id} with ${pageCount} pages (sample PDF)`);
      console.log(`   Document: ${documentName}`);
      console.log('ℹ️  No actual file uploaded to Cloudinary (Demo Mode)');
      
      return res.json({
        ...job,
        demoMode: true,
        sampleDocument: documentName,
        message: 'Demo mode: Using sample PDF'
      });
    }
    // ============ END DEMO MODE ============
    
    // Upload to Cloudinary in "PrintBridge-PaaS" folder
    const result = await cloudinary.uploader.upload(file, { 
      resource_type: "auto",
      folder: "PrintBridge-PaaS"  // Store in PrintBridge-PaaS folder
    });
    console.log('☁️ Cloudinary upload successful:', result.secure_url);
    console.log('📁 Stored in folder: PrintBridge-PaaS');
    console.log('📋 File format detected:', result.format);
    console.log('📋 Resource type:', result.resource_type);
    
    // Download PDF to count pages
    let pageCount = 1;
    let fileType = 'image';
    
    // Check if it's a PDF (check both format and resource_type)
    const isPDF = result.format === 'pdf' || 
                  result.resource_type === 'raw' || 
                  result.secure_url.toLowerCase().includes('.pdf');
    
    if (isPDF) {
      try {
        console.log('📥 Downloading PDF to count pages...');
        const response = await axios.get(result.secure_url, { 
          responseType: 'arraybuffer',
          timeout: 30000,  // 30 second timeout
          maxContentLength: 100 * 1024 * 1024  // 100MB max
        });
        
        console.log('📦 Downloaded size:', response.data.byteLength, 'bytes');
        
        const pdfBuffer = Buffer.from(response.data);
        console.log('🔍 Parsing PDF...');
        
        const pdfData = await pdfParse(pdfBuffer);
        pageCount = pdfData.numpages;
        fileType = 'pdf';
        
        console.log('✅ PDF analyzed successfully:');
        console.log('   Pages:', pageCount);
        console.log('   Info:', pdfData.info);
        
      } catch (error) {
        console.error('❌ Error counting pages:', error.message);
        console.error('   Stack:', error.stack);
        
        // Try alternative method - check PDF metadata
        try {
          console.log('🔄 Trying alternative page count method...');
          const response = await axios.get(result.secure_url, { 
            responseType: 'arraybuffer',
            timeout: 30000
          });
          const pdfBuffer = Buffer.from(response.data);
          
          // Count /Type /Page occurrences in PDF
          const pdfString = pdfBuffer.toString('binary');
          const pageMatches = pdfString.match(/\/Type\s*\/Page[^s]/g);
          if (pageMatches) {
            pageCount = pageMatches.length;
            fileType = 'pdf';
            console.log('✅ Alternative method found:', pageCount, 'pages');
          }
        } catch (altError) {
          console.error('❌ Alternative method also failed:', altError.message);
          pageCount = 1; // Default to 1 page if all methods fail
        }
      }
    } else {
      console.log('ℹ️ File is not a PDF, treating as single-page image');
    }
    
    const job = createJob(result.secure_url, pageCount, fileType, autoDeleteAfter);
    console.log('✅ Job created successfully:', job.id, 'with', pageCount, 'pages, auto-delete:', autoDeleteAfter);
    res.json(job);
  } catch (error) {
    console.error('❌ Upload error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Upload multiple images and convert to PDF
router.post('/upload-images', async (req, res) => {
  try {
    // Check if shop is open
    const shopStatus = shopConfig.getShopStatus();
    if (!shopStatus.isOpen) {
      return res.status(403).json({ 
        error: 'Shop is closed',
        message: shopStatus.message,
        isOpen: false
      });
    }
    
    const { images, imagesPerPage, autoDeleteAfter = 'immediately' } = req.body;
    
    if (!images || images.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }
    
    console.log(`📤 Image upload request: ${images.length} images, ${imagesPerPage} per page`);
    
    // ============ DEMO MODE ============
    if (demoConfig.getDemoMode()) {
      console.log('🎭 DEMO MODE: Simulating image-to-PDF conversion without Cloudinary');
      
      const pageCount = Math.ceil(images.length / parseInt(imagesPerPage));
      const demoPDF = demoConfig.getDemoPDFByPageCount(pageCount);
      const job = createJob(demoPDF.url, pageCount, 'pdf', autoDeleteAfter);
      
      console.log(`✅ Demo job created: ${job.id} with ${pageCount} pages from ${images.length} images (simulated)`);
      console.log(`   Using template: ${demoPDF.name}`);
      console.log('ℹ️  No actual files uploaded to Cloudinary (Demo Mode)');
      
      return res.json({
        ...job,
        demoMode: true,
        demoDocument: `${images.length} images → ${pageCount} pages`,
        message: 'Demo mode: Simulated image conversion'
      });
    }
    // ============ END DEMO MODE ============
    
    const fs = require('fs');
    const path = require('path');
    const { imagesToPDF } = require('./image-to-pdf');
    
    // Create temp directory
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Save images temporarily
    const imagePaths = [];
    for (let i = 0; i < images.length; i++) {
      const imageData = images[i];
      const tempPath = path.join(tempDir, `img_${Date.now()}_${i}.jpg`);
      
      // Remove data URL prefix if present
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(tempPath, base64Data, 'base64');
      imagePaths.push(tempPath);
    }
    
    console.log(`✓ Saved ${imagePaths.length} images temporarily`);
    
    // Convert images to PDF
    const pdfPath = path.join(tempDir, `images_${Date.now()}.pdf`);
    await imagesToPDF(imagePaths, parseInt(imagesPerPage) || 1, pdfPath);
    
    console.log(`✓ PDF created: ${pdfPath}`);
    
    // Upload PDF to Cloudinary
    const result = await cloudinary.uploader.upload(pdfPath, { 
      resource_type: "auto",
      folder: "PrintBridge-PaaS"
    });
    
    console.log('☁️ PDF uploaded to Cloudinary:', result.secure_url);
    
    // Calculate page count
    const pageCount = Math.ceil(images.length / parseInt(imagesPerPage));
    
    // Clean up temp files
    imagePaths.forEach(p => fs.unlinkSync(p));
    fs.unlinkSync(pdfPath);
    
    console.log(`✓ Cleaned up temporary files`);
    
    // Create job
    const job = createJob(result.secure_url, pageCount, 'pdf', autoDeleteAfter);
    console.log(`✅ Job created: ${job.id} with ${pageCount} pages (${images.length} images), auto-delete: ${autoDeleteAfter}`);
    
    res.json(job);
    
  } catch (error) {
    console.error('❌ Image upload error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Calculate price based on pages and color
router.post('/calculate-price', (req, res) => {
  const { pages, isColor, copies = 1 } = req.body;
  
  // Validate copies (1-10)
  const validCopies = Math.max(1, Math.min(10, parseInt(copies) || 1));
  
  // Pricing: ₹2 per page (B&W), ₹5 per page (Color)
  const pricePerPage = isColor ? 5.00 : 2.00;
  const subtotal = pages * pricePerPage;
  const totalPrice = (subtotal * validCopies).toFixed(2);
  
  res.json({
    pages,
    copies: validCopies,
    isColor,
    pricePerPage,
    subtotal: parseFloat(subtotal.toFixed(2)),
    totalPrice: parseFloat(totalPrice),
    currency: 'INR'
  });
});

// Process payment for a job
router.post('/payment/:id', async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);
    const { amount, customerEmail, isColor, copies } = req.body;
    
    console.log('💳 Payment request for job:', jobId, 'Amount:', amount, 'Color:', isColor, 'Copies:', copies || 1);
    
    // Simulate payment processing (always succeeds)
    const payment = await processPayment(amount, 'INR', customerEmail, isColor, copies || 1);
    
    if (payment.status === 'completed') {
      console.log('✅ Payment successful:', payment.id);
      
      // Update job with payment info
      const job = updateJobPayment(jobId, payment.id, isColor, copies || 1);
      
      if (!job) {
        console.error('❌ Job not found:', jobId);
        return res.status(404).json({ success: false, message: 'Job not found' });
      }
      
      // AUTO-APPROVE: Automatically approve the job for printing
      const approvedJob = approveJob(jobId);
      console.log('✅ Job auto-approved for printing:', jobId);
      
      // Generate receipt
      const receipt = generateReceipt(payment.id);
      
      console.log('📋 Job updated, approved, and receipt generated');
      console.log('🤖 Arduino can now detect and print this job');
      
      res.json({
        success: true,
        payment,
        receipt,
        job: approvedJob,
        autoApproved: true,
        message: 'Payment successful. Job approved for printing.'
      });
    } else {
      console.log('❌ Payment failed');
      res.status(400).json({
        success: false,
        message: 'Payment failed. Please try again.',
        payment
      });
    }
  } catch (error) {
    console.error('❌ Payment error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get receipt for a payment
router.get('/receipt/:paymentId', (req, res) => {
  const receipt = generateReceipt(req.params.paymentId);
  if (receipt) {
    res.json(receipt);
  } else {
    res.status(404).json({ message: 'Receipt not found' });
  }
});

// Verify payment (for Arduino)
router.get('/verify-payment/:paymentId', (req, res) => {
  const verification = verifyPayment(req.params.paymentId);
  res.json(verification);
});

// Approve job (admin only - after payment confirmed)
router.post('/approve/:id', (req, res) => {
  const job = approveJob(parseInt(req.params.id));
  res.json(job);
});

// Get all jobs
router.get('/jobs', (req, res) => {
  res.json(getJobs());
});

// Mark job as printed (called by printer agent)
router.post('/jobs/:id/printed', (req, res) => {
  const jobId = parseInt(req.params.id);
  const job = markJobAsPrinted(jobId);
  
  if (job) {
    console.log('✅ Job marked as printed via API:', jobId);
    res.json({ 
      success: true, 
      message: 'Job marked as printed',
      job 
    });
  } else {
    console.log('❌ Job not found:', jobId);
    res.status(404).json({ 
      success: false, 
      message: 'Job not found' 
    });
  }
});

// Clear all jobs (admin only - for cleanup)
router.delete('/jobs/clear-all', (req, res) => {
  const result = clearAllJobs();
  console.log('🗑️ All jobs cleared via API');
  res.json(result);
});

// Delete specific job (admin only)
router.delete('/jobs/:id', (req, res) => {
  const jobId = parseInt(req.params.id);
  const job = deleteJob(jobId);
  
  if (job) {
    console.log('✅ Job deleted via API:', jobId);
    res.json({ 
      success: true, 
      message: 'Job deleted',
      job 
    });
  } else {
    console.log('❌ Job not found:', jobId);
    res.status(404).json({ 
      success: false, 
      message: 'Job not found' 
    });
  }
});

module.exports = router;
