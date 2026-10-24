let currentJobId = null;
let currentTicketNumber = null;
let currentPageCount = 0;
let currentPrice = 0;
let currentCopies = 1; // Default to 1 copy
let currentUploadType = 'pdf'; // 'pdf' or 'images'
let selectedImages = [];
let imagesPerPage = 1;
let selectedSamplePDF = null; // Track selected sample PDF

// Check shop status on page load
window.addEventListener('DOMContentLoaded', checkShopStatus);

// Function to select sample PDF (for demo mode)
async function selectSamplePDF(filename, pages) {
  selectedSamplePDF = { filename, pages };
  
  showStatus('uploadStatus', `✓ Selected: ${filename} (${pages} pages)`, 'success');
  
  // Automatically proceed to create job
  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        samplePDF: filename,
        samplePages: pages,
        autoDeleteAfter: 'immediately'
      })
    });
    
    const job = await response.json();
    currentJobId = job.id;
    currentTicketNumber = job.ticketNumber;
    currentPageCount = job.pageCount || pages;
    currentCopies = 1;
    
    console.log('Sample PDF job created:', job);
    
    showStatus('uploadStatus', `✓ ${filename} selected! Ticket #${currentTicketNumber} | ${currentPageCount} pages`, 'success');
    
    // Move to next step
    document.getElementById('step1').classList.add('hidden');
    document.getElementById('step2').classList.remove('hidden');
    
    calculatePrice();
    
  } catch (error) {
    console.error('Sample PDF selection error:', error);
    showStatus('uploadStatus', 'Error selecting sample PDF. Please try again.', 'error');
  }
}

function switchUploadType(type) {
  currentUploadType = type;
  
  if (type === 'pdf') {
    document.getElementById('pdfUploadSection').classList.remove('hidden');
    document.getElementById('imageUploadSection').classList.add('hidden');
  } else {
    document.getElementById('pdfUploadSection').classList.add('hidden');
    document.getElementById('imageUploadSection').classList.remove('hidden');
  }
}

function selectUploadType(type) {
  // Update radio button
  const radio = document.querySelector(`input[name="uploadType"][value="${type}"]`);
  if (radio) {
    radio.checked = true;
  }
  
  // Update visual selection - find the correct option group (first one)
  const uploadTypeOptions = document.querySelectorAll('#step1 .option-group')[0];
  if (uploadTypeOptions) {
    uploadTypeOptions.querySelectorAll('.option').forEach(opt => {
      opt.classList.remove('selected');
      const optRadio = opt.querySelector('input[type="radio"]');
      if (optRadio && optRadio.value === type) {
        opt.classList.add('selected');
      }
    });
  }
  
  switchUploadType(type);
}

function selectImagesPerPage(count) {
  imagesPerPage = count;
  
  // Update radio button
  const radio = document.querySelector(`input[name="imagesPerPage"][value="${count}"]`);
  if (radio) {
    radio.checked = true;
  }
  
  // Update visual selection
  document.querySelectorAll('input[name="imagesPerPage"]').forEach(radio => {
    const parent = radio.parentElement;
    parent.classList.remove('selected');
    if (parseInt(radio.value) === count) {
      parent.classList.add('selected');
    }
  });
}

// Preview selected images
document.addEventListener('DOMContentLoaded', () => {
  const imageInput = document.getElementById('imageInput');
  if (imageInput) {
    imageInput.addEventListener('change', (e) => {
      selectedImages = Array.from(e.target.files);
      displayImagePreview();
    });
  }
});

