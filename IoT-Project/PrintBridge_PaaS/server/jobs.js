let jobs = [];
let ticketCounter = 1000; // Start ticket numbers from 1000
let shopStatus = {
  isOpen: true,
  closedMessage: 'Shop is currently closed. Please come back during business hours.',
  lastUpdated: new Date().toISOString()
};

function createJob(fileUrl, pageCount = 1, fileType = 'pdf', autoDeleteAfter = 'immediately') {
  const ticketNumber = ticketCounter++;
  
  const job = { 
    id: Date.now(), 
    ticketNumber: ticketNumber,  // Sequential ticket number
    fileUrl, 
    pageCount,
    fileType,
    status: 'pending',
    paymentId: null,
    paymentStatus: 'unpaid',
    isColor: false,
    copies: 1,  // Default to 1 copy
    printed: false,  // Track if job has been printed
    printedAt: null,  // Timestamp when printed
    autoDeleteAfter: autoDeleteAfter,  // Auto-delete timing
    deleteScheduledAt: null  // When deletion is scheduled
  };
  jobs.push(job);
  console.log('📄 Job created:', {
    id: job.id,
    ticketNumber: ticketNumber,
    pages: pageCount,
    type: fileType,
    status: job.status,
    copies: job.copies,
    autoDelete: autoDeleteAfter
  });
  return job;
}

function getShopStatus() {
  return shopStatus;
}

function setShopStatus(isOpen, message = null) {
  shopStatus.isOpen = isOpen;
  if (message) {
    shopStatus.closedMessage = message;
  }
  shopStatus.lastUpdated = new Date().toISOString();
  console.log(`🏪 Shop status changed to: ${isOpen ? 'OPEN' : 'CLOSED'}`);
  return shopStatus;
}

function updateJobPayment(id, paymentId, isColor = false, copies = 1) {
  const job = jobs.find(j => j.id === id);
  if (job) {
    job.paymentId = paymentId;
    job.paymentStatus = 'paid';
    job.status = 'approved'; // Auto-approve after payment
    job.isColor = isColor;
    job.copies = copies;  // Store number of copies
    console.log('✅ Job payment updated:', {
      id: job.id,
      paymentId: paymentId,
      status: 'approved',
      paymentStatus: 'paid',
      copies: copies
    });
  } else {
    console.log('❌ Job not found:', id);
  }
  return job;
}

function approveJob(id) {
  const job = jobs.find(j => j.id === id);
  if (job) {
    job.status = 'approved';
    console.log('✅ Job approved:', id);
  }
  return job;
}

function getJobs() {
  console.log('📋 Getting jobs. Total:', jobs.length);
  return jobs;
}

function markJobAsPrinted(id) {
  const job = jobs.find(j => j.id === id);
  if (job) {
    job.printed = true;
    job.printedAt = new Date().toISOString();
    console.log('🖨️ Job marked as printed:', id, 'at', job.printedAt);
    
    // Schedule auto-delete based on user preference
    scheduleAutoDelete(job);
  } else {
    console.log('❌ Job not found for printing:', id);
  }
  return job;
}

function scheduleAutoDelete(job) {
  // ALWAYS DELETE IMMEDIATELY AFTER PRINTING
  // Scheduled deletion doesn't persist across server restarts
  // and Cloudinary scheduled deletion is complex to implement
  
  console.log(`🗑️ Deleting files immediately for job ${job.id} (after printing)`);
  
  // Delete from Cloudinary and local system immediately
  deleteCloudinaryFile(job.fileUrl);
  
  // Mark when deletion was triggered
  job.deleteScheduledAt = new Date().toISOString();
}

function deleteCloudinaryFile(fileUrl) {
  const cloudinary = require('./cloudinary');
  const fs = require('fs');
  const path = require('path');
  
  try {
    // Extract public_id from Cloudinary URL
    // Format: https://res.cloudinary.com/[cloud]/[type]/upload/v[version]/[folder]/[public_id].[ext]
    const urlParts = fileUrl.split('/');
    const fileWithExt = urlParts[urlParts.length - 1];
    const fileName = fileWithExt.split('.')[0];
    const publicId = 'PrintBridge-PaaS/' + fileName;
    
    // Delete from Cloudinary
    cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }, (error, result) => {
      if (error) {
        console.error('❌ Cloudinary delete error:', error.message);
        // Try alternative resource types
        cloudinary.uploader.destroy(publicId, { resource_type: 'image' }, (err2, res2) => {
          if (!err2) {
            console.log('✅ Cloudinary file deleted (as image):', publicId, res2);
          }
        });
      } else {
        console.log('✅ Cloudinary file deleted:', publicId, result);
      }
    });
    
    // Delete from local printer-agent downloads folder
    const downloadsPath = path.join(__dirname, '../printer-agent/downloads');
    if (fs.existsSync(downloadsPath)) {
      const files = fs.readdirSync(downloadsPath);
      
      // Find and delete matching files (may have different extensions)
      files.forEach(file => {
        if (file.includes(fileName)) {
          const filePath = path.join(downloadsPath, file);
          try {
            fs.unlinkSync(filePath);
            console.log('✅ Local file deleted:', file);
          } catch (err) {
            console.error('❌ Error deleting local file:', err.message);
          }
        }
      });
    }
    
    // Delete from temp folder if exists
    const tempPath = path.join(__dirname, '../temp');
    if (fs.existsSync(tempPath)) {
      const tempFiles = fs.readdirSync(tempPath);
      tempFiles.forEach(file => {
        if (file.includes(fileName)) {
          const filePath = path.join(tempPath, file);
          try {
            fs.unlinkSync(filePath);
            console.log('✅ Temp file deleted:', file);
          } catch (err) {
            console.error('❌ Error deleting temp file:', err.message);
          }
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error deleting files:', error.message);
  }
}

function clearAllJobs() {
  const count = jobs.length;
  jobs = [];
  console.log('🗑️ Cleared all jobs. Deleted:', count);
  return { success: true, deletedCount: count };
}

function deleteJob(id) {
  const index = jobs.findIndex(j => j.id === id);
  if (index !== -1) {
    const job = jobs.splice(index, 1)[0];
    console.log('🗑️ Job deleted:', id);
    return job;
  }
  console.log('❌ Job not found for deletion:', id);
  return null;
}

module.exports = { createJob, approveJob, getJobs, updateJobPayment, markJobAsPrinted, clearAllJobs, deleteJob, getShopStatus, setShopStatus };
