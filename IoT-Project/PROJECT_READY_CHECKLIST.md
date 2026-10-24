# PrintBridge-PaaS - Project Ready Checklist

## 🎯 Complete Setup Verification

Use this checklist to ensure everything is properly configured before running the project.

---

## ✅ Installation Complete

### Files Created
- [x] `.env` file created in `PrintBridge_PaaS/`
- [x] `SETUP_INSTRUCTIONS.md` - Detailed setup guide
- [x] `QUICK_START.md` - Fast setup reference
- [x] `install-dependencies.ps1` - Automated installer
- [x] `PROJECT_READY_CHECKLIST.md` - This file

---

## 📋 Pre-Flight Checklist

### 1. Software Prerequisites
- [ ] Node.js (v14+) installed
  - Verify: `node --version`
  - Should show: v14.0.0 or higher
  
- [ ] npm installed
  - Verify: `npm --version`
  - Should show: 6.0.0 or higher
  
- [ ] Arduino IDE installed
  - Download: https://www.arduino.cc/en/software
  
- [ ] HP LaserJet P1108 drivers installed
  - Check: Printer appears in Windows Printers list

### 2. Node.js Dependencies
- [ ] Run: `cd PrintBridge_PaaS`
- [ ] Run: `npm install`
- [ ] Verify all packages installed:
  - express
  - cloudinary
  - dotenv
  - pdf-parse
  - pdfkit
  - uuid
  - axios
  - cors

**Quick verify command:**
```powershell
npm list --depth=0
```

### 3. Cloud Services Setup

#### Cloudinary
- [ ] Signed up at: https://cloudinary.com/users/register/free
- [ ] Got Cloud Name from dashboard
- [ ] Got API Key from dashboard
- [ ] Got API Secret from dashboard
- [ ] Added to `.env` file:
  ```
  CLOUDINARY_CLOUD_NAME=your_cloud_name
  CLOUDINARY_API_KEY=your_api_key
  CLOUDINARY_API_SECRET=your_api_secret
  ```

#### ThingSpeak
- [ ] Signed up at: https://thingspeak.com/login
- [ ] Created new channel: "PrintBridge Analytics"
- [ ] Configured 8 fields:
  - Field 1: Total Jobs Today
  - Field 2: Total Pages Printed
  - Field 3: Revenue (INR)
  - Field 4: Queue Length
  - Field 5: Color Ratio (%)
  - Field 6: Latest Ticket Number
  - Field 7: Printer Status
  - Field 8: Paper Status
- [ ] Got Write API Key
- [ ] Got Channel ID
- [ ] Added to `.env` file:
  ```
  THINGSPEAK_WRITE_KEY=your_write_key
  THINGSPEAK_CHANNEL_ID=your_channel_id
  ```

### 4. Arduino Setup

#### Hardware Wiring
- [ ] Arduino Uno R4 WiFi available
- [ ] RGB LED connected (Pins 3, 5, 6)
- [ ] Buzzer connected (Pin 2)
- [ ] IR Proximity Sensor connected (Pin A0)
- [ ] Optional: 16x2 LCD connected (Pins 7-12)
- [ ] All components powered and tested

#### Arduino IDE Configuration
- [ ] Arduino IDE installed
- [ ] Arduino UNO R4 Boards support added
- [ ] ArduinoJson library installed
- [ ] LiquidCrystal library installed (if using LCD)

#### Arduino Code Configuration
- [ ] Opened: `arduino/PrintBridge_A4_Printer.ino`
- [ ] Updated WiFi SSID: `const char* WIFI_SSID = "Your_WiFi_Name";`
- [ ] Updated WiFi Password: `const char* WIFI_PASSWORD = "Your_Password";`
- [ ] Updated Server Host:
  - For local: `const char* SERVER_HOST = "192.168.1.XXX";` (your IP)
  - For production: `const char* SERVER_HOST = "printbridge-by-vps.onrender.com";`
- [ ] Updated Server Port:
  - For local HTTP: `const int SERVER_PORT = 5000;`
  - For production HTTPS: `const int SERVER_PORT = 443;`
- [ ] Arduino code uploaded successfully
- [ ] Serial Monitor shows WiFi connected
- [ ] Serial Monitor shows server connection successful