function displayImagePreview() {
  const preview = document.getElementById('imagePreview');
  
  if (selectedImages.length === 0) {
    preview.innerHTML = '';
    return;
  }
  
  preview.innerHTML = `
    <div style="
      padding: 16px;
      background: var(--cream);
      border-radius: 8px;
      border: 1px solid var(--rule);
    ">
      <div style="
        font-family: 'Playfair Display', serif;
        font-size: 14px;
        font-weight: 600;
        color: var(--navy);
        margin-bottom: 12px;
      ">${selectedImages.length} image(s) selected</div>
      <div style="
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
        gap: 8px;
      ">
        ${selectedImages.map((img, index) => `
          <div style="
            position: relative;
            aspect-ratio: 1;
            background: white;
            border-radius: 4px;
            overflow: hidden;
            border: 1px solid var(--rule);
          ">
            <img src="${URL.createObjectURL(img)}" style="
              width: 100%;
              height: 100%;
              object-fit: cover;
            ">
            <div style="
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              background: rgba(0,0,0,0.7);
              color: white;
              font-size: 10px;
              padding: 2px 4px;
              text-align: center;
            ">${index + 1}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

async function checkShopStatus() {
  try {
    const response = await fetch('/api/shop-status');
    const status = await response.json();
    
    if (!status.isOpen) {
      // Shop is closed - disable upload and show message
      document.getElementById('fileInput').disabled = true;
      document.querySelector('button[onclick="uploadFile()"]').disabled = true;
      
      showStatus('uploadStatus', `🔒 ${status.closedMessage}`, 'error');
      
      // Show prominent closed message
      const step1 = document.getElementById('step1');
      const closedBanner = document.createElement('div');
      closedBanner.style.cssText = `
        background: #fef2f2;
        border: 2px solid #dc2626;
        padding: 20px;
        margin-bottom: 24px;
        text-align: center;
      `;
      closedBanner.innerHTML = `
        <div style="font-size: 24px; margin-bottom: 8px;">🔒</div>
        <div style="font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 600; color: #dc2626; margin-bottom: 8px;">
          Shop Closed
        </div>
        <div style="font-size: 14px; color: var(--ink-soft);">
          ${status.closedMessage}
        </div>
      `;
      step1.insertBefore(closedBanner, step1.firstChild.nextSibling);
    }
  } catch (error) {
    console.error('Error checking shop status:', error);
  }
}

async function uploadFile() {
  if (currentUploadType === 'pdf') {
    await uploadPDF();
  } else {
    await uploadImages();
  }
}

async function uploadPDF() {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];
  
  if (!file) {
    showStatus('uploadStatus', 'Please select a PDF file', 'error');
    return;
  }
  
  showStatus('uploadStatus', 'Uploading PDF to cloud...', 'info');
  
  try {
    // Convert file to base64
    const base64 = await fileToBase64(file);
    
    // Get auto-delete timing
    const autoDeleteAfter = getAutoDeleteTiming();
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        file: base64,
        autoDeleteAfter: autoDeleteAfter
      })
    });
    
    const job = await response.json();
    currentJobId = job.id;
    currentTicketNumber = job.ticketNumber;
    currentPageCount = job.pageCount || job.pages || 1;
    currentCopies = 1; // Reset copies to 1
    
    console.log('Job received:', job);
    
    showStatus('uploadStatus', `✓ PDF uploaded! Ticket #${currentTicketNumber} | ${currentPageCount} pages`, 'success');
    
    document.getElementById('step1').classList.add('hidden');
    document.getElementById('step2').classList.remove('hidden');
    
    calculatePrice();
    
  } catch (error) {
    console.error('Upload error:', error);
    showStatus('uploadStatus', 'Upload failed. Please try again.', 'error');
  }
}

async function uploadImages() {
  const imageInput = document.getElementById('imageInput');
  const files = imageInput.files;
  
  if (files.length === 0) {
    showStatus('uploadStatus', 'Please select at least one image', 'error');
    return;
  }
  
  showStatus('uploadStatus', `Uploading ${files.length} image(s) to cloud...`, 'info');
  
  try {
    // Convert images to base64
    const imagePromises = Array.from(files).map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });
    
    const images = await Promise.all(imagePromises);
    
    console.log(`Converted ${images.length} images to base64`);
    
    // Get auto-delete timing
    const autoDeleteAfter = getAutoDeleteTiming();
    
    // Send to server
    const response = await fetch('/api/upload-images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        images: images,
        imagesPerPage: imagesPerPage,
        autoDeleteAfter: autoDeleteAfter
      })
    });
    
    const job = await response.json();
    currentJobId = job.id;
    currentTicketNumber = job.ticketNumber;
    currentPageCount = job.pageCount || 1;
    currentCopies = 1; // Reset copies to 1
    
    console.log('Job received:', job);
    
    showStatus('uploadStatus', `✓ Images uploaded! Ticket #${currentTicketNumber} | ${files.length} images → ${currentPageCount} pages`, 'success');
    
    document.getElementById('step1').classList.add('hidden');
    document.getElementById('step2').classList.remove('hidden');
    
    calculatePrice();
    
  } catch (error) {
    console.error('Upload error:', error);
    showStatus('uploadStatus', 'Upload failed. Please try again.', 'error');
  }
}

async function calculatePrice() {
  const isColor = document.querySelector('input[name="colorOption"]:checked').value === 'color';
  const copiesInput = document.getElementById('copiesInput');
  const copies = copiesInput?.value ? parseInt(copiesInput.value) : 1;
  
  // If copies input is empty, set default display but don't fill the input
  if (!copiesInput?.value) {
    document.getElementById('displayCopies').textContent = '1 (default)';
  }
  
  currentCopies = copies;
  
  try {
    const response = await fetch('/api/calculate-price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        pages: currentPageCount, 
        isColor: isColor,
        copies: copies
      })
    });

    const pricing = await response.json();
    currentPrice = pricing.totalPrice;
    
    // Update display
    document.getElementById('displayPages').textContent = currentPageCount;
    
    // Update copies display
    if (copiesInput?.value) {
      document.getElementById('displayCopies').textContent = copies;
    } else {
      document.getElementById('displayCopies').textContent = '1 (default)';
    }
    
    document.getElementById('displayPricePerPage').textContent = `₹${pricing.pricePerPage}`;
    document.getElementById('displaySubtotal').textContent = `₹${(currentPageCount * pricing.pricePerPage).toFixed(2)}`;
    document.getElementById('displayTotal').textContent = `₹${pricing.totalPrice}`;

  } catch (error) {
    console.error('Price calculation error:', error);
  }
}

