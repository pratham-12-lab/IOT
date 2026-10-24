# PrintBridge-PaaS - Complete Setup Instructions

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Dependencies Installation](#dependencies-installation)
3. [Environment Configuration](#environment-configuration)
4. [Arduino Setup](#arduino-setup)
5. [Running the Project](#running-the-project)
6. [Verification Steps](#verification-steps)
7. [Troubleshooting](#troubleshooting)

---

## 1. Prerequisites

Before starting, ensure you have the following installed:

### Software Requirements
- **Node.js**: Version 14.0.0 or higher
  - Download from: https://nodejs.org/
  - Verify installation: `node --version`
  
- **npm**: Usually comes with Node.js
  - Verify installation: `npm --version`

- **Arduino IDE**: Latest version
  - Download from: https://www.arduino.cc/en/software
  - Required for Arduino Uno R4 WiFi programming

- **HP LaserJet P1108 Driver**: 
  - Download from HP website
  - Ensure printer is connected via USB and working

### Hardware Requirements
- Arduino Uno R4 WiFi
- HP LaserJet Professional P1108 printer
- RGB LED (Common Cathode) + 220Ω resistors (3x)
- Active Buzzer
- IR Proximity Sensor (FC-51 or TCRT5000)
- 16x2 LCD Display (optional, HD44780 compatible)
- Jumper wires and breadboard
- USB cables for Arduino and printer

### Network Requirements
- 2.4 GHz WiFi network (Arduino R4 doesn't support 5 GHz)
- Stable internet connection
- WiFi SSID and password

---

## 2. Dependencies Installation

### Step 1: Navigate to Project Directory
```powershell
cd "c:\Users\prath\OneDrive\Desktop\IoT-Project\PrintBridge_PaaS"
```

### Step 2: Install Node.js Dependencies
```powershell
npm install
```

This will install the following packages:
- **express** (^4.18.2) - Web framework for Node.js
- **cloudinary** (^1.41.0) - Cloud storage and CDN
- **dotenv** (^16.3.1) - Environment variable loader
- **pdf-parse** (^1.1.1) - PDF page counting
- **pdfkit** (^0.13.0) - Image to PDF conversion
- **uuid** (^9.0.1) - Payment ID generation
- **axios** (^1.6.2) - HTTP client for API calls
- **cors** (^2.8.5) - Cross-origin resource sharing

### Step 3: Install Development Dependencies (Optional)
```powershell
npm install --save-dev nodemon
```

This installs:
- **nodemon** (^3.0.2) - Auto-restart server on file changes

### Step 4: Verify Installation
```powershell
npm list --depth=0
```

Expected output:
```
printbridge-paas@1.0.0
├── axios@1.6.2
├── cloudinary@1.41.0
├── cors@2.8.5
├── dotenv@16.3.1
├── express@4.18.2
├── pdf-parse@1.1.1
├── pdfkit@0.13.0
└── uuid@9.0.1
```

---

## 3. Environment Configuration

### Step 1: Get Cloudinary Credentials

1. **Sign up for Cloudinary** (Free Tier)
   - Go to: https://cloudinary.com/users/register/free
   - Sign up with email/Google/GitHub

2. **Get API Credentials**
   - After login, go to Dashboard: https://console.cloudinary.com/
   - You'll see:
     - **Cloud Name**: e.g., `dxxx1234`
     - **API Key**: e.g., `123456789012345`
     - **API Secret**: e.g., `ABCdef123456GHIjkl789`
   - Copy these values

### Step 2: Get ThingSpeak Credentials

1. **Sign up for ThingSpeak** (Free Account)
   - Go to: https://thingspeak.com/login
   - Sign up with MathWorks account

2. **Create a New Channel**
   - Click "Channels" → "New Channel"
   - **Name**: PrintBridge Analytics
   - **Description**: IoT Cloud Printing Metrics
   
3. **Configure Fields** (Important!):
   - Field 1: `Total Jobs Today`
   - Field 2: `Total Pages Printed`
   - Field 3: `Revenue (INR)`
   - Field 4: `Queue Length`
   - Field 5: `Color Ratio (%)`
   - Field 6: `Latest Ticket Number`
   - Field 7: `Printer Status`
   - Field 8: `Paper Status`
   
4. **Save Channel** and go to **API Keys** tab

5. **Copy Credentials**:
   - **Write API Key**: e.g., `ABCDEFGHIJKLMNOP`
   - **Channel ID**: e.g., `3373847` (shown at top of page)

### Step 3: Configure .env File

The `.env` file has been created at:
```
c:\Users\prath\OneDrive\Desktop\IoT-Project\PrintBridge_PaaS\.env
```

**Edit the file** and replace placeholder values:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here    # Replace with your cloud name
CLOUDINARY_API_KEY=your_api_key_here          # Replace with your API key
CLOUDINARY_API_SECRET=your_api_secret_here    # Replace with your API secret

# ThingSpeak Configuration
THINGSPEAK_WRITE_KEY=your_write_api_key_here  # Replace with your write key
THINGSPEAK_CHANNEL_ID=your_channel_id_here    # Replace with your channel ID

# Server Configuration
PORT=5000
NODE_ENV=development
DEMO_MODE=false
```

### Step 4: Verify Environment Setup

Run the server temporarily to check configuration:
```powershell
node server/index.js
```

You should see:
```
🔧 Environment check:
  Cloudinary Cloud Name: ✓ Set
  Cloudinary API Key: ✓ Set
  Cloudinary API Secret: ✓ Set
  ThingSpeak Write Key: ✓ Set
  ThingSpeak Channel ID: ✓ Set
  Server Port: 5000

✓ Server running on port 5000
✓ Environment: development
✓ Ready to accept connections

☁️ ThingSpeak integration enabled
   Channel ID: 3373847
   View live: https://thingspeak.com/channels/3373847
```

Press `Ctrl+C` to stop the server.

---

## 4. Arduino Setup

### Step 1: Install Arduino IDE
- Download from: https://www.arduino.cc/en/software
- Install latest version (2.x recommended)

### Step 2: Add Arduino R4 Board Support
1. Open Arduino IDE
2. Go to **Tools** → **Board** → **Boards Manager**
3. Search for "Arduino UNO R4"
4. Install "Arduino UNO R4 Boards" by Arduino
5. Wait for installation to complete

### Step 3: Install Required Libraries
1. Go to **Tools** → **Manage Libraries**
2. Search and install:
   - **WiFiS3** (usually pre-installed with R4 board)
   - **ArduinoJson** (by Benoit Blanchon)
   - **LiquidCrystal** (by Arduino, for LCD - optional)

### Step 4: Hardware Wiring

#### Basic Setup (Required)
| Component | Arduino Pin | Notes |
|-----------|-------------|-------|
| Buzzer (+) | Pin 2 | (-) to GND |
| RGB LED Blue | Pin 3 | Via 220Ω resistor |
| RGB LED Green | Pin 5 | Via 220Ω resistor |
| RGB LED Red | Pin 6 | Via 220Ω resistor |
| RGB LED Common | GND | Common Cathode |
| IR Sensor VCC | 5V | |
| IR Sensor GND | GND | |
| IR Sensor OUT | A0 | |

#### Optional LCD Display (16x2)
| LCD Pin | Arduino Pin |
|---------|-------------|
| RS | Pin 12 |
| E | Pin 11 |
| D4 | Pin 10 |
| D5 | Pin 9 |
| D6 | Pin 8 |
| D7 | Pin 7 |
| VSS | GND |
| VDD | 5V |
| RW | GND |
| V0 | Potentiometer (10kΩ) |
| A (LED+) | 5V via 220Ω |
| K (LED-) | GND |

### Step 5: Configure Arduino Code

Open: `PrintBridge_PaaS/arduino/PrintBridge_A4_Printer.ino`

Update these values:

```cpp
// WiFi Configuration
const char* WIFI_SSID = "Your_WiFi_Name";        // Change to your WiFi SSID
const char* WIFI_PASSWORD = "Your_WiFi_Password"; // Change to your WiFi password

// Server Configuration (for local testing)
const char* SERVER_HOST = "localhost";  // Change to your computer's IP
const int SERVER_PORT = 5000;           // HTTP port

// OR for production (Render deployment)
// const char* SERVER_HOST = "printbridge-by-vps.onrender.com";
// const int SERVER_PORT = 443;  // HTTPS port
```

**Important Notes:**
- Arduino R4 WiFi only supports **2.4 GHz** networks
- Do NOT include `https://` in `SERVER_HOST`
- For local testing, use your computer's local IP (e.g., `192.168.1.100`)
- For production, use the deployed URL hostname only

### Step 6: Upload Arduino Code

1. Connect Arduino Uno R4 WiFi via USB
2. Select **Tools** → **Board** → **Arduino UNO R4 WiFi**
3. Select **Tools** → **Port** → (select the correct COM port)
4. Click **Upload** button (→)
5. Wait for upload to complete

### Step 7: Test Arduino Connection

1. Open **Tools** → **Serial Monitor**
2. Set baud rate to **115200**
3. You should see:
   ```
   ╔════════════════════════════════════════╗
   ║    PRINTBRIDGE-PAAS - ARDUINO R4 WIFI   ║
   ║         Printer as a Service            ║
   ╚════════════════════════════════════════╝
   
   🔧 Connecting to WiFi: Your_WiFi_Name
   ✓ WiFi connected!
   📶 IP Address: 192.168.1.150
   📡 Signal Strength: -45 dBm (Excellent)
   
   🌐 Server: localhost:5000
   ⏱ Poll Interval: 5 seconds
   
   🟢 STATUS: IDLE - Waiting for jobs...
   ```

---

## 5. Running the Project

### Method 1: Manual Start (Recommended for First Run)

#### Terminal 1: Start Cloud Server
```powershell
cd "c:\Users\prath\OneDrive\Desktop\IoT-Project\PrintBridge_PaaS"
node server/index.js
```

#### Terminal 2: Start Printer Agent
```powershell
cd "c:\Users\prath\OneDrive\Desktop\IoT-Project\PrintBridge_PaaS\printer-agent"
node agent.js
```

#### Terminal 3: Monitor Arduino (Optional)
- Open Arduino IDE
- Open Serial Monitor (Tools → Serial Monitor)
- Set baud rate to 115200

### Method 2: Using npm Scripts

```powershell
# Start server
npm start

# Or with auto-reload (development)
npm run dev

# Start printer agent (in new terminal)
npm run printer-agent
```

### Method 3: Background Processes (Advanced)

Use PowerShell background jobs:

```powershell
# Start server in background
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\prath\OneDrive\Desktop\IoT-Project\PrintBridge_PaaS'; node server/index.js"

# Start printer agent in background
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\prath\OneDrive\Desktop\IoT-Project\PrintBridge_PaaS\printer-agent'; node agent.js"
```

---

## 6. Verification Steps

### Step 1: Check Server Status
1. Open browser
2. Go to: http://localhost:5000
3. You should see the Customer Portal

### Step 2: Test Customer Upload
1. Visit: http://localhost:5000/customer.html
2. Enter Password of the Day: `2323` (default)
3. Click "Upload PDF"
4. Select a test PDF file
5. Verify:
   - Page count is detected
   - Job ID is generated
   - Price is calculated correctly

### Step 3: Test Payment Processing
1. Select print options (B&W/Color)
2. Choose number of copies (1-10)
3. Enter email address
4. Click "Process Payment"
5. Verify:
   - Receipt is generated
   - Ticket number is assigned
   - Job appears in admin panel

### Step 4: Test Arduino Detection
1. Check Arduino Serial Monitor
2. You should see (within 5 seconds):
   ```
   ╔════════════════════════════════════════╗
   ║          NEW PRINT JOB DETECTED         ║
   ╚════════════════════════════════════════╝
   📝 Ticket #1000
   💰 Payment ID: PAY-1234-ABCD-5678
   📄 Job ID: 1736678400000
   ```

### Step 5: Test Printer Agent
1. Check printer agent terminal
2. You should see:
   ```
   📥 Downloading: job_1736678400000.pdf
   ✓ Downloaded to: downloads/job_1736678400000.pdf
   🖨️ Printing: job_1736678400000.pdf
   ✓ Print command sent to: HP LaserJet Professional P1108
   ✓ Job marked as printed on server
   ```

### Step 6: Verify Printing
1. Check printer output tray
2. Verify printed document matches uploaded file
3. Verify number of copies is correct

### Step 7: Check ThingSpeak Analytics
1. Visit: http://localhost:5000/thingspeak-customer.html
2. Or go directly to: https://thingspeak.com/channels/YOUR_CHANNEL_ID
3. Verify data is being updated every 15 seconds:
   - Total Jobs increases
   - Pages Printed increases
   - Revenue increases
   - Queue Length shows pending jobs

### Step 8: Test Admin Panel
1. Visit: http://localhost:5000/index.html
2. Enter Admin Access Code: `2323`
3. Verify:
   - All jobs are listed
   - Job status is correct
   - Can approve/delete jobs
   - Shop status can be toggled

---

## 7. Troubleshooting

### Issue: npm install fails

**Solution 1:** Clear npm cache
```powershell
npm cache clean --force
npm install
```

**Solution 2:** Delete node_modules and reinstall
```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

**Solution 3:** Use different npm registry
```powershell
npm install --registry https://registry.npmmirror.com
```

### Issue: Server says environment variables missing

**Check:**
1. `.env` file exists in `PrintBridge_PaaS/` directory
2. No typos in variable names
3. No spaces around `=` sign
4. Values are properly filled in

**Verify:**
```powershell
Get-Content .env
```

### Issue: Arduino can't connect to WiFi

**Solutions:**
1. Verify WiFi is 2.4 GHz (not 5 GHz)
2. Check SSID and password spelling
3. Ensure special characters in password are escaped
4. Try moving Arduino closer to router
5. Check if WiFi network is hidden (Arduino may not support)

### Issue: Arduino can't reach server

**For Local Testing:**
1. Find your computer's IP address:
   ```powershell
   ipconfig
   ```
   Look for "IPv4 Address" under your active network adapter

2. Update Arduino code:
   ```cpp
   const char* SERVER_HOST = "192.168.1.XXX";  // Your IP
   const int SERVER_PORT = 5000;
   ```

3. Ensure Windows Firewall allows port 5000:
   ```powershell
   New-NetFirewallRule -DisplayName "PrintBridge Server" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
   ```

### Issue: Printer agent can't find printer

**Solutions:**
1. Check printer is powered on and connected
2. Verify printer name:
   ```powershell
   Get-Printer | Select-Object Name
   ```
3. Update `printer-agent/config.js` with exact printer name
4. Reinstall printer drivers if needed

### Issue: PDF download fails

**Check:**
1. Internet connection is working
2. Cloudinary credentials are correct
3. File was actually uploaded (check Cloudinary dashboard)
4. Firewall isn't blocking downloads

### Issue: ThingSpeak not updating

**Solutions:**
1. Verify ThingSpeak credentials in `.env`
2. Check ThingSpeak channel is public or you're logged in
3. Ensure update interval is at least 15 seconds (free tier limit)
4. Check server logs for ThingSpeak errors

### Issue: Port 5000 already in use

**Solution 1:** Change port in `.env`
```env
PORT=5001
```

**Solution 2:** Find and kill process using port 5000
```powershell
# Find process
Get-NetTCPConnection -LocalPort 5000 | Select-Object OwningProcess

# Kill process (replace PID)
Stop-Process -Id PID -Force
```

---

## 📦 Complete Dependency List

### Production Dependencies (Required)
| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.18.2 | Web server framework |
| cloudinary | ^1.41.0 | Cloud file storage |
| dotenv | ^16.3.1 | Environment variables |
| pdf-parse | ^1.1.1 | PDF page counting |
| pdfkit | ^0.13.0 | Image to PDF conversion |
| uuid | ^9.0.1 | Unique ID generation |
| axios | ^1.6.2 | HTTP client |
| cors | ^2.8.5 | CORS middleware |

### Development Dependencies (Optional)
| Package | Version | Purpose |
|---------|---------|---------|
| nodemon | ^3.0.2 | Auto-restart on changes |

### Arduino Libraries (Required)
| Library | Purpose |
|---------|---------|
| WiFiS3 | WiFi connectivity (pre-installed) |
| ArduinoJson | JSON parsing |
| LiquidCrystal | LCD display (optional) |

---

## ✅ Setup Checklist

Before running the project, ensure:

- [ ] Node.js (v14+) installed
- [ ] npm installed
- [ ] Arduino IDE installed
- [ ] Arduino R4 board support added
- [ ] HP LaserJet P1108 driver installed
- [ ] All npm dependencies installed (`npm install`)
- [ ] `.env` file created and configured
- [ ] Cloudinary account created and credentials added
- [ ] ThingSpeak channel created and API keys added
- [ ] Arduino libraries installed (ArduinoJson, LiquidCrystal)
- [ ] Arduino hardware wired correctly
- [ ] Arduino code configured with WiFi credentials
- [ ] Arduino code uploaded successfully
- [ ] Printer agent config updated with server URL
- [ ] Printer agent config has correct printer name
- [ ] Firewall allows port 5000 (if needed)
- [ ] Server starts without errors
- [ ] Printer agent starts without errors
- [ ] Arduino connects to WiFi
- [ ] Arduino connects to server
- [ ] End-to-end test completed successfully

---

## 🎯 Quick Start Commands

Once everything is configured:

```powershell
# Navigate to project
cd "c:\Users\prath\OneDrive\Desktop\IoT-Project\PrintBridge_PaaS"

# Terminal 1: Start server
node server/index.js

# Terminal 2: Start printer agent
node printer-agent/agent.js

# Terminal 3: Monitor Arduino (Arduino IDE Serial Monitor at 115200 baud)
```

Access at: **http://localhost:5000**

---

## 📚 Additional Resources

- **Arduino Documentation**: https://docs.arduino.cc/hardware/uno-r4-wifi
- **Cloudinary Docs**: https://cloudinary.com/documentation
- **ThingSpeak Docs**: https://www.mathworks.com/help/thingspeak/
- **Express.js Guide**: https://expressjs.com/en/guide/routing.html
- **Project README**: See `README.md` for architecture details

---

## 🆘 Getting Help

If you encounter issues:

1. Check the Troubleshooting section above
2. Review server logs for error messages
3. Check Arduino Serial Monitor for connection issues
4. Verify all credentials are correct in `.env`
5. Ensure all dependencies are installed

---

**Setup created by Team VPS for IoT Expo 2026**

Last Updated: January 2026