**Get your IP address:**
```powershell
ipconfig
```
Look for "IPv4 Address" under your active network adapter.

### 5. Printer Agent Configuration
- [ ] Opened: `printer-agent/config.js`
- [ ] Updated SERVER_URL:
  - For local: `SERVER_URL: 'http://localhost:5000'`
  - For production: `SERVER_URL: 'https://printbridge-by-vps.onrender.com'`
- [ ] Updated PRINTER_NAME with exact name from Windows
  ```powershell
  Get-Printer | Select-Object Name
  ```
- [ ] Example: `PRINTER_NAME: 'HP LaserJet Professional P1108'`

### 6. Network Configuration
- [ ] WiFi is 2.4 GHz (Arduino R4 requirement)
- [ ] Router allows device-to-device communication
- [ ] Windows Firewall allows port 5000 (for local testing)
  ```powershell
  New-NetFirewallRule -DisplayName "PrintBridge Server" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
  ```

### 7. Hardware Connections
- [ ] Arduino connected via USB
- [ ] HP LaserJet P1108 connected via USB
- [ ] HP LaserJet P1108 powered on
- [ ] Printer has paper loaded
- [ ] Printer shows ready status (not error lights)

---

## 🚀 Launch Sequence

### Pre-Launch Verification
- [ ] All checklist items above completed
- [ ] `.env` file configured with all credentials
- [ ] Arduino connected and showing "IDLE" status
- [ ] Printer powered on and ready

### Terminal 1: Start Cloud Server
```powershell
cd "c:\Users\prath\OneDrive\Desktop\IoT-Project\PrintBridge_PaaS"
node server/index.js
```

**Expected output:**
```
✓ Server running on port 5000
✓ Environment: development
✓ Ready to accept connections

☁️ ThingSpeak integration enabled
   Channel ID: YOUR_CHANNEL_ID
```

- [ ] Server started without errors
- [ ] All environment variables show "✓ Set"
- [ ] ThingSpeak integration enabled

### Terminal 2: Start Printer Agent
```powershell
cd "c:\Users\prath\OneDrive\Desktop\IoT-Project\PrintBridge_PaaS\printer-agent"
node agent.js
```

**Expected output:**
```
✓ Printer Agent Started
📡 Polling: http://localhost:5000
🖨️ Target Printer: HP LaserJet Professional P1108
⏱️ Checking every 5 seconds...
```

- [ ] Printer agent started without errors
- [ ] Printer name detected correctly
- [ ] Polling server successfully

### Terminal 3: Monitor Arduino (Optional)
- [ ] Arduino IDE opened
- [ ] Serial Monitor opened (Tools → Serial Monitor)
- [ ] Baud rate set to 115200
- [ ] Arduino shows:
  ```
  ✓ WiFi connected!
  📶 IP Address: 192.168.1.XXX
  🟢 STATUS: IDLE - Waiting for jobs...
  ```

---

## 🧪 End-to-End Test

### Test 1: Web Portal Access
- [ ] Open browser: http://localhost:5000
- [ ] Customer portal loads successfully
- [ ] No console errors (F12 Developer Tools)

### Test 2: Document Upload
- [ ] Enter Password of the Day: `2323`
- [ ] Click "Upload PDF"
- [ ] Select a test PDF file
- [ ] Upload completes successfully
- [ ] Page count detected correctly
- [ ] Job ID displayed

### Test 3: Payment Processing
- [ ] Select print mode (B&W or Color)
- [ ] Choose number of copies (1-10)
- [ ] Price calculated correctly
- [ ] Enter email address
- [ ] Click "Process Payment"
- [ ] Receipt generated successfully
- [ ] Ticket number assigned
- [ ] Receipt shows correct details

### Test 4: Arduino Detection
**Within 5 seconds, Arduino Serial Monitor should show:**
- [ ] Banner: "NEW PRINT JOB DETECTED"
- [ ] Ticket number displayed
- [ ] Payment ID shown
- [ ] Job ID shown
- [ ] RGB LED turns BLUE (printing)

### Test 5: Printer Agent Processing
**Printer agent terminal should show:**
- [ ] "NEW PAID JOB FOUND!"
- [ ] Downloading PDF from Cloudinary
- [ ] PDF downloaded successfully
- [ ] Sending to printer
- [ ] Print command sent successfully
- [ ] Job marked as printed on server

