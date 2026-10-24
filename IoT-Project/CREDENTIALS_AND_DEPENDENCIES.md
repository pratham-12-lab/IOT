# PrintBridge-PaaS - Complete Credentials & Dependencies Reference

## 📦 All Dependencies at a Glance

### Node.js Dependencies (Production)

Install with: `npm install`

| Package | Version | Purpose |
|---------|---------|---------|
| **express** | ^4.18.2 | Web server framework |
| **cloudinary** | ^1.41.0 | Cloud file storage and CDN |
| **dotenv** | ^16.3.1 | Environment variable management |
| **pdf-parse** | ^1.1.1 | PDF page counting and analysis |
| **pdfkit** | ^0.13.0 | Image to PDF conversion |
| **uuid** | ^9.0.1 | Unique ID and payment ID generation |
| **axios** | ^1.6.2 | HTTP client for API calls |
| **cors** | ^2.8.5 | Cross-Origin Resource Sharing middleware |

### Node.js Dependencies (Development - Optional)

| Package | Version | Purpose |
|---------|---------|---------|
| **nodemon** | ^3.0.2 | Auto-restart server on file changes |

### Arduino Libraries

Install via Arduino IDE Library Manager:

| Library | Purpose | Installation |
|---------|---------|--------------|
| **WiFiS3** | WiFi connectivity for R4 | Pre-installed with board |
| **ArduinoJson** | JSON parsing | Tools → Manage Libraries → Search "ArduinoJson" |
| **LiquidCrystal** | LCD display control | Tools → Manage Libraries → Search "LiquidCrystal" |

---

## 🔑 Required Credentials

### 1. Cloudinary (Cloud Storage)

**Sign Up:** https://cloudinary.com/users/register/free

**Get Credentials:** https://console.cloudinary.com/

**You need:**
```
Cloud Name:  [Found on dashboard main page]
API Key:     [Found on dashboard main page]
API Secret:  [Found on dashboard main page]
```

**Example values:**
```
Cloud Name:  dxxx1234
API Key:     123456789012345
API Secret:  ABCdef123456GHIjkl789
```

**Where to add:**
- File: `PrintBridge_PaaS/.env`
- Variables:
  ```env
  CLOUDINARY_CLOUD_NAME=your_cloud_name
  CLOUDINARY_API_KEY=your_api_key
  CLOUDINARY_API_SECRET=your_api_secret
  ```

---

### 2. ThingSpeak (IoT Analytics)

**Sign Up:** https://thingspeak.com/login

**Create Channel:** Channels → New Channel

**Channel Configuration:**
```
Name: PrintBridge Analytics
Description: IoT Cloud Printing Metrics

Field 1 Name: Total Jobs Today
Field 2 Name: Total Pages Printed
Field 3 Name: Revenue (INR)
Field 4 Name: Queue Length
Field 5 Name: Color Ratio (%)
Field 6 Name: Latest Ticket Number
Field 7 Name: Printer Status
Field 8 Name: Paper Status
```

**Get Credentials:**
- Go to channel → **API Keys** tab
- Copy:
  ```
  Write API Key: [16-character key]
  Channel ID:    [Shown at top of page]
  ```

**Example values:**
```
Write API Key: ABCDEFGHIJKLMNOP
Channel ID:    3373847
```

**Where to add:**
- File: `PrintBridge_PaaS/.env`
- Variables:
  ```env
  THINGSPEAK_WRITE_KEY=your_write_api_key
  THINGSPEAK_CHANNEL_ID=your_channel_id
  ```

---

### 3. WiFi Credentials (Arduino)

**You need:**
```
WiFi SSID:     Your network name
WiFi Password: Your network password
```

