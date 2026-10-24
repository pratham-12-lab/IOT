const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes');
const thingspeak = require('./thingspeak');
const { getJobs } = require('./jobs');
const KeepAlive = require('./keep-alive');

const app = express();

// Increase payload limit for PDF uploads
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

// Serve static files but disable directory listing
app.use(express.static(path.join(__dirname, '../ui'), {
  index: false,  // Disable automatic index.html serving
  dotfiles: 'deny',  // Deny access to dotfiles
  extensions: ['html', 'js', 'css']  // Only serve these file types
}));

// Define explicit routes for each page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../ui/customer.html'));  // Customer portal as homepage
});

app.get('/customer.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../ui/customer.html'));
});

app.get('/about.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../ui/about.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../ui/index.html'));
});

app.get('/approve-payments.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../ui/approve-payments.html'));
});

app.get('/thingspeak-admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../ui/thingspeak-admin.html'));
});

app.get('/thingspeak-customer.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../ui/thingspeak-customer.html'));
});

app.get('/architecture-live.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../ui/architecture-live.html'));
});

app.get('/architecture-live.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../ui/architecture-live.js'));
});

// Serve JavaScript files
app.get('/customer.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../ui/customer.js'));
});

app.get('/app.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../ui/app.js'));
});

// API routes
app.use('/api', routes);

// 404 handler - redirect to landing page
app.use((req, res) => {
  res.redirect('/');
});

const PORT = process.env.PORT || process.env.SERVER_PORT || 5000;   

console.log('🔧 Environment check:');
console.log('  Cloudinary Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME ? '✓ Set' : '✗ Missing');
console.log('  Cloudinary API Key:', process.env.CLOUDINARY_API_KEY ? '✓ Set' : '✗ Missing');
console.log('  Cloudinary API Secret:', process.env.CLOUDINARY_API_SECRET ? '✓ Set' : '✗ Missing');
console.log('  ThingSpeak Write Key:', process.env.THINGSPEAK_WRITE_KEY ? '✓ Set' : '✗ Missing');
console.log('  ThingSpeak Channel ID:', process.env.THINGSPEAK_CHANNEL_ID ? '✓ Set' : '✗ Missing');
console.log('  Server Port:', PORT);
console.log('  Body Parser Limit: 100mb');
console.log('');

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ Ready to accept connections`);
  console.log('');
  
  // Start ThingSpeak auto-updates
  thingspeak.startAutoUpdate(getJobs);
  
  // Start Keep-Alive service (for Render free tier)
  const serverUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  const keepAlive = new KeepAlive(serverUrl);
  keepAlive.start();
});
