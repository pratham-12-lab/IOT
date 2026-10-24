/**
 * Test Copies Feature
 * Verifies that copies are being stored and retrieved correctly
 */

const https = require('https');

const SERVER_HOST = 'printbridge-by-vps.onrender.com';
const SERVER_PORT = 443;

console.log('╔════════════════════════════════════════╗');
console.log('║   TEST COPIES FEATURE                 ║');
console.log('╚════════════════════════════════════════╝\n');

console.log('→ Fetching all jobs from server...\n');

const options = {
  hostname: SERVER_HOST,
  port: SERVER_PORT,
  path: '/api/jobs',
  method: 'GET',
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
    try {
      const jobs = JSON.parse(data);
      
      console.log(`✓ Found ${jobs.length} job(s)\n`);
      
      if (jobs.length === 0) {
        console.log('No jobs found. Submit a test job with multiple copies.\n');
        return;
      }
      
      jobs.forEach((job, index) => {
        console.log(`Job ${index + 1}:`);
        console.log(`  ID: ${job.id}`);
        console.log(`  Ticket: #${job.ticketNumber || 'N/A'}`);
        console.log(`  Status: ${job.status}`);
        console.log(`  Payment: ${job.paymentStatus}`);
        console.log(`  Pages: ${job.pageCount}`);
        console.log(`  Copies: ${job.copies || 'NOT SET ❌'}`);
        console.log(`  Color: ${job.isColor ? 'Yes' : 'No'}`);
        console.log(`  Printed: ${job.printed}`);
        console.log();
      });
      
      // Check if any job has copies set
      const jobsWithCopies = jobs.filter(j => j.copies && j.copies > 1);
      
      if (jobsWithCopies.length > 0) {
        console.log('✅ COPIES FEATURE WORKING!');
        console.log(`   ${jobsWithCopies.length} job(s) have multiple copies set\n`);
      } else {
        console.log('⚠️  No jobs with multiple copies found');
        console.log('   Submit a test job with copies > 1 to verify\n');
      }
      
    } catch (error) {
      console.log('✗ Error parsing response:', error.message);
      console.log('  Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('✗ Request failed:', error.message);
});

req.end();
