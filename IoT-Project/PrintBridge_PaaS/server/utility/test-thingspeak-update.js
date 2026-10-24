/**
 * ThingSpeak Update Diagnostic Tool
 * Tests if ThingSpeak is receiving updates correctly
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const thingspeak = require('../thingspeak');
const { getJobs } = require('../jobs');

console.log('╔════════════════════════════════════════╗');
console.log('║  ThingSpeak Update Diagnostic Tool    ║');
console.log('╚════════════════════════════════════════╝\n');

// Check environment variables
console.log('1️⃣ Checking Environment Variables:');
console.log('   THINGSPEAK_WRITE_KEY:', process.env.THINGSPEAK_WRITE_KEY ? '✓ Set (' + process.env.THINGSPEAK_WRITE_KEY + ')' : '✗ Missing');
console.log('   THINGSPEAK_CHANNEL_ID:', process.env.THINGSPEAK_CHANNEL_ID ? '✓ Set (' + process.env.THINGSPEAK_CHANNEL_ID + ')' : '✗ Missing');
console.log('');

// Check current jobs
console.log('2️⃣ Checking Current Jobs:');
const jobs = getJobs();
console.log('   Total jobs in system:', jobs.length);
console.log('');

// Calculate metrics
console.log('3️⃣ Calculating Metrics:');
const metrics = thingspeak.calculateMetrics(jobs);
console.log('   Metrics to send:');
console.log('   - Field 1 (Total Jobs):', metrics.totalJobs);
console.log('   - Field 2 (Total Pages):', metrics.totalPages);
console.log('   - Field 3 (Revenue):', metrics.revenue);
console.log('   - Field 4 (Queue Length):', metrics.queueLength);
console.log('   - Field 5 (Color Ratio):', metrics.colorRatio + '%');
console.log('   - Field 6 (Latest Ticket):', metrics.latestTicketNumber);
console.log('   - Field 7 (Printer Status):', metrics.printerStatus);
console.log('   - Field 8 (Paper Status):', metrics.paperStatus);
console.log('');

// Send test update
console.log('4️⃣ Sending Test Update to ThingSpeak:');
console.log('   Please wait...\n');

thingspeak.sendNow(getJobs).then(() => {
  console.log('\n✅ Test complete!');
  console.log('');
  console.log('📊 Check your channel:');
  console.log('   https://thingspeak.com/channels/' + process.env.THINGSPEAK_CHANNEL_ID);
  console.log('');
  console.log('💡 If data is not showing:');
  console.log('   1. Check if Write API Key is correct');
  console.log('   2. Verify channel ID matches');
  console.log('   3. Check ThingSpeak rate limit (15 seconds between updates)');
  console.log('   4. Ensure server has internet connection');
  console.log('');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
