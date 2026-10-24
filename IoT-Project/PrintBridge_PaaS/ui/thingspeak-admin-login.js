/**
 * Admin Login & Password Management for ThingSpeak Admin Dashboard
 */

const API_BASE = window.location.origin;

// Check if already logged in
let isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';
let currentDailyPassword = sessionStorage.getItem('dailyPassword') || '2323';
let manualShopOverride = sessionStorage.getItem('manualShopOverride') || null; // 'open', 'close', or null
let isDemoMode = false; // Will be fetched from server

// Check demo mode status
async function checkDemoMode() {
  try {
    const response = await fetch(`${API_BASE}/api/demo-status`);
    const data = await response.json();
    isDemoMode = data.demoMode;
    
    if (isDemoMode) {
      console.log('🎭 Demo mode detected - Password changes disabled');
    }
  } catch (error) {
    console.error('Error checking demo mode:', error);
  }
}

// Show/hide sections based on login status
function updateUI() {
  const loginSection = document.getElementById('login-section');
  const adminContent = document.getElementById('admin-content');
  
  if (isLoggedIn) {
    loginSection.style.display = 'none';
    adminContent.style.display = 'block';
    document.getElementById('current-password-display').textContent = currentDailyPassword;
    
    // Disable password management in demo mode
    if (isDemoMode) {
      const passwordPanel = document.querySelector('.control-panel:has(#new-password)');
      if (passwordPanel) {
        passwordPanel.style.opacity = '0.6';
        passwordPanel.style.pointerEvents = 'none';
        
        // Add demo mode notice
        const notice = document.createElement('div');
        notice.style.cssText = `
          background: #fef3c7;
          border: 2px solid #f59e0b;
          padding: 12px;
          margin-top: 16px;
          font-size: 13px;
          color: #92400e;
          text-align: center;
        `;
        notice.innerHTML = '🎭 <strong>Demo Mode:</strong> Password changes are disabled to maintain consistent demo experience';
        passwordPanel.appendChild(notice);
      }
      
      const newPasswordInput = document.getElementById('new-password');
      const updateButton = document.querySelector('button[onclick="updateDailyPassword()"]');
      if (newPasswordInput) newPasswordInput.disabled = true;
      if (updateButton) updateButton.disabled = true;
    }
    
    // Update shop status display
    updateShopStatusDisplay();
  } else {
    loginSection.style.display = 'block';
    adminContent.style.display = 'none';
  }
}

// Update shop status display
async function updateShopStatusDisplay() {
  try {
    const response = await fetch(`${API_BASE}/api/shop-status`);
    const status = await response.json();
    
    const statusDisplay = document.getElementById('current-shop-status');
    const statusContainer = document.getElementById('shop-status-display');
    
    if (status.isOpen) {
      statusDisplay.innerHTML = '🟢 OPEN';
      statusDisplay.style.color = '#059669';
      statusContainer.style.borderColor = '#059669';
    } else {
      statusDisplay.innerHTML = '🔴 CLOSED';
      statusDisplay.style.color = '#dc2626';
      statusContainer.style.borderColor = '#dc2626';
    }
    
    // Show override status if active
    if (manualShopOverride) {
      const messageDiv = document.getElementById('shop-status-message');
      messageDiv.textContent = `⚠️ Manual override active: ${manualShopOverride.toUpperCase()}`;
      messageDiv.style.color = '#d97706';
      messageDiv.style.display = 'block';
    }
  } catch (error) {
    console.error('Error fetching shop status:', error);
  }
}