**Requirements:**
- Must be 2.4 GHz network (Arduino R4 doesn't support 5 GHz)
- WPA2 authentication supported
- Network should allow device-to-device communication

**Where to add:**
- File: `PrintBridge_PaaS/arduino/PrintBridge_A4_Printer.ino`
- Lines:
  ```cpp
  const char* WIFI_SSID = "Your_WiFi_Name";
  const char* WIFI_PASSWORD = "Your_WiFi_Password";
  ```

---

### 4. Server Configuration (Arduino)

**For Local Testing:**
```cpp
const char* SERVER_HOST = "192.168.1.XXX";  // Your computer's IP
const int SERVER_PORT = 5000;               // HTTP port
```

**Find your IP:**
```powershell
ipconfig
```
Look for "IPv4 Address" under your active network adapter (e.g., 192.168.1.100)

**For Production (Render):**
```cpp
const char* SERVER_HOST = "printbridge-by-vps.onrender.com";
const int SERVER_PORT = 443;  // HTTPS port
```

**Important:** Do NOT include `https://` in SERVER_HOST

**Where to add:**
- File: `PrintBridge_PaaS/arduino/PrintBridge_A4_Printer.ino`

---

### 5. Printer Configuration

**Find Printer Name:**
```powershell
Get-Printer | Select-Object Name
```

**Common names:**
```
HP LaserJet Professional P1108
HP LaserJet P1108
LaserJet P1108
```

**Where to add:**
- File: `PrintBridge_PaaS/printer-agent/config.js`
- Variable:
  ```javascript
  PRINTER_NAME: 'HP LaserJet Professional P1108'
  ```

**Important:** Use EXACT name from Get-Printer command

---

## 📝 Complete .env File Template

**Location:** `PrintBridge_PaaS/.env`

```env
# =====================================================================
# PrintBridge-PaaS Environment Configuration
# =====================================================================

# Cloudinary Configuration (Required)
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here

# ThingSpeak Configuration (Required)
THINGSPEAK_WRITE_KEY=your_write_api_key_here
THINGSPEAK_CHANNEL_ID=your_channel_id_here

# Server Configuration (Optional)
PORT=5000
NODE_ENV=development
DEMO_MODE=false
```

---

## 🔧 Configuration Files Summary

### File 1: `.env`
**Location:** `PrintBridge_PaaS/.env`
**Contains:**
- Cloudinary credentials
- ThingSpeak credentials
- Server port
- Environment mode

### File 2: `config.js`
**Location:** `PrintBridge_PaaS/printer-agent/config.js`
**Contains:**
- Server URL
- Printer name
- Polling interval
- Download directory

**Example:**
```javascript
module.exports = {
  SERVER_URL: 'http://localhost:5000',
  POLL_INTERVAL: 5000,
  PRINTER_NAME: 'HP LaserJet Professional P1108',
  DOWNLOAD_DIR: __dirname + '/downloads'
};
```

### File 3: `PrintBridge_A4_Printer.ino`
**Location:** `PrintBridge_PaaS/arduino/PrintBridge_A4_Printer.ino`
**Contains:**
- WiFi SSID
- WiFi password
- Server host
- Server port

**Example:**
```cpp
// WiFi Configuration
const char* WIFI_SSID = "Your_WiFi_Name";
const char* WIFI_PASSWORD = "Your_WiFi_Password";

// Server Configuration
const char* SERVER_HOST = "192.168.1.100";
const int SERVER_PORT = 5000;
```

---

## 🚀 Installation Commands

### 1. Install Node.js Dependencies
```powershell
cd "c:\Users\prath\OneDrive\Desktop\IoT-Project\PrintBridge_PaaS"
npm install
```

### 2. Verify Installation
```powershell
npm list --depth=0
```

### 3. Run Automated Installer (Recommended)
```powershell
cd "c:\Users\prath\OneDrive\Desktop\IoT-Project\PrintBridge_PaaS"
.\install-dependencies.ps1
```

---

## 📍 Port Configuration

### Server Ports

| Port | Protocol | Purpose | Configuration |
|------|----------|---------|---------------|
| 5000 | HTTP | Local development | `.env` → `PORT=5000` |
| 443 | HTTPS | Production (Render) | Arduino → `SERVER_PORT = 443` |

### Firewall Configuration (Windows)

**Allow port 5000 for local testing:**
```powershell
New-NetFirewallRule -DisplayName "PrintBridge Server" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
```

---

## 🔗 Important URLs

### Cloud Services
| Service | Purpose | URL |
|---------|---------|-----|
| Cloudinary Console | Get credentials | https://console.cloudinary.com/ |
| ThingSpeak | Create channel | https://thingspeak.com/ |
| Node.js Download | Install Node | https://nodejs.org/ |
| Arduino IDE | Install IDE | https://www.arduino.cc/en/software |

### Local Access (Development)
| Page | URL |
|------|-----|
| Customer Portal | http://localhost:5000/customer.html |
| Admin Dashboard | http://localhost:5000/index.html |
| About System | http://localhost:5000/about.html |
| ThingSpeak Analytics | http://localhost:5000/thingspeak-customer.html |
| Architecture Diagram | http://localhost:5000/architecture-live.html |

### Production (Live Demo)
| Page | URL |
|------|-----|
| Live System | https://printbridge-by-vps.onrender.com/ |
| Customer Portal | https://printbridge-by-vps.onrender.com/customer.html |
| ThingSpeak Channel | https://thingspeak.com/channels/3373847 |

---

## 🔒 Security Notes

### Never Commit to Git
These files contain sensitive credentials and should NEVER be committed to Git:
- `.env`
- `printed-jobs.json`
- Any files in `printer-agent/downloads/`

### .gitignore Configuration
Verify these are in `.gitignore`:
```
.env
node_modules/
printer-agent/downloads/
printer-agent/printed-jobs.json
*.log
```

### Password of the Day
**Default:** `2323`

**Change in:**
- `ui/customer.js` (customer portal)
- `ui/app.js` (admin panel)

### Admin Access Code
**Default:** `2323`

**Change in:**
- `ui/app.js`
- `ui/thingspeak-admin-login.js`

---

## 📊 System Requirements

### Minimum Hardware
- **Computer:** Intel i3 / AMD Ryzen 3 or higher
- **RAM:** 4 GB minimum, 8 GB recommended
- **Storage:** 1 GB free space
- **USB Ports:** 2 (Arduino + Printer)

### Software Requirements
- **OS:** Windows 10/11, macOS 10.14+, or Linux
- **Node.js:** v14.0.0 or higher
- **Arduino IDE:** Latest version (2.x recommended)
- **Browser:** Chrome, Firefox, Safari, or Edge (latest version)

### Network Requirements
- **WiFi:** 2.4 GHz network (for Arduino)
- **Speed:** 10 Mbps minimum
- **Type:** WPA2 authentication supported
- **Configuration:** Device-to-device communication allowed

---

## 🧪 Test Credentials

For testing without actual credentials:

### Demo Mode
Set in `.env`:
```env
DEMO_MODE=true
```

**Effects:**
- No actual uploads to Cloudinary
- Simulated PDF downloads
- Simulated printing
- All other features work normally

**Good for:**
- Testing without cloud accounts
- Demonstrating UI/UX
- Testing job queue logic
- Developing features

---

## 📞 Support Resources

### Documentation Files
1. **QUICK_START.md** - 5-minute setup
2. **SETUP_INSTRUCTIONS.md** - Detailed guide
3. **PROJECT_READY_CHECKLIST.md** - Verification checklist
4. **README.md** - Complete documentation
5. **COMPLETE_IOT_EXPO.txt** - Full system specs

### Common Commands
```powershell
# Start server
node server/index.js

# Start printer agent
node printer-agent/agent.js

# Install dependencies
npm install

# Check printer name
Get-Printer | Select-Object Name

# Find IP address
ipconfig

# Check Node version
node --version

# List installed packages
npm list --depth=0
```

---

## ✅ Quick Verification

**All credentials configured?**
- [ ] Cloudinary Cloud Name
- [ ] Cloudinary API Key
- [ ] Cloudinary API Secret
- [ ] ThingSpeak Write Key
- [ ] ThingSpeak Channel ID
- [ ] WiFi SSID
- [ ] WiFi Password
- [ ] Server Host (IP or domain)
- [ ] Printer Name

**All dependencies installed?**
- [ ] Node.js (v14+)
- [ ] npm packages (8 production)
- [ ] Arduino IDE
- [ ] Arduino libraries (2-3)
- [ ] Printer drivers

**All configurations done?**
- [ ] .env file
- [ ] printer-agent/config.js
- [ ] arduino/*.ino file

**Ready to run!** 🚀

---

**Complete reference by Team VPS for IoT Expo 2026**
