/**
 * Keep-Alive Service for Render Free Tier
 * Prevents server from sleeping by self-pinging
 */

const axios = require('axios');

class KeepAlive {
  constructor(url, interval = 14 * 60 * 1000) { // 14 minutes
    this.url = url;
    this.interval = interval;
    this.enabled = process.env.ENABLE_KEEP_ALIVE === 'true';
  }

  start() {
    if (!this.enabled) {
      console.log('ℹ️  Keep-Alive: Disabled (set ENABLE_KEEP_ALIVE=true to enable)');
      return;
    }

    console.log('🔄 Keep-Alive: Enabled');
    console.log(`   Pinging ${this.url} every ${this.interval / 60000} minutes`);

    // Ping immediately
    this.ping();

    // Set up periodic pings
    setInterval(() => {
      this.ping();
    }, this.interval);
  }

  async ping() {
    try {
      const response = await axios.get(this.url, { timeout: 10000 });
      console.log(`🔄 Keep-Alive: Pinged successfully (${response.status})`);
    } catch (error) {
      console.log(`⚠️  Keep-Alive: Ping failed (${error.message})`);
    }
  }
}

module.exports = KeepAlive;
