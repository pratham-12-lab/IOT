/**
 * Clear Old Jobs Utility
 * 
 * This script marks all jobs created BEFORE today as "printed"
 * so they don't appear in the print queue anymore.
 * 
 * Use this to clean up old test jobs or jobs from previous days.
 */

const axios = require('axios');

// Configuration
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

async function clearOldJobs() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║     CLEAR OLD JOBS UTILITY             ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  try {
    // Get all jobs
    console.log('→ Fetching all jobs from server...');
    const response = await axios.get(`${SERVER_URL}/api/jobs`);
    const allJobs = response.data;
    
    console.log(`✓ Found ${allJobs.length} total jobs\n`);
    
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCutoff = today.getTime();
    
    console.log(`Cutoff time: ${today.toLocaleString()}`);
    console.log(`Jobs created BEFORE this time will be marked as printed\n`);
    
    // Filter old jobs (created before today)
    const oldJobs = allJobs.filter(job => {
      const jobCreatedAt = job.id; // Job ID is timestamp
      return jobCreatedAt < todayCutoff && job.printed === false;
    });
    
    console.log(`Found ${oldJobs.length} old unpaid/unprinted jobs\n`);
    
    if (oldJobs.length === 0) {
      console.log('✓ No old jobs to clear. Queue is clean!\n');
      return;
    }
    
    // Mark each old job as printed
    console.log('→ Marking old jobs as printed...\n');
    
    let successCount = 0;
    let failCount = 0;
    
    for (const job of oldJobs) {
      const jobDate = new Date(job.id).toLocaleString();
      const ticketNumber = job.ticketNumber || 'N/A';
      
      try {
        await axios.post(`${SERVER_URL}/api/jobs/${job.id}/printed`);
        console.log(`  ✓ Ticket #${ticketNumber} (${jobDate}) - Marked as printed`);
        successCount++;
      } catch (error) {
        console.log(`  ✗ Ticket #${ticketNumber} (${jobDate}) - Failed: ${error.message}`);
        failCount++;
      }
    }
    
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║            SUMMARY                     ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`Total old jobs found: ${oldJobs.length}`);
    console.log(`Successfully marked: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    console.log('\n✓ Old jobs cleared! Queue is now clean.\n');
    
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error('Make sure the server is running!\n');
    process.exit(1);
  }
}

// Run the script
clearOldJobs();
