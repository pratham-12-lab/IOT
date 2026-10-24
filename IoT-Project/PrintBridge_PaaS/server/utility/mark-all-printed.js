const axios = require('axios');

async function markAllAsPrinted() {
  try {
    console.log('========================================');
    console.log('MARK ALL JOBS AS PRINTED');
    console.log('========================================\n');
    
    const serverUrl = 'https://printbridge-by-vps.onrender.com';
    
    console.log('📊 Fetching all jobs...');
    const response = await axios.get(`${serverUrl}/api/jobs`);
    const jobs = response.data;
    
    console.log(`   Total jobs: ${jobs.length}\n`);
    
    if (jobs.length === 0) {
      console.log('✓ No jobs to mark!\n');
      return;
    }
    
    for (const job of jobs) {
      const isPrinted = job.printed === true;
      const status = isPrinted ? '✓ Already printed' : '⏳ Marking as printed';
      
      console.log(`Job ${job.id}: ${status}`);
      
      if (!isPrinted) {
        try {
          await axios.post(`${serverUrl}/api/jobs/${job.id}/printed`);
          console.log(`   ✅ Marked as printed`);
        } catch (error) {
          console.log(`   ❌ Error: ${error.message}`);
        }
      }
    }
    
    console.log('\n========================================');
    console.log('✅ DONE!');
    console.log('========================================\n');
    console.log('All jobs have been marked as printed.');
    console.log('They will NOT print again.\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

markAllAsPrinted();
