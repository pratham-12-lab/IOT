# 🚀 PrintBridge-PaaS - START HERE

## Welcome to PrintBridge-PaaS!

This is your **complete IoT cloud printing system**. Everything is set up and ready for configuration.

---

## 📚 Quick Navigation

Choose your path:

### 🏃 I Want to Get Started Fast (5 minutes)
→ Read: **QUICK_START.md**

### 📖 I Want Detailed Instructions
→ Read: **SETUP_INSTRUCTIONS.md**

### ✅ I Want to Verify Everything is Ready
→ Use: **PROJECT_READY_CHECKLIST.md**

### 🔑 I Need to Know What Credentials I Need
→ Check: **CREDENTIALS_AND_DEPENDENCIES.md**

### 🎯 I Want to Understand the Full System
→ Read: **README.md** or **COMPLETE_IOT_EXPO.txt**

---

## 🎯 What Has Been Done

### ✅ Files Created for You

1. **`.env`** file in `PrintBridge_PaaS/`
   - Template with all required environment variables
   - You need to fill in your credentials

2. **SETUP_INSTRUCTIONS.md**
   - Complete step-by-step setup guide
   - Troubleshooting section included

3. **QUICK_START.md**
   - Fast 5-minute setup reference
   - Essential commands only

4. **PROJECT_READY_CHECKLIST.md**
   - Comprehensive verification checklist
   - Pre-flight checks before running

5. **CREDENTIALS_AND_DEPENDENCIES.md**
   - All credentials needed in one place
   - Complete dependency list
   - Configuration reference

6. **install-dependencies.ps1**
   - Automated PowerShell installer
   - Checks and installs everything

---

## 🚦 Your Next Steps

### Step 1: Install Node.js Dependencies (2 minutes)

**Option A: Automated (Recommended)**
```powershell
cd "c:\Users\prath\OneDrive\Desktop\IoT-Project\PrintBridge_PaaS"
.\install-dependencies.ps1
```

**Option B: Manual**
```powershell
cd "c:\Users\prath\OneDrive\Desktop\IoT-Project\PrintBridge_PaaS"
npm install
```

### Step 2: Get Cloud Service Credentials (5 minutes)

#### Cloudinary (Cloud Storage)
1. Sign up: https://cloudinary.com/users/register/free
2. Get from dashboard: Cloud Name, API Key, API Secret
3. Add to `.env` file

#### ThingSpeak (Analytics)
1. Sign up: https://thingspeak.com/login
2. Create channel with 8 fields (see CREDENTIALS_AND_DEPENDENCIES.md)
3. Get: Write API Key, Channel ID
4. Add to `.env` file

### Step 3: Configure Arduino (5 minutes)

