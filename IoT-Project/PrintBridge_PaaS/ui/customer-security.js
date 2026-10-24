/**
 * Customer Portal Security Features
 * - Shop status checking
 * - Password of the day verification
 * - Auto-delete file selection
 */

const API_BASE = window.location.origin;
let shopIsOpen = false;
let autoDeleteTiming = 'immediately';

// Check shop status on page load
async function checkShopStatus() {
  try {
    const response = await fetch(`${API_BASE}/api/shop-status`);
    const status = await response.json();
    
    shopIsOpen = status.isOpen;
    updateShopStatusUI(status);
  } catch (error) {
    console.error('Error checking shop status:', error);
    // Assume open if error
    shopIsOpen = true;
  }
}

// Update UI based on shop status
function updateShopStatusUI(status) {
  const banner = document.getElementById('shop-status-banner');
  
  if (!banner) return;
  
  if (status.isOpen) {
    banner.innerHTML = `
      <div style="
        background: #d1fae5;
        border: 2px solid #059669;
        padding: 16px;
        text-align: center;
        margin-bottom: 24px;
      ">
        <div style="
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #059669;
        ">
          🟢 Shop is Open
        </div>
        <div style="
          font-size: 13px;
          color: #047857;
          margin-top: 4px;
        ">
          We are accepting orders now
        </div>
      </div>
    `;
  } else {
    banner.innerHTML = `
      <div style="
        background: #fee2e2;
        border: 2px solid #dc2626;
        padding: 24px;
        text-align: center;
        margin-bottom: 24px;
      ">
        <div style="
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #dc2626;
          margin-bottom: 8px;
        ">
          🔴 Shop is Currently Closed
        </div>
        <div style="
          font-size: 14px;
          color: #991b1b;
        ">
          ${status.message}
        </div>
      </div>
    `;
    
    // Disable upload buttons
    const uploadButtons = document.querySelectorAll('.upload-btn, .next-btn, button');
    uploadButtons.forEach(btn => {
      if (btn.textContent.includes('Upload') || btn.textContent.includes('upload')) {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
      }
    });
  }
}

// Verify password of the day
async function verifyDailyPassword() {
  return new Promise((resolve) => {
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'password-modal';
    modal.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      ">
        <div style="
          background: var(--paper, #faf9f6);
          padding: 40px;
          max-width: 400px;
          width: 90%;
          border: 2px solid var(--rule, #d8d4c8);
        ">
          <h3 style="
            font-family: 'Playfair Display', serif;
            font-size: 24px;
            color: var(--navy, #1e293b);
            margin-bottom: 16px;
            text-align: center;
          ">🔐 Password Required</h3>
          
          <p style="
            font-size: 14px;
            color: var(--ink-soft, #4a4a4a);
            text-align: center;
            margin-bottom: 24px;
          ">
            Enter the Password of the Day to continue
          </p>
          
          <div id="password-error" style="
            background: #fee2e2;
            color: #dc2626;
            padding: 12px;
            margin-bottom: 16px;
            font-size: 14px;
            border: 1px solid #fecaca;
            display: none;
          "></div>
          
          <input 
            type="text" 
            id="daily-password-input" 
            placeholder="Enter password"
            style="
              width: 100%;
              padding: 12px;
              font-size: 16px;
              border: 1px solid var(--rule, #d8d4c8);
              margin-bottom: 20px;
              font-family: 'JetBrains Mono', monospace;
              letter-spacing: 2px;
            "
          />
          
          <button 
            onclick="submitPassword()"
            style="
              width: 100%;
              padding: 14px;
              background: var(--saffron, #d97706);
              color: white;
              border: none;
              font-family: 'JetBrains Mono', monospace;
              font-size: 12px;
              font-weight: 600;
              letter-spacing: 1px;
              text-transform: uppercase;
              cursor: pointer;
            "
          >Verify Password</button>
          
          <button 
            onclick="cancelPassword()"
            style="
              width: 100%;
              padding: 12px;
              background: transparent;
              color: var(--ink-soft, #4a4a4a);
              border: 1px solid var(--rule, #d8d4c8);
              font-family: 'JetBrains Mono', monospace;
              font-size: 11px;
              font-weight: 600;
              letter-spacing: 1px;
              text-transform: uppercase;
              cursor: pointer;
              margin-top: 12px;
            "
          >Cancel</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    document.getElementById('daily-password-input').focus();
    
    // Enter key support
    document.getElementById('daily-password-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') submitPassword();
    });
    
    // Submit password
    window.submitPassword = async () => {
      const password = document.getElementById('daily-password-input').value;
      const errorDiv = document.getElementById('password-error');
      
      try {
        const response = await fetch(`${API_BASE}/api/verify-daily-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });
        
        const result = await response.json();
        
        if (result.success) {
          document.body.removeChild(modal);
          resolve(true);
        } else {
          errorDiv.textContent = '❌ Incorrect password. Please try again.';
          errorDiv.style.display = 'block';
          document.getElementById('daily-password-input').value = '';
          document.getElementById('daily-password-input').focus();
        }
      } catch (error) {
        errorDiv.textContent = '❌ Verification failed. Please try again.';
        errorDiv.style.display = 'block';
      }
    };
    
    // Cancel
    window.cancelPassword = () => {
      document.body.removeChild(modal);
      resolve(false);
    };
  });
}

// Get auto-delete timing (always immediately now)
function getAutoDeleteTiming() {
  return 'immediately'; // Always delete immediately after printing
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  checkShopStatus();
});

// Export functions for use in customer.js
window.checkShopStatus = checkShopStatus;
window.verifyDailyPassword = verifyDailyPassword;
window.getAutoDeleteTiming = getAutoDeleteTiming;
window.shopIsOpen = () => shopIsOpen;
