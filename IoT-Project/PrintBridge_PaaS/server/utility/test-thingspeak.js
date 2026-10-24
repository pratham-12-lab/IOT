/**
 * ThingSpeak Integration Test
 * Run this to test if ThingSpeak is working
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const thingspeak = require('../thingspeak');

console.log('🧪 Testing ThingSpeak Integration\n');

// Mock jobs data for testing
const mockJobs = [
  {
    id: Date.now(),
    ticketNumber: 1002,
    pageCount: 5,
    paymentStatus: 'paid',
    isColor: false,
    printed: false
  },
  {
    id: Date.now() - 1000,
    ticketNumber: 1001,
    pageCount: 3,
    paymentStatus: 'paid',
    isColor: true,
    printed: true
  },
  {
    id: Date.now() - 2000,
    ticketNumber: 1000,
    pageCount: 10,
    paymentStatus: 'paid',
    isColor: false,
    printed: true
  }
];

function getMockJobs() {
  return mockJobs;
}

console.log('📊 Mock Data:');
console.log('  Total Jobs:', mockJobs.length);
console.log('  Total Pages:', mockJobs.reduce((sum, j) => sum + j.pageCount, 0));
console.log('  Printed:', mockJobs.filter(j => j.printed).length);
console.log('  Queue:', mockJobs.filter(j => !j.printed).length);
console.log('');

console.log('☁️ Sending test data to ThingSpeak...');
console.log('   (This may take a few seconds)\n');

// Send test data
thingspeak.sendNow(getMockJobs).then(() => {
  console.log('\n✅ Test complete!');
  console.log('\n📊 View your data:');
  console.log('   ThingSpeak Channel: https://thingspeak.com/channels/3373847');
  console.log('   Customer Dashboard: http://localhost:5000/thingspeak-customer.html');
  console.log('   Admin Dashboard: http://localhost:5000/thingspeak-admin.html');
  console.log('\n💡 Tip: Data updates every 15 seconds when server is running');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Test failed:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('   1. Check .env file has correct API keys');
  console.log('   2. Verify internet connection');
  console.log('   3. Check ThingSpeak channel is active');
  process.exit(1);
});
