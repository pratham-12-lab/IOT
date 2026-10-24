// Printer Agent Configuration
// Update SERVER_URL after deploying to Render

module.exports = {
  // Local development URL (change to Render URL for production)
  SERVER_URL: 'http://localhost:5000',
  
  // Polling interval in milliseconds
  POLL_INTERVAL: 5000,
  
  // Printer name (update if different)
  // Using Microsoft Print to PDF for testing (no physical printer connected)
  PRINTER_NAME: 'Microsoft Print to PDF',
  
  // Download directory
  DOWNLOAD_DIR: __dirname + '/downloads'
};