async function processPayment() {
  // ✅ VERIFY PASSWORD OF THE DAY FIRST
  const passwordVerified = await verifyDailyPassword();
  
  if (!passwordVerified) {
    showStatus('paymentStatus', 'Payment cancelled. Password verification required.', 'error');
    return;
  }
  
  const email = document.getElementById('emailInput').value;
  const isColor = document.querySelector('input[name="colorOption"]:checked').value === 'color';
  
  // Validate email
  if (!email) {
    showStatus('paymentStatus', 'Please enter your email', 'error');
    return;
  }
  
  // Check if email ends with @nie.ac.in
  if (!email.toLowerCase().endsWith('@nie.ac.in')) {
    showStatus('paymentStatus', '⚠️ Only NIE email addresses (@nie.ac.in) are allowed', 'error');
    alert('Please use your NIE email address (example@nie.ac.in)');
    return;
  }
  
  // Get copies value directly from input
  const copiesInput = document.getElementById('copiesInput');
  const copies = copiesInput?.value ? parseInt(copiesInput.value) : 1;
  
  // Update currentCopies
  currentCopies = copies;
  
  console.log('Processing payment with copies:', currentCopies);
  
  // Validate copies
  if (copies < 1 || copies > 10) {
    alert('⚠️ Please enter a valid number of copies (1-10)');
    copiesInput.focus();
    return;
  }

  // Show payment gateway modal
  showPaymentGatewayModal(email, isColor);
}