### Test 6: Physical Printing
- [ ] Printer receives print job
- [ ] Document prints successfully
- [ ] Correct number of pages
- [ ] Correct number of copies
- [ ] Print quality is good

### Test 7: Job Completion
- [ ] Arduino Serial Monitor shows "COMPLETE"
- [ ] RGB LED turns YELLOW (waiting for paper collection)
- [ ] IR sensor detects paper in tray
- [ ] Buzzer beeps reminder
- [ ] After paper removal, LED turns GREEN (ready)

### Test 8: Admin Panel
- [ ] Visit: http://localhost:5000/index.html
- [ ] Enter Admin Access Code: `2323`
- [ ] All jobs listed correctly
- [ ] Job status shows "printed: true"
- [ ] Ticket number displayed
- [ ] Payment status correct

### Test 9: Analytics Dashboard
- [ ] Visit: http://localhost:5000/thingspeak-customer.html
- [ ] ThingSpeak iframe loads
- [ ] Data updated (may take 15 seconds)
- [ ] Charts show:
  - Total Jobs increased
  - Pages Printed increased
  - Revenue increased
  - Latest Ticket Number shown

---

## 🎊 Success Criteria

All items below should be TRUE:

- [ ] Server starts without errors
- [ ] Printer agent starts without errors
- [ ] Arduino connects to WiFi
- [ ] Arduino connects to server
- [ ] Can upload PDF files
- [ ] Page count detected automatically
- [ ] Payment processing works
- [ ] Receipt generated correctly
- [ ] Arduino detects paid jobs within 5 seconds
- [ ] Printer agent downloads PDFs
- [ ] Physical printer prints successfully
- [ ] Correct number of copies printed
- [ ] Job marked as printed on server
- [ ] ThingSpeak analytics updating
- [ ] Admin panel shows all jobs
- [ ] No error messages in any component

---

## 🔴 Troubleshooting Reference

### If server won't start:
→ Check `.env` file exists and has all credentials
→ Run: `npm install` again
→ Check if port 5000 is already in use

### If Arduino won't connect to WiFi:
→ Verify WiFi is 2.4 GHz (not 5 GHz)
→ Check SSID and password spelling
→ Move Arduino closer to router

### If Arduino can't reach server:
→ Use computer's IP address (not localhost)
→ Check Windows Firewall allows port 5000
→ Verify server is running

### If printer agent can't find printer:
→ Run: `Get-Printer | Select-Object Name`
→ Update `printer-agent/config.js` with exact name
→ Check printer is powered on and connected

### If nothing prints:
→ Check printer has paper
→ Verify printer drivers installed
→ Check printer is not in error state
→ Look for error messages in printer agent terminal

---

## 📚 Documentation Files

All documentation is available in the project:

| File | Purpose |
|------|---------|
| `QUICK_START.md` | 5-minute quick start guide |
| `SETUP_INSTRUCTIONS.md` | Detailed step-by-step setup |
| `PROJECT_READY_CHECKLIST.md` | This comprehensive checklist |
| `README.md` | Complete project documentation |
| `COMPLETE_IOT_EXPO.txt` | Full system documentation |

---

## ✅ Final Verification

Before demo/production use:

- [ ] All checklist items marked as complete
- [ ] End-to-end test completed successfully
- [ ] No error messages in any component
- [ ] All hardware functioning correctly
- [ ] Backup of `.env` file saved securely
- [ ] Backup of configuration files saved
- [ ] Test PDF files prepared for demo
- [ ] Admin access code noted: `2323`
- [ ] Password of the day noted: `2323`

---

## 🎯 You're Ready!

If all items above are checked, your PrintBridge-PaaS system is fully operational and ready for use!

**Quick Start Commands:**
```powershell
# Terminal 1
cd "c:\Users\prath\OneDrive\Desktop\IoT-Project\PrintBridge_PaaS"
node server/index.js

# Terminal 2
cd "c:\Users\prath\OneDrive\Desktop\IoT-Project\PrintBridge_PaaS\printer-agent"
node agent.js
```

**Access:** http://localhost:5000

---

**Checklist by Team VPS for IoT Expo 2026**