// Manual shop control
async function manualShopControl(action) {
  const isOpen = action === 'open';
  const messageDiv = document.getElementById('shop-status-message');
  
  try {
    // Call API to update shop status
    const response = await fetch(`${API_BASE}/api/shop-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isOpen: isOpen })
    });
    
    const data = await response.json();
    
    if (data.success || data.status) {
      messageDiv.textContent = `✓ Shop ${action.toUpperCase()} successfully`;
      messageDiv.style.color = '#059669';
      messageDiv.style.display = 'block';
      messageDiv.classList.remove('error-message');
      messageDiv.classList.add('success-message');
      
      // Update display
      await updateShopStatusDisplay();
      
      setTimeout(() => {
        messageDiv.style.display = 'none';
      }, 3000);
      
      console.log(`🏪 Shop ${action}ed by admin`);
    } else {
      throw new Error('Failed to update shop status');
    }
  } catch (error) {
    messageDiv.textContent = '❌ Failed to update shop status';
    messageDiv.style.color = '#dc2626';
    messageDiv.style.display = 'block';
    messageDiv.classList.remove('success-message');
    messageDiv.classList.add('error-message');
    console.error('Error updating shop status:', error);
  }
}

// Reset to automatic shop hours - REMOVED (now fully manual)
function resetShopToAuto() {
  const messageDiv = document.getElementById('shop-status-message');
  messageDiv.textContent = 'ℹ️ Shop is now fully manual. Use Open/Close buttons to control.';
  messageDiv.style.color = '#d97706';
  messageDiv.style.display = 'block';
  
  setTimeout(() => {
    messageDiv.style.display = 'none';
  }, 3000);
}

// Admin login
async function adminLogin() {
  const username = document.getElementById('admin-username').value;
  const password = document.getElementById('admin-password').value;
  const errorDiv = document.getElementById('login-error');
  
  try {
    const response = await fetch(`${API_BASE}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      isLoggedIn = true;
      currentDailyPassword = data.dailyPassword;
      sessionStorage.setItem('adminLoggedIn', 'true');
      sessionStorage.setItem('dailyPassword', data.dailyPassword);
      errorDiv.style.display = 'none';
      updateUI();
    } else {
      errorDiv.textContent = data.message;
      errorDiv.style.display = 'block';
    }
  } catch (error) {
    errorDiv.textContent = 'Login failed. Please try again.';
    errorDiv.style.display = 'block';
  }
}

// Update password of the day
async function updateDailyPassword() {
  // Check if demo mode
  if (isDemoMode) {
    const messageDiv = document.getElementById('password-message');
    messageDiv.textContent = '🎭 Password changes are disabled in demo mode';
    messageDiv.style.color = '#d97706';
    messageDiv.style.display = 'block';
    setTimeout(() => {
      messageDiv.style.display = 'none';
    }, 3000);
    return;
  }
  
  const newPassword = document.getElementById('new-password').value;
  const messageDiv = document.getElementById('password-message');
  
  if (!newPassword || newPassword.length < 4) {
    messageDiv.textContent = 'Password must be at least 4 characters';
    messageDiv.style.color = '#dc2626';
    messageDiv.style.display = 'block';
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/api/admin/update-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword })
    });
    
    const data = await response.json();
    
    if (data.success) {
      currentDailyPassword = data.newPassword;
      sessionStorage.setItem('dailyPassword', data.newPassword);
      document.getElementById('current-password-display').textContent = currentDailyPassword;
      document.getElementById('new-password').value = '';
      messageDiv.textContent = '✓ Password updated successfully!';
      messageDiv.style.color = '#059669';
      messageDiv.style.display = 'block';
      
      setTimeout(() => {
        messageDiv.style.display = 'none';
      }, 3000);
    } else {
      messageDiv.textContent = data.message;
      messageDiv.style.color = '#dc2626';
      messageDiv.style.display = 'block';
    }
  } catch (error) {
    messageDiv.textContent = 'Update failed. Please try again.';
    messageDiv.style.color = '#dc2626';
    messageDiv.style.display = 'block';
  }
}

// Logout
function logout() {
  isLoggedIn = false;
  sessionStorage.removeItem('adminLoggedIn');
  sessionStorage.removeItem('dailyPassword');
  updateUI();
}

// Enter key support for login
document.addEventListener('DOMContentLoaded', async () => {
  // Check demo mode first
  await checkDemoMode();
  
  updateUI();
  
  const usernameInput = document.getElementById('admin-username');
  const passwordInput = document.getElementById('admin-password');
  
  if (usernameInput && passwordInput) {
    usernameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') adminLogin();
    });
    
    passwordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') adminLogin();
    });
  }
  
  const newPasswordInput = document.getElementById('new-password');
  if (newPasswordInput) {
    newPasswordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') updateDailyPassword();
    });
  }
});

// Export functions for use in HTML onclick handlers
window.adminLogin = adminLogin;
window.updateDailyPassword = updateDailyPassword;
window.logout = logout;
window.manualShopControl = manualShopControl;
window.resetShopToAuto = resetShopToAuto;
