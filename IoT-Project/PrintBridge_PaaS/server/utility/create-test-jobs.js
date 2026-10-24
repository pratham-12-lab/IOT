/**
 * Create Test Jobs for ThingSpeak Testing
 * Adds sample jobs to test the system
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { addJob, getJobs } = require('../jobs');

console.log('╔════════════════════════════════════════╗');
console.log('║     Create Test Jobs for Testing      ║');
console.log('╚════════════════════════════════════════╝\n');

// Create 5 test jobs
const testJobs = [
  {
    filename: 'test-document-1.pdf',
    pageCount: 5,
    isColor: false,
    fileUrl: 'https://example.com/test1.pdf',
    status: 'approved',
    paymentStatus: 'paid',
    printed: false
  },
  {
    filename: 'test-document-2.pdf',
    pageCount: 10,
    isColor: true,
    fileUrl: 'https://example.com/test2.pdf',
    status: 'approved',
    paymentStatus: 'paid',
    printed: false
  },
  {
    filename: 'test-document-3.pdf',
    pageCount: 3,
    isColor: false,
    fileUrl: 'https://example.com/test3.pdf',
    status: 'approved',
    paymentStatus: 'paid',
    printed: true  // Already printed
  },
  {
    filename: 'test-document-4.pdf',
    pageCount: 8,
    isColor: true,
    fileUrl: 'https://example.com/test4.pdf',
    status: 'approved',
    paymentStatus: 'paid',
    printed: false
  },
  {
    filename: 'test-document-5.pdf',
    pageCount: 2,
    isColor: false,
    fileUrl: 'https://example.com/test5.pdf',
    status: 'pending',
    paymentStatus: 'unpaid',
    printed: false
  }
];

console.log('Creating test jobs...\n');

testJobs.forEach((jobData, index) => {
  const job = addJob(jobData);
  console.log(`✓ Job ${index + 1} created:`);
  console.log(`  ID: ${job.id}`);
  console.log(`  Ticket: #${job.ticketNumber}`);
  console.log(`  Pages: ${job.pageCount} (${job.isColor ? 'Color' : 'B&W'})`);
  console.log(`  Status: ${job.status} / ${job.paymentStatus}`);
  console.log(`  Printed: ${job.printed ? 'Yes' : 'No'}`);
  console.log('');
});

console.log('═══════════════════════════════════════');
console.log('Summary:');
const allJobs = getJobs();
const paidJobs = allJobs.filter(j => j.paymentStatus === 'paid');
const printedJobs = allJobs.filter(j => j.printed);
const queueJobs = paidJobs.filter(j => !j.printed);

console.log(`  Total jobs: ${allJobs.length}`);
console.log(`  Paid jobs: ${paidJobs.length}`);
console.log(`  Printed jobs: ${printedJobs.length}`);
console.log(`  In queue: ${queueJobs.length}`);
console.log('═══════════════════════════════════════\n');

console.log('✅ Test jobs created successfully!');
console.log('');
console.log('💡 Next steps:');
console.log('   1. Start the server: node server/index.js');
console.log('   2. ThingSpeak will update with this data');
console.log('   3. Check: https://thingspeak.com/channels/3373847');
console.log('');