1. Edit: `PrintBridge_PaaS/arduino/PrintBridge_A4_Printer.ino`
2. Update WiFi SSID and password
3. Update server host (your computer's IP from `ipconfig`)
4. Upload to Arduino Uno R4 WiFi

### Step 4: Configure Printer Agent (2 minutes)

1. Find printer name: `Get-Printer | Select-Object Name`
2. Edit: `PrintBridge_PaaS/printer-agent/config.js`
3. Update PRINTER_NAME with exact name

### Step 5: Run the System! (1 minute)

**Terminal 1:**
```powershell
cd "c:\Users\prath\OneDrive\Desktop\IoT-Project\PrintBridge_PaaS"
node server/index.js
```

**Terminal 2:**
```powershell
cd "c:\Users\prath\OneDrive\Desktop\IoT-Project\PrintBridge_PaaS\printer-agent"
node agent.js
```

**Terminal 3:** Arduino IDE → Serial Monitor (115200 baud)

**Browser:** http://localhost:5000

---

## 📦 What You Need

### Required to Get Started
- ✅ Node.js (v14+) - Install from https://nodejs.org/
- ✅ Cloudinary account (free) - Sign up at https://cloudinary.com/
- ✅ ThingSpeak account (free) - Sign up at https://thingspeak.com/
- ✅ WiFi network (2.4 GHz)

### Required Hardware
- Arduino Uno R4 WiFi
- HP LaserJet Professional P1108 printer
- RGB LED, Buzzer, IR Sensor
- USB cables

### All Dependencies
See **CREDENTIALS_AND_DEPENDENCIES.md** for complete list.

---

## 🎓 Project Structure

```
IoT-Project/
├── PrintBridge_PaaS/
│   ├── .env                    ← YOU NEED TO CONFIGURE THIS
│   ├── package.json            ← Dependency definitions
│   ├── server/                 ← Cloud server code
│   ├── ui/                     ← Web interface
│   ├── printer-agent/          ← Local printer controller
│   │   └── config.js          ← YOU NEED TO CONFIGURE THIS
│   └── arduino/                ← Arduino code
│       └── *.ino              ← YOU NEED TO CONFIGURE THIS
├── README.md                   ← Complete documentation
├── SETUP_INSTRUCTIONS.md       ← Detailed setup guide
├── QUICK_START.md              ← Fast setup reference
├── PROJECT_READY_CHECKLIST.md  ← Verification checklist
├── CREDENTIALS_AND_DEPENDENCIES.md ← All credentials needed
└── START_HERE.md               ← This file!
```

---

## 🔑 Default Credentials

| What | Value | Where to Change |
|------|-------|-----------------|
| Password of the Day | `2323` | `ui/customer.js` |
| Admin Access Code | `2323` | `ui/app.js` |

---

## 🆘 Need Help?

### Common Issues

**"npm install fails"**
→ Run: `npm cache clean --force` then `npm install` again

**"Arduino can't connect to WiFi"**
→ Make sure WiFi is 2.4 GHz (not 5 GHz)

**"Can't reach server from Arduino"**
→ Use your computer's IP (from `ipconfig`), not `localhost`

**"Printer not found"**
→ Run `Get-Printer | Select-Object Name` and use exact name

### Documentation

| Problem | Check This File |
|---------|----------------|
| Installation issues | SETUP_INSTRUCTIONS.md |
| Quick commands | QUICK_START.md |
| Missing credentials | CREDENTIALS_AND_DEPENDENCIES.md |
| Verification | PROJECT_READY_CHECKLIST.md |
| System architecture | README.md |

---

## 🎯 Success Indicators

You'll know it's working when:

✅ Server starts: `✓ Server running on port 5000`  
✅ Printer agent: `✓ Printer Agent Started`  
✅ Arduino: `✓ WiFi connected! 🟢 STATUS: IDLE`  
✅ Upload works: PDF uploads and page count detected  
✅ Payment works: Receipt generated with ticket number  
✅ Printing works: Document prints on HP LaserJet  

---

## 📊 Time Estimates

| Task | Time |
|------|------|
| Install dependencies | 2 minutes |
| Get Cloudinary credentials | 3 minutes |
| Get ThingSpeak credentials | 5 minutes |
| Configure .env file | 2 minutes |
| Configure Arduino | 5 minutes |
| Upload Arduino code | 2 minutes |
| Configure printer agent | 2 minutes |
| First test run | 2 minutes |
| **Total** | **~25 minutes** |

---

## 🎊 Ready to Begin?

1. **Start with automated installer:**
   ```powershell
   cd "c:\Users\prath\OneDrive\Desktop\IoT-Project\PrintBridge_PaaS"
   .\install-dependencies.ps1
   ```

2. **Follow the checklist:**
   Open **PROJECT_READY_CHECKLIST.md** and work through each item

3. **Or use quick start:**
   Open **QUICK_START.md** for minimal steps

---

## 📞 Project Info

**Team:** VPS  
**Project:** PrintBridge-PaaS (Printer as a Service)  
**Event:** IoT Expo 2026  
**Version:** 1.0.0  

**Live Demo:** https://printbridge-by-vps.onrender.com/  
**Demo Password:** `2323`

---

## ⭐ Features

- ☁️ Cloud-based document upload (Cloudinary)
- 💳 Online payment processing with receipts
- 🤖 Arduino IoT controller with independent verification
- 🖨️ Automatic printing on HP LaserJet P1108
- 📊 Real-time analytics via ThingSpeak
- 🎫 Ticket-based job tracking
- 📦 Multiple copies support (1-10)
- 💰 Dynamic pricing (₹2/page B&W, ₹5/page Color)

---

## 🚀 Let's Get Started!

Open **QUICK_START.md** for fastest setup, or **SETUP_INSTRUCTIONS.md** for detailed guidance.

**Good luck with your IoT project! 🎉**

---

*This guide was automatically generated to help you get started quickly.*
