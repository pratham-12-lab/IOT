/**
 * Shop Configuration & Security
 * Manages shop status, password of the day, and access control
 */

class ShopConfig {
  constructor() {
    // Default password from environment
    this.dailyPassword = process.env.THE_DEFAULT_DAILY_PASSWORD || '2323';
    this.adminUsername = process.env.ADMIN_USERNAME || 'admin';
    this.adminPassword = process.env.ADMIN_PASSWORD || '2323';
    
    // Shop status - fully manual control by admin
    this.shopIsOpen = true; // Default to open
    
    console.log('🔐 Shop Security initialized');
    console.log('   Default daily password:', this.dailyPassword);
    console.log('   Shop control: Manual (admin decides)');
  }

  /**
   * Check if shop is currently open
   * @returns {boolean} True if shop is open
   */
  isShopOpen() {
    return this.shopIsOpen;
  }

  /**
   * Get shop status with info
   * @returns {Object} Shop status details
   */
  getShopStatus() {
    return {
      isOpen: this.shopIsOpen,
      message: this.shopIsOpen 
        ? 'Shop is currently open for orders' 
        : 'Shop is currently closed. Please check back later.'
    };
  }

  /**
   * Set shop status (admin control)
   * @param {boolean} isOpen - True to open, false to close
   */
  setShopStatus(isOpen) {
    this.shopIsOpen = isOpen;
    console.log(`🏪 Shop status changed to: ${isOpen ? 'OPEN' : 'CLOSED'}`);
    return this.getShopStatus();
  }

  /**
   * Verify admin credentials
   * @param {string} username - Admin username
   * @param {string} password - Admin password
   * @returns {boolean} True if credentials are valid
   */
  verifyAdmin(username, password) {
    const usernameMatch = String(username).trim() === String(this.adminUsername).trim();
    const passwordMatch = String(password).trim() === String(this.adminPassword).trim();
    
    console.log('🔐 Admin verification attempt:');
    console.log(`   Username: "${username}" vs "${this.adminUsername}" = ${usernameMatch}`);
    console.log(`   Password: "${password}" vs "${this.adminPassword}" = ${passwordMatch}`);
    
    return usernameMatch && passwordMatch;
  }

  /**
   * Verify customer password of the day
   * @param {string} password - Password to verify
   * @returns {boolean} True if password is correct
   */
  verifyDailyPassword(password) {
    const isValid = String(password).trim() === String(this.dailyPassword).trim();
    console.log(`🔐 Password verification: ${isValid ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Received: "${password}" | Expected: "${this.dailyPassword}"`);
    return isValid;
  }

  /**
   * Update password of the day (admin only)
   * @param {string} newPassword - New password
   * @returns {boolean} True if updated successfully
   */
  updateDailyPassword(newPassword) {
    if (!newPassword || newPassword.length < 4) {
      return false;
    }
    this.dailyPassword = newPassword;
    console.log('🔐 Daily password updated:', newPassword);
    return true;
  }

  /**
   * Get current daily password (for admin view only)
   * @returns {string} Current password
   */
  getDailyPassword() {
    return this.dailyPassword;
  }
}

module.exports = new ShopConfig();