function showPaymentGatewayModal(email, isColor) {
  // Create modal overlay
  const modal = document.createElement('div');
  modal.id = 'paymentModal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease;
  `;

  modal.innerHTML = `
    <div style="
      background: var(--paper);
      border: 2px solid var(--rule);
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
      animation: slideUp 0.3s ease;
    ">
      <!-- Header -->
      <div style="
        background: var(--cream);
        padding: 20px;
        border-bottom: 1px solid var(--rule);
        position: sticky;
        top: 0;
        z-index: 10;
      ">
        <div style="
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--saffron);
          margin-bottom: 8px;
        ">PrintBridge-PaaS Payment Gateway</div>
        <div style="
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          font-weight: 700;
          color: var(--navy);
        ">Complete Payment</div>
        <button onclick="closePaymentModal()" style="
          position: absolute;
          top: 20px;
          right: 20px;
          background: none;
          border: none;
          font-size: 24px;
          color: var(--ink-muted);
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          line-height: 1;
        ">×</button>
      </div>

      <!-- Amount Section -->
      <div style="padding: 24px; border-bottom: 1px solid var(--rule);">
        <div style="text-align: center;">
          <div style="
            font-size: 14px;
            color: var(--ink-soft);
            margin-bottom: 8px;
          ">Amount to Pay</div>
          <div style="
            font-family: 'Playfair Display', serif;
            font-size: 36px;
            font-weight: 700;
            color: var(--navy);
          ">₹${currentPrice}</div>
          <div style="
            font-size: 12px;
            color: var(--ink-muted);
            margin-top: 8px;
          ">${currentPageCount} pages × ${currentCopies} ${currentCopies > 1 ? 'copies' : 'copy'} • ${isColor ? 'Color' : 'Black & White'}</div>
        </div>
      </div>

      <!-- Payment Methods -->
      <div id="paymentContent" style="padding: 24px;">
        <div style="
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--ink-soft);
          margin-bottom: 16px;
        ">Select Payment Method</div>

        <!-- UPI Option -->
        <div class="payment-method" onclick="selectPaymentMethod('upi')" style="
          border: 2px solid var(--rule);
          padding: 16px;
          margin-bottom: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: space-between;
        " onmouseover="this.style.borderColor='var(--navy)'" onmouseout="this.style.borderColor='var(--rule)'">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="
              width: 40px;
              height: 40px;
              background: var(--cream);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 20px;
            ">📱</div>
            <div>
              <div style="
                font-family: 'Source Serif 4', serif;
                font-size: 16px;
                font-weight: 600;
                color: var(--navy);
              ">UPI</div>
              <div style="
                font-size: 12px;
                color: var(--ink-muted);
              ">PhonePe, Google Pay, Paytm & more</div>
            </div>
          </div>
          <div style="font-size: 20px; color: var(--ink-muted);">›</div>
        </div>

        <!-- Card Option -->
        <div class="payment-method" onclick="selectPaymentMethod('card')" style="
          border: 2px solid var(--rule);
          padding: 16px;
          margin-bottom: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: space-between;
        " onmouseover="this.style.borderColor='var(--navy)'" onmouseout="this.style.borderColor='var(--rule)'">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="
              width: 40px;
              height: 40px;
              background: var(--cream);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 20px;
            ">💳</div>
            <div>
              <div style="
                font-family: 'Source Serif 4', serif;
                font-size: 16px;
                font-weight: 600;
                color: var(--navy);
              ">Debit / Credit Card</div>
              <div style="
                font-size: 12px;
                color: var(--ink-muted);
              ">Visa, Mastercard, RuPay</div>
            </div>
          </div>
          <div style="font-size: 20px; color: var(--ink-muted);">›</div>
        </div>

        <!-- Net Banking Option -->
        <div class="payment-method" onclick="selectPaymentMethod('netbanking')" style="
          border: 2px solid var(--rule);
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: space-between;
        " onmouseover="this.style.borderColor='var(--navy)'" onmouseout="this.style.borderColor='var(--rule)'">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="
              width: 40px;
              height: 40px;
              background: var(--cream);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 20px;
            ">🏦</div>
            <div>
              <div style="
                font-family: 'Source Serif 4', serif;
                font-size: 16px;
                font-weight: 600;
                color: var(--navy);
              ">Net Banking</div>
              <div style="
                font-size: 12px;
                color: var(--ink-muted);
              ">All major banks supported</div>
            </div>
          </div>
          <div style="font-size: 20px; color: var(--ink-muted);">›</div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Add animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { transform: translateY(50px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  // Store email and color for later use
  window.paymentEmail = email;
  window.paymentIsColor = isColor;
}

function closePaymentModal() {
  const modal = document.getElementById('paymentModal');
  if (modal) {
    document.body.removeChild(modal);
    showStatus('paymentStatus', 'Payment cancelled', 'error');
  }
}

function selectPaymentMethod(method) {
  const paymentContent = document.getElementById('paymentContent');
  
  if (method === 'upi') {
    showUPIForm(paymentContent);
  } else if (method === 'card') {
    showCardForm(paymentContent);
  } else if (method === 'netbanking') {
    showNetBankingForm(paymentContent);
  }
}

function showUPIForm(container) {
  container.innerHTML = `
    <button onclick="showPaymentMethods()" style="
      background: none;
      border: none;
      color: var(--ink-soft);
      font-size: 14px;
      cursor: pointer;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
    ">‹ Back to payment methods</button>

    <div style="
      font-family: 'Playfair Display', serif;
      font-size: 20px;
      font-weight: 700;
      color: var(--navy);
      margin-bottom: 20px;
    ">Pay via UPI</div>

    <div style="
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: var(--ink-soft);
      margin-bottom: 12px;
    ">Select UPI App</div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
      <div onclick="selectUPIApp('PhonePe')" style="
        border: 2px solid var(--rule);
        padding: 16px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s ease;
      " onmouseover="this.style.borderColor='var(--navy)'" onmouseout="this.style.borderColor='var(--rule)'">
        <div style="font-size: 32px; margin-bottom: 8px;">📱</div>
        <div style="font-size: 13px; font-weight: 600; color: var(--navy);">PhonePe</div>
      </div>
      <div onclick="selectUPIApp('Google Pay')" style="
        border: 2px solid var(--rule);
        padding: 16px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s ease;
      " onmouseover="this.style.borderColor='var(--navy)'" onmouseout="this.style.borderColor='var(--rule)'">
        <div style="font-size: 32px; margin-bottom: 8px;">🔵</div>
        <div style="font-size: 13px; font-weight: 600; color: var(--navy);">Google Pay</div>
      </div>
      <div onclick="selectUPIApp('Paytm')" style="
        border: 2px solid var(--rule);
        padding: 16px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s ease;
      " onmouseover="this.style.borderColor='var(--navy)'" onmouseout="this.style.borderColor='var(--rule)'">
        <div style="font-size: 32px; margin-bottom: 8px;">💙</div>
        <div style="font-size: 13px; font-weight: 600; color: var(--navy);">Paytm</div>
      </div>
      <div onclick="selectUPIApp('BHIM')" style="
        border: 2px solid var(--rule);
        padding: 16px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s ease;
      " onmouseover="this.style.borderColor='var(--navy)'" onmouseout="this.style.borderColor='var(--rule)'">
        <div style="font-size: 32px; margin-bottom: 8px;">🇮🇳</div>
        <div style="font-size: 13px; font-weight: 600; color: var(--navy);">BHIM</div>
      </div>
    </div>

    <div style="
      background: var(--cream);
      border: 1px solid var(--rule);
      padding: 16px;
      text-align: center;
      font-size: 12px;
      color: var(--ink-muted);
    ">
      <div style="margin-bottom: 8px;">Or pay using any UPI app</div>
      <div style="
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px;
        font-weight: 600;
        color: var(--navy);
      ">PrintBridge-PaaS@upi</div>
    </div>
  `;
}

function selectUPIApp(appName) {
  const paymentContent = document.getElementById('paymentContent');
  
  paymentContent.innerHTML = `
    <button onclick="showUPIForm(document.getElementById('paymentContent'))" style="
      background: none;
      border: none;
      color: var(--ink-soft);
      font-size: 14px;
      cursor: pointer;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
    ">‹ Back</button>

    <div style="
      font-family: 'Playfair Display', serif;
      font-size: 20px;
      font-weight: 700;
      color: var(--navy);
      margin-bottom: 8px;
    ">${appName} Payment</div>
    <div style="
      font-size: 13px;
      color: var(--ink-muted);
      margin-bottom: 24px;
    ">Enter your UPI PIN to complete payment</div>

    <div style="margin-bottom: 20px;">
      <label style="
        display: block;
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 1px;
        text-transform: uppercase;
        color: var(--ink-soft);
        margin-bottom: 8px;
      ">UPI PIN (6 digits)</label>
      <input type="password" id="upiPin" maxlength="6" placeholder="••••••" style="
        width: 100%;
        padding: 14px;
        border: 2px solid var(--rule);
        font-family: 'JetBrains Mono', monospace;
        font-size: 18px;
        letter-spacing: 8px;
        text-align: center;
        background: var(--paper);
        color: var(--navy);
      " oninput="this.value = this.value.replace(/[^0-9]/g, '')">
      <div style="
        font-size: 11px;
        color: var(--ink-muted);
        margin-top: 8px;
      ">Your PIN is encrypted and secure</div>
    </div>

    <button onclick="processUPIPayment('${appName}')" style="
      width: 100%;
      padding: 16px;
      background: var(--navy);
      color: var(--paper);
      border: none;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      cursor: pointer;
      transition: all 0.2s ease;
    " onmouseover="this.style.background='var(--ink)'" onmouseout="this.style.background='var(--navy)'">
      Pay ₹${currentPrice}
    </button>
  `;
  
  // Focus on PIN input
  setTimeout(() => document.getElementById('upiPin').focus(), 100);
}

function processUPIPayment(appName) {
  const pin = document.getElementById('upiPin').value;
  
  if (pin.length !== 6) {
    alert('Please enter a valid 6-digit UPI PIN');
    return;
  }
  
  verifyAndProcessPayment(window.paymentEmail, window.paymentIsColor, 'UPI', appName);
}

function showCardForm(container) {
  container.innerHTML = `
    <button onclick="showPaymentMethods()" style="
      background: none;
      border: none;
      color: var(--ink-soft);
      font-size: 14px;
      cursor: pointer;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
    ">‹ Back to payment methods</button>

    <div style="
      font-family: 'Playfair Display', serif;
      font-size: 20px;
      font-weight: 700;
      color: var(--navy);
      margin-bottom: 20px;
    ">Card Payment</div>

    <div style="margin-bottom: 16px;">
      <label style="
        display: block;
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 1px;
        text-transform: uppercase;
        color: var(--ink-soft);
        margin-bottom: 8px;
      ">Card Number</label>
      <input type="text" id="cardNumber" maxlength="19" placeholder="1234 5678 9012 3456" style="
        width: 100%;
        padding: 14px;
        border: 2px solid var(--rule);
        font-family: 'JetBrains Mono', monospace;
        font-size: 16px;
        letter-spacing: 2px;
        background: var(--paper);
        color: var(--navy);
      " oninput="formatCardNumber(this)">
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
      <div>
        <label style="
          display: block;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--ink-soft);
          margin-bottom: 8px;
        ">Expiry (MM/YY)</label>
        <input type="text" id="cardExpiry" maxlength="5" placeholder="12/25" style="
          width: 100%;
          padding: 14px;
          border: 2px solid var(--rule);
          font-family: 'JetBrains Mono', monospace;
          font-size: 16px;
          background: var(--paper);
          color: var(--navy);
        " oninput="formatExpiry(this)">
      </div>
      <div>
        <label style="
          display: block;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--ink-soft);
          margin-bottom: 8px;
        ">CVV</label>
        <input type="password" id="cardCVV" maxlength="3" placeholder="•••" style="
          width: 100%;
          padding: 14px;
          border: 2px solid var(--rule);
          font-family: 'JetBrains Mono', monospace;
          font-size: 16px;
          letter-spacing: 4px;
          text-align: center;
          background: var(--paper);
          color: var(--navy);
        " oninput="this.value = this.value.replace(/[^0-9]/g, '')">
      </div>
    </div>

    <div style="margin-bottom: 20px;">
      <label style="
        display: block;
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 1px;
        text-transform: uppercase;
        color: var(--ink-soft);
        margin-bottom: 8px;
      ">Cardholder Name</label>
      <input type="text" id="cardName" placeholder="JOHN DOE" style="
        width: 100%;
        padding: 14px;
        border: 2px solid var(--rule);
        font-family: 'Source Serif 4', serif;
        font-size: 16px;
        background: var(--paper);
        color: var(--navy);
        text-transform: uppercase;
      ">
    </div>

    <button onclick="processCardPayment()" style="
      width: 100%;
      padding: 16px;
      background: var(--navy);
      color: var(--paper);
      border: none;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      cursor: pointer;
      transition: all 0.2s ease;
    " onmouseover="this.style.background='var(--ink)'" onmouseout="this.style.background='var(--navy)'">
      Pay ₹${currentPrice}
    </button>

    <div style="
      text-align: center;
      margin-top: 16px;
      font-size: 11px;
      color: var(--ink-muted);
    ">🔒 Secure payment processing</div>
  `;
}

function formatCardNumber(input) {
  let value = input.value.replace(/\s/g, '').replace(/[^0-9]/g, '');
  let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
  input.value = formattedValue;
}

function formatExpiry(input) {
  let value = input.value.replace(/\D/g, '');
  if (value.length >= 2) {
    value = value.slice(0, 2) + '/' + value.slice(2, 4);
  }
  input.value = value;
}

function processCardPayment() {
  const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
  const expiry = document.getElementById('cardExpiry').value;
  const cvv = document.getElementById('cardCVV').value;
  const name = document.getElementById('cardName').value;
  
  if (cardNumber.length < 13 || cardNumber.length > 19) {
    alert('Please enter a valid card number');
    return;
  }
  
  if (!/^\d{2}\/\d{2}$/.test(expiry)) {
    alert('Please enter expiry in MM/YY format');
    return;
  }
  
  if (cvv.length !== 3) {
    alert('Please enter a valid 3-digit CVV');
    return;
  }
  
  if (!name.trim()) {
    alert('Please enter cardholder name');
    return;
  }
  
  verifyAndProcessPayment(window.paymentEmail, window.paymentIsColor, 'Card', `****${cardNumber.slice(-4)}`);
}

function showNetBankingForm(container) {
  container.innerHTML = `
    <button onclick="showPaymentMethods()" style="
      background: none;
      border: none;
      color: var(--ink-soft);
      font-size: 14px;
      cursor: pointer;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
    ">‹ Back to payment methods</button>

    <div style="
      font-family: 'Playfair Display', serif;
      font-size: 20px;
      font-weight: 700;
      color: var(--navy);
      margin-bottom: 20px;
    ">Net Banking</div>

    <div style="
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: var(--ink-soft);
      margin-bottom: 12px;
    ">Select Your Bank</div>

    <div style="display: grid; gap: 12px; margin-bottom: 24px;">
      ${['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank', 'Punjab National Bank'].map(bank => `
        <div onclick="selectBank('${bank}')" style="
          border: 2px solid var(--rule);
          padding: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: space-between;
        " onmouseover="this.style.borderColor='var(--navy)'" onmouseout="this.style.borderColor='var(--rule)'">
          <div style="
            font-size: 14px;
            font-weight: 600;
            color: var(--navy);
          ">${bank}</div>
          <div style="font-size: 16px; color: var(--ink-muted);">›</div>
        </div>
      `).join('')}
    </div>
  `;
}

function selectBank(bankName) {
  verifyAndProcessPayment(window.paymentEmail, window.paymentIsColor, 'Net Banking', bankName);
}

function showPaymentMethods() {
  const paymentContent = document.getElementById('paymentContent');
  paymentContent.innerHTML = `
    <div style="
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: var(--ink-soft);
      margin-bottom: 16px;
    ">Select Payment Method</div>

    <!-- UPI Option -->
    <div class="payment-method" onclick="selectPaymentMethod('upi')" style="
      border: 2px solid var(--rule);
      padding: 16px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: space-between;
    " onmouseover="this.style.borderColor='var(--navy)'" onmouseout="this.style.borderColor='var(--rule)'">
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="
          width: 40px;
          height: 40px;
          background: var(--cream);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        ">📱</div>
        <div>
          <div style="
            font-family: 'Source Serif 4', serif;
            font-size: 16px;
            font-weight: 600;
            color: var(--navy);
          ">UPI</div>
          <div style="
            font-size: 12px;
            color: var(--ink-muted);
          ">PhonePe, Google Pay, Paytm & more</div>
        </div>
      </div>
      <div style="font-size: 20px; color: var(--ink-muted);">›</div>
    </div>

    <!-- Card Option -->
    <div class="payment-method" onclick="selectPaymentMethod('card')" style="
      border: 2px solid var(--rule);
      padding: 16px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: space-between;
    " onmouseover="this.style.borderColor='var(--navy)'" onmouseout="this.style.borderColor='var(--rule)'">
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="
          width: 40px;
          height: 40px;
          background: var(--cream);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        ">💳</div>
        <div>
          <div style="
            font-family: 'Source Serif 4', serif;
            font-size: 16px;
            font-weight: 600;
            color: var(--navy);
          ">Debit / Credit Card</div>
          <div style="
            font-size: 12px;
            color: var(--ink-muted);
          ">Visa, Mastercard, RuPay</div>
        </div>
      </div>
      <div style="font-size: 20px; color: var(--ink-muted);">›</div>
    </div>

    <!-- Net Banking Option -->
    <div class="payment-method" onclick="selectPaymentMethod('netbanking')" style="
      border: 2px solid var(--rule);
      padding: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: space-between;
    " onmouseover="this.style.borderColor='var(--navy)'" onmouseout="this.style.borderColor='var(--rule)'">
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="
          width: 40px;
          height: 40px;
          background: var(--cream);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        ">🏦</div>
        <div>
          <div style="
            font-family: 'Source Serif 4', serif;
            font-size: 16px;
            font-weight: 600;
            color: var(--navy);
          ">Net Banking</div>
          <div style="
            font-size: 12px;
            color: var(--ink-muted);
          ">All major banks supported</div>
        </div>
      </div>
      <div style="font-size: 20px; color: var(--ink-muted);">›</div>
    </div>
  `;
}

async function verifyAndProcessPayment(email, isColor, paymentMethod = 'UPI', paymentDetails = '') {
  const paymentContent = document.getElementById('paymentContent');
  
  // Show verification screen
  paymentContent.innerHTML = `
    <div style="text-align: center; padding: 40px 20px;">
      <div style="
        width: 60px;
        height: 60px;
        border: 3px solid var(--cream);
        border-top-color: var(--saffron);
        border-radius: 50%;
        margin: 0 auto 20px;
        animation: spin 1s linear infinite;
      "></div>
      <div style="
        font-family: 'Playfair Display', serif;
        font-size: 18px;
        font-weight: 600;
        color: var(--navy);
        margin-bottom: 8px;
      ">Processing Payment</div>
      <div style="
        font-size: 13px;
        color: var(--ink-soft);
        margin-bottom: 4px;
      ">Please wait while we verify your payment...</div>
      <div style="
        font-size: 12px;
        color: var(--ink-muted);
      ">${paymentMethod}${paymentDetails ? ` • ${paymentDetails}` : ''}</div>
    </div>
  `;

  try {
    // Simulate payment verification delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Sending payment with copies:', currentCopies);

    const response = await fetch(`/api/payment/${currentJobId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        amount: currentPrice, 
        customerEmail: email,
        isColor: isColor,
        copies: currentCopies  // Send copies to server
      })
    });

    console.log('Payment request sent with copies:', currentCopies);

    const result = await response.json();

    if (result.success) {
      // Show success screen
      paymentContent.innerHTML = `
        <div style="text-align: center; padding: 20px 0;">
          <div style="
            width: 80px;
            height: 80px;
            background: var(--green);
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            color: white;
          ">✓</div>
          <div style="
            font-family: 'Playfair Display', serif;
            font-size: 22px;
            font-weight: 700;
            color: var(--green);
            margin-bottom: 12px;
          ">Payment Successful</div>
          <div style="
            font-size: 13px;
            color: var(--ink-soft);
            margin-bottom: 4px;
          ">Payment Method: ${paymentMethod}</div>
          <div style="
            font-size: 14px;
            color: var(--ink-soft);
            margin-bottom: 8px;
          ">Transaction ID: ${result.payment.transactionId}</div>
          <div style="
            font-size: 14px;
            color: var(--ink-soft);
            margin-bottom: 20px;
          ">Amount: ₹${result.payment.amount}</div>
          <div style="
            background: #f0fdf4;
            border: 1px solid var(--green);
            padding: 12px;
            font-size: 13px;
            color: var(--green);
            margin-bottom: 20px;
          ">
            Your document has been queued for printing
          </div>
          <button onclick="closePaymentModalSuccess()" style="
            width: 100%;
            padding: 14px;
            background: var(--green);
            color: white;
            border: none;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 1px;
            text-transform: uppercase;
            cursor: pointer;
          ">View Receipt</button>
        </div>
      `;

      // Store receipt data
      window.receiptData = result.receipt;
      window.isColorPrint = isColor;

    } else {
      throw new Error('Payment verification failed');
    }

  } catch (error) {
    // Show error screen
    paymentContent.innerHTML = `
      <div style="text-align: center; padding: 20px 0;">
        <div style="
          width: 80px;
          height: 80px;
          background: #dc2626;
          border-radius: 50%;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          color: white;
        ">✗</div>
        <div style="
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          font-weight: 700;
          color: #dc2626;
          margin-bottom: 12px;
        ">Payment Failed</div>
        <div style="
          font-size: 14px;
          color: var(--ink-soft);
          margin-bottom: 20px;
        ">${error.message}</div>
        <button onclick="showPaymentMethods()" style="
          width: 100%;
          padding: 14px;
          background: var(--navy);
          color: white;
          border: none;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          cursor: pointer;
        ">Try Again</button>
      </div>
    `;
  }
}

function closePaymentModalSuccess() {
  const modal = document.getElementById('paymentModal');
  if (modal) {
    document.body.removeChild(modal);
    
    // Show receipt if payment was successful
    if (window.receiptData) {
      displayReceipt(window.receiptData, window.isColorPrint);
      document.getElementById('step3').classList.remove('hidden');
      document.getElementById('step3').scrollIntoView({ behavior: 'smooth' });
      showStatus('paymentStatus', '✓ Payment successful!', 'success');
      
      // Show estimated time section and start updating
      showEstimatedTime();
    }
  }
}

function closeUPIModal() {
  closePaymentModalSuccess();
}

function displayReceipt(receipt, isColor) {
  const container = document.getElementById('receiptContainer');
  container.innerHTML = `
    <div style="
      background: var(--cream);
      border: 2px solid var(--navy);
      padding: 24px;
      margin-bottom: 20px;
      text-align: center;
    ">
      <div style="
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 1px;
        text-transform: uppercase;
        color: var(--ink-soft);
        margin-bottom: 8px;
      ">Your Ticket Number</div>
      <div style="
        font-family: 'Playfair Display', serif;
        font-size: 48px;
        font-weight: 700;
        color: var(--navy);
        letter-spacing: 2px;
      ">#${currentTicketNumber}</div>
      <div style="
        font-size: 13px;
        color: var(--ink-soft);
        margin-top: 8px;
      ">Please collect your pages when this number is displayed</div>
    </div>
    
    <h3>Payment Receipt</h3>
    <div class="receipt-line">
      <span>Ticket Number:</span>
      <strong>#${currentTicketNumber}</strong>
    </div>
    <div class="receipt-line">
      <span>Receipt Number:</span>
      <strong>${receipt.receiptNumber}</strong>
    </div>
    <div class="receipt-line">
      <span>Payment ID:</span>
      <span>${receipt.paymentId}</span>
    </div>
    <div class="receipt-line">
      <span>Pages per Copy:</span>
      <span>${currentPageCount}</span>
    </div>
    <div class="receipt-line">
      <span>Number of Copies:</span>
      <span>${currentCopies}</span>
    </div>
    <div class="receipt-line">
      <span>Total Pages:</span>
      <strong>${currentPageCount * currentCopies}</strong>
    </div>
    <div class="receipt-line">
      <span>Print Type:</span>
      <span>${isColor ? 'Color' : 'Black & White'}</span>
    </div>
    <div class="receipt-line">
      <span>Amount:</span>
      <strong>₹${receipt.amount}</strong>
    </div>
    <div class="receipt-line">
      <span>Email:</span>
      <span>${receipt.customerEmail}</span>
    </div>
    <div class="receipt-line">
      <span>Date:</span>
      <span>${new Date(receipt.timestamp).toLocaleString()}</span>
    </div>
    <div class="receipt-line">
      <span>Printer:</span>
      <span>HP LaserJet P1108</span>
    </div>
    <div style="text-align: center; margin-top: 15px;">
      <span class="status success">${receipt.status}</span>
    </div>
  `;
}

function showStatus(elementId, message, type) {
  const element = document.getElementById(elementId);
  element.innerHTML = `<div class="status ${type}">${message}</div>`;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// ============ ESTIMATED TIME FEATURE ============

let estimatedTimeInterval = null;

async function showEstimatedTime() {
  const section = document.getElementById('estimatedTimeSection');
  if (!section) return;
  
  section.style.display = 'block';
  
  // Update immediately
  await updateEstimatedTime();
  
  // Update every 5 seconds
  if (estimatedTimeInterval) {
    clearInterval(estimatedTimeInterval);
  }
  estimatedTimeInterval = setInterval(updateEstimatedTime, 5000);
}

async function updateEstimatedTime() {
  try {
    // Fetch all jobs from the server
    const response = await fetch('/api/jobs');
    const jobs = await response.json();
    
    // Filter paid jobs that are approved and not yet printed
    const paidJobs = jobs.filter(job => 
      job.paymentStatus === 'paid' && 
      job.status === 'approved' && 
      !job.printed
    );
    
    // Sort by ticket number (ascending)
    paidJobs.sort((a, b) => a.ticketNumber - b.ticketNumber);
    
    // Find the current ticket being printed (lowest ticket number)
    let currentPrintingTicket = '—';
    if (paidJobs.length > 0) {
      currentPrintingTicket = '#' + paidJobs[0].ticketNumber;
    }
    
    // Display current printing ticket
    document.getElementById('currentPrintingTicket').textContent = currentPrintingTicket;
    
    // Display customer's ticket number
    document.getElementById('yourTicketNumber').textContent = '#' + currentTicketNumber;
    
    // Calculate position in queue
    const customerJobIndex = paidJobs.findIndex(job => job.ticketNumber === currentTicketNumber);
    
    if (customerJobIndex === -1) {
      // Job not found in queue (might be already printed or error)
      document.getElementById('estimatedWaitTime').textContent = 'Job not in queue';
      document.getElementById('queueInfo').textContent = 'Your job may have been printed or is being processed';
      
      // Stop updating
      if (estimatedTimeInterval) {
        clearInterval(estimatedTimeInterval);
        estimatedTimeInterval = null;
      }
      return;
    }
    
    if (customerJobIndex === 0) {
      // Customer's job is currently being printed
      document.getElementById('estimatedWaitTime').textContent = 'Printing Now!';
      document.getElementById('queueInfo').textContent = 'Your document is currently being printed';
    } else {
      // Calculate jobs ahead in queue
      const jobsAhead = customerJobIndex;
      
      // Calculate total pages ahead (considering copies)
      let totalPagesAhead = 0;
      for (let i = 0; i < jobsAhead; i++) {
        const job = paidJobs[i];
        const copies = job.copies || 1;
        totalPagesAhead += (job.pageCount || 1) * copies;
      }
      
      // Estimate time: ~10 seconds per page (average printing time)
      const estimatedSeconds = totalPagesAhead * 10;
      const estimatedMinutes = Math.ceil(estimatedSeconds / 60);
      
      // Format time display
      let timeDisplay = '';
      if (estimatedMinutes < 1) {
        timeDisplay = 'Less than 1 minute';
      } else if (estimatedMinutes === 1) {
        timeDisplay = '~1 minute';
      } else {
        timeDisplay = `~${estimatedMinutes} minutes`;
      }
      
      document.getElementById('estimatedWaitTime').textContent = timeDisplay;
      document.getElementById('queueInfo').textContent = `${jobsAhead} ${jobsAhead === 1 ? 'job' : 'jobs'} ahead • ${totalPagesAhead} ${totalPagesAhead === 1 ? 'page' : 'pages'} to print`;
    }
    
  } catch (error) {
    console.error('Error updating estimated time:', error);
    document.getElementById('estimatedWaitTime').textContent = 'Unable to calculate';
    document.getElementById('queueInfo').textContent = 'Please check back shortly';
  }
}

// Clean up interval when page is closed
window.addEventListener('beforeunload', () => {
  if (estimatedTimeInterval) {
    clearInterval(estimatedTimeInterval);
  }
});
