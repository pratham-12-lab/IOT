/**
 * ThingSpeak IoT Cloud Analytics Integration
 * Sends real-time printing metrics to ThingSpeak for visualization
 */

const axios = require('axios');

class ThingSpeakIntegration {
  constructor() {
    // Load from environment variables
    this.WRITE_API_KEY = process.env.THINGSPEAK_WRITE_KEY || '';
    this.CHANNEL_ID = process.env.THINGSPEAK_CHANNEL_ID || '';
    this.BASE_URL = 'https://api.thingspeak.com/update';
    
    this.lastUpdate = 0;
    this.UPDATE_INTERVAL = 15000; // 15 seconds (ThingSpeak free tier limit)
    
    this.enabled = this.WRITE_API_KEY && this.CHANNEL_ID;
    
    if (this.enabled) {
      console.log('☁️ ThingSpeak integration enabled');
      console.log('   Channel ID:', this.CHANNEL_ID);
      console.log('   View live: https://thingspeak.com/channels/' + this.CHANNEL_ID);
    } else {
      console.log('ℹ️ ThingSpeak not configured (check .env file)');
    }
  }

  /**
   * Send data to ThingSpeak
   * @param {Object} data - Metrics to send
   */
  async sendData(data) {
    if (!this.enabled) return;
    
    // ThingSpeak free account: max 1 update per 15 seconds
    const now = Date.now();
    if (now - this.lastUpdate < this.UPDATE_INTERVAL) {
      return; // Skip if too soon
    }

    try {
      // Add timestamp to field 8 (paper status) to prevent duplicate rejection
      // When all other fields are 0, ThingSpeak rejects as duplicate
      // We use the seconds component (0-59) which changes every minute
      const timestampVariation = Math.floor((now / 1000) % 60);
      
      const params = {
        api_key: this.WRITE_API_KEY,
        field1: data.totalJobs || 0,           // Total jobs today
        field2: data.totalPages || 0,          // Total pages printed
        field3: data.revenue || 0,             // Revenue in INR
        field4: data.queueLength || 0,         // Current queue length
        field5: data.colorRatio || 0,          // Color print ratio (%)
        field6: data.latestTicketNumber || 0,  // Latest ticket number (changed!)
        field7: data.printerStatus || 0,       // 0=idle, 1=printing, 2=error
        field8: data.paperStatus || timestampVariation  // Paper status + timestamp variation
      };

      const response = await axios.get(this.BASE_URL, { 
        params,
        timeout: 15000  // Increased to 15 seconds
      });
      
      if (response.data > 0) {
        console.log(`☁️ ThingSpeak: Data sent (Entry #${response.data})`);
        console.log(`   📊 Jobs: ${params.field1}, Pages: ${params.field2}, Queue: ${params.field4}, Ticket: ${params.field6}`);
        this.lastUpdate = now;
      } else if (response.data === 0) {
        // ThingSpeak returns 0 when:
        // 1. Rate limit exceeded (< 15 seconds between updates)
        // 2. Duplicate data (same values as last update)
        // 3. Invalid API key
        console.log('⚠️ ThingSpeak: Update rejected (0 returned)');
        console.log(`   Possible reasons: Rate limit, duplicate data, or invalid API key`);
        console.log(`   Data attempted: Jobs=${params.field1}, Ticket=${params.field6}`);
      } else {
        console.log('⚠️ ThingSpeak: Unexpected response:', response.data);
      }
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        console.log('⚠️ ThingSpeak: Timeout (slow connection, will retry)');
      } else if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
        console.log('⚠️ ThingSpeak: DNS/Network error (check internet connection)');
      } else {
        console.error('❌ ThingSpeak error:', error.message);
      }
    }
  }

  /**
   * Calculate metrics from jobs array
   * @param {Array} jobs - Array of job objects
   * @returns {Object} Calculated metrics
   */
  calculateMetrics(jobs) {
    // Get today's date at midnight
    const today = new Date().setHours(0, 0, 0, 0);
    
    // Filter jobs from today
    const todayJobs = jobs.filter(j => j.id >= today);
    const paidJobs = todayJobs.filter(j => j.paymentStatus === 'paid');
    const printedJobs = todayJobs.filter(j => j.printed);
    const queueJobs = paidJobs.filter(j => !j.printed);
    
    // Calculate totals
    const totalPages = paidJobs.reduce((sum, j) => sum + j.pageCount, 0);
    const revenue = paidJobs.reduce((sum, j) => {
      return sum + (j.pageCount * (j.isColor ? 5 : 2));
    }, 0);
    
    // Calculate color ratio
    const colorJobs = paidJobs.filter(j => j.isColor).length;
    const colorRatio = paidJobs.length > 0 
      ? (colorJobs / paidJobs.length * 100).toFixed(1) 
      : 0;
    
    // Get latest ticket number (most recent job)
    let latestTicketNumber = 0;
    if (paidJobs.length > 0) {
      // Sort by ID (timestamp) to get most recent
      const sortedJobs = [...paidJobs].sort((a, b) => b.id - a.id);
      latestTicketNumber = sortedJobs[0].ticketNumber || 0;
    }
    
    // Determine printer status
    let printerStatus = 0; // 0=idle
    if (queueJobs.length > 0) {
      printerStatus = 1; // 1=printing
    }

    return {
      totalJobs: paidJobs.length,
      totalPages: totalPages,
      revenue: revenue,
      queueLength: queueJobs.length,
      colorRatio: parseFloat(colorRatio),
      latestTicketNumber: latestTicketNumber,  // Changed from avgPages
      printerStatus: printerStatus,
      paperStatus: 0 // Will be updated by Arduino if available
    };
  }

  /**
   * Start automatic periodic updates to ThingSpeak
   * @param {Function} getJobsFunction - Function that returns jobs array
   */
  startAutoUpdate(getJobsFunction) {
    if (!this.enabled) {
      console.log('ℹ️ ThingSpeak auto-update not started (not configured)');
      return;
    }
    
    console.log('☁️ ThingSpeak: Auto-update started (every 15 seconds)');
    console.log('   View your data: https://thingspeak.com/channels/' + this.CHANNEL_ID);
    
    // Send initial data
    const jobs = getJobsFunction();
    const metrics = this.calculateMetrics(jobs);
    this.sendData(metrics);
    
    // Set up periodic updates
    setInterval(() => {
      const jobs = getJobsFunction();
      const metrics = this.calculateMetrics(jobs);
      this.sendData(metrics);
    }, this.UPDATE_INTERVAL);
  }

  /**
   * Send a single update immediately (for testing)
   * @param {Function} getJobsFunction - Function that returns jobs array
   */
  async sendNow(getJobsFunction) {
    if (!this.enabled) {
      console.log('ℹ️ ThingSpeak not configured');
      return;
    }
    
    const jobs = getJobsFunction();
    const metrics = this.calculateMetrics(jobs);
    
    console.log('📊 Sending metrics to ThingSpeak:', metrics);
    await this.sendData(metrics);
  }
}

module.exports = new ThingSpeakIntegration();
