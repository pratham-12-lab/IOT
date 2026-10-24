/**
 * Clear All Jobs Utility
 * Deletes all jobs from the server
 */

const https = require('https');

const SERVER_HOST = 'printbridge-by-vps.onrender.com';
const SERVER_PORT = 443;

console.log('╔════════════════════════════════════════╗');
console.log('║   CLEAR ALL JOBS - PrintBridge-PaaS        ║');
console.log('╚════════════════════════════════════════╝\n');

console.log('→ Connecting to server...');
console.log(`  Host: ${SERVER_HOST}`);
console.log(`  Port: ${SERVER_PORT}\n`);

const options = {
  hostname: SERVER_HOST,
  port: SERVER_PORT,
  path: '/api/jobs/clear-all',
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('✓ Server response received\n');
    
    try {
      const result = JSON.parse(data);
      
      if (result.success) {
        console.log('╔════════════════════════════════════════╗');
        console.log('║   ALL JOBS CLEARED SUCCESSFULLY!      ║');
        console.log('╚════════════════════════════════════════╝\n');
        console.log(`  Jobs deleted: ${result.deletedCount}`);
        console.log('\n✓ Server is now clean and ready for new jobs!\n');
      } else {
        console.log('✗ Failed to clear jobs');
        console.log('  Response:', result);
      }
    } catch (error) {
      console.log('✗ Error parsing response:', error.message);
      console.log('  Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('✗ Request failed:', error.message);
  console.error('\nTroubleshooting:');
  console.error('  1. Check if server is running');
  console.error('  2. Verify server URL is correct');
  console.error('  3. Check internet connection\n');
});

req.end();
