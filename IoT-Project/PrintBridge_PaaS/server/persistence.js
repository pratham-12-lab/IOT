/**
 * Data Persistence Module
 * Saves jobs and ticket counter to prevent data loss on server restart
 */

const fs = require('fs');
const path = require('path');

const JOBS_FILE = path.join(__dirname, '../data/jobs.json');
const TICKET_FILE = path.join(__dirname, '../data/ticket-counter.txt');
const DATA_DIR = path.join(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log('📁 Created data directory');
}

/**
 * Save jobs to file
 */
function saveJobs(jobs) {
  try {
    fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2));
    console.log(`💾 Saved ${jobs.length} jobs to disk`);
  } catch (error) {
    console.error('❌ Error saving jobs:', error.message);
  }
}

/**
 * Load jobs from file
 */
function loadJobs() {
  try {
    if (fs.existsSync(JOBS_FILE)) {
      const data = fs.readFileSync(JOBS_FILE, 'utf8');
      const jobs = JSON.parse(data);
      console.log(`📂 Loaded ${jobs.length} jobs from disk`);
      return jobs;
    } else {
      console.log('📂 No saved jobs found, starting fresh');
      return [];
    }
  } catch (error) {
    console.error('❌ Error loading jobs:', error.message);
    return [];
  }
}

/**
 * Save ticket counter to file
 */
function saveTicketCounter(counter) {
  try {
    fs.writeFileSync(TICKET_FILE, counter.toString());
    console.log(`💾 Saved ticket counter: ${counter}`);
  } catch (error) {
    console.error('❌ Error saving ticket counter:', error.message);
  }
}

/**
 * Load ticket counter from file
 */
function loadTicketCounter() {
  try {
    if (fs.existsSync(TICKET_FILE)) {
      const counter = parseInt(fs.readFileSync(TICKET_FILE, 'utf8'));
      console.log(`📂 Loaded ticket counter: ${counter}`);
      return counter;
    } else {
      console.log('📂 No saved ticket counter, starting from 1000');
      return 1000;
    }
  } catch (error) {
    console.error('❌ Error loading ticket counter:', error.message);
    return 1000;
  }
}

/**
 * Auto-save jobs periodically (every 30 seconds)
 */
function enableAutoSave(getJobsFunction) {
  setInterval(() => {
    const jobs = getJobsFunction();
    if (jobs.length > 0) {
      saveJobs(jobs);
    }
  }, 30000); // 30 seconds
  
  console.log('⏰ Auto-save enabled (every 30 seconds)');
}

module.exports = {
  saveJobs,
  loadJobs,
  saveTicketCounter,
  loadTicketCounter,
  enableAutoSave
};
