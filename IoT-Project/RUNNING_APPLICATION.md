# 🎉 PrintBridge-PaaS - Application Running

## ✅ Current Status: RUNNING

Your PrintBridge-PaaS application is now live and operational!

---

## 🌐 Access Your Application

### Customer Portal (Main Interface)
**URL:** http://localhost:5000/customer.html

**Password of the Day:** `2323`

**Features:**
- Upload PDF documents
- Select print options (B&W/Color)
- Choose number of copies (1-10)
- Process payments
- Get digital receipts with ticket numbers

### Admin Dashboard
**URL:** http://localhost:5000/index.html

**Admin Access Code:** `2323`

**Features:**
- View all print jobs
- Approve/reject payments
- Delete jobs
- Monitor job status
- Control shop status (open/closed)

### Live Analytics
**URL:** http://localhost:5000/thingspeak-customer.html

**Features:**
- Real-time ThingSpeak dashboard
- Total jobs and pages printed
- Revenue tracking
- Queue length monitoring
- Color printing ratio

### System Information
**URL:** http://localhost:5000/about.html

Complete workflow and system architecture documentation

### Interactive Architecture
**URL:** http://localhost:5000/architecture-live.html

Visual representation of system components

---

## 🔧 Running Services

### Service 1: Cloud Server
- **Status:** ✅ RUNNING
- **Port:** 5000
- **URL:** http://localhost:5000
- **Environment:** development
- **Cloudinary:** Connected ✓
- **ThingSpeak:** Connected ✓ (Channel: 3491976)

### Service 2: Printer Agent
- **Status:** ✅ RUNNING
- **Server:** http://localhost:5000
- **Printer:** Microsoft Print to PDF
- **Polling:** Every 5 seconds
- **Demo Mode:** Disabled

---

## 📊 Service Management

### View Server Logs
The server output is being captured. Check Kiro's terminal output for real-time logs.

### View Printer Agent Logs
The printer agent output is being captured. Check Kiro's terminal output for real-time logs.

### Stop All Services
To stop the running services, you can use Kiro to stop the background processes.

### Restart Services
If you need to restart:

**Terminal 1 - Server:**
```powershell
cd "c:\Users\prath\OneDrive\Desktop\IoT-Project\PrintBridge_PaaS"
node server/index.js
```

**Terminal 2 - Printer Agent:**
```powershell
cd "c:\Users\prath\OneDrive\Desktop\IoT-Project\PrintBridge_PaaS\printer-agent"
node agent.js
```

---

## 🧪 Testing the System

### Step 1: Upload a Document
1. Go to: http://localhost:5000/customer.html
2. Enter password: `2323`
3. Click "Upload PDF"
4. Select any PDF file from your computer
5. System will detect page count automatically

### Step 2: Configure Print Options
1. Select print mode:
   - **Black & White:** ₹2 per page
   - **Color:** ₹5 per page
2. Choose copies: 1-10
3. Price calculated automatically

### Step 3: Process Payment
1. Enter your email address
2. Click "Process Payment"
3. Select payment method (UPI/Card/Net Banking)
4. Payment processed instantly
5. Digital receipt generated with ticket number

### Step 4: Monitor Printing
1. Within 5 seconds, printer agent detects the job
2. PDF downloads from Cloudinary
3. Sends to printer (Microsoft Print to PDF)
4. Job marked as printed on server

### Step 5: Check Analytics
1. Go to: http://localhost:5000/thingspeak-customer.html
2. View real-time charts:
   - Total jobs today
   - Pages printed
   - Revenue generated
   - Queue length

---

## 📂 Sample PDF Files

You can use these sample PDFs included in the project for testing:
- `ui/2_Paged_Document.pdf` - 2 pages
- `ui/5_Paged_Document.pdf` - 5 pages
- `ui/10_Paged_Document.pdf` - 10 pages

---

## 🔍 What to Expect

### Server Terminal Output:
```
✓ Server running on port 5000
✓ Environment: development
✓ Ready to accept connections
☁️ ThingSpeak: Auto-update started (every 15 seconds)
☁️ ThingSpeak: Data sent (Entry #1)
```

### Printer Agent Terminal Output:
```
✓ Printer agent ready - All paid jobs will be printed
✓ Printer agent started!
Polling for paid jobs...
...
```

### When a Job is Printed:
```
✓ NEW PAID JOB FOUND!
  Ticket Number: #1000
  Job ID: 1736678400000
  Pages: 5
  Copies: 2
→ Downloading file from Cloudinary...
✓ File downloaded
→ Printing...
✓ All 2 copies printed!
```

---

## 🎯 Configuration Summary

### Environment Variables (.env)
- ✅ Cloudinary Cloud Name: dzbbimwus
- ✅ Cloudinary API Key: Configured
- ✅ Cloudinary API Secret: Configured
- ✅ ThingSpeak Write Key: Configured
- ✅ ThingSpeak Channel ID: 3491976
- ✅ Port: 5000
- ✅ Node Environment: development
- ✅ Demo Mode: false

### Printer Configuration
- **Current Printer:** Microsoft Print to PDF
- **Note:** When HP LaserJet P1108 is connected, update `printer-agent/config.js`

### Network Configuration
- **Server:** localhost:5000
- **Protocol:** HTTP
- **CORS:** Enabled

---

## ⚠️ Important Notes

### Printer Setup
- Currently using "Microsoft Print to PDF" for testing
- When you connect HP LaserJet P1108:
  1. Run: `Get-Printer | Select-Object Name`
  2. Update `printer-agent/config.js` with exact printer name
  3. Restart printer agent

### Arduino Setup (Optional)
- Arduino code needs to be configured separately
- Update WiFi credentials in `.ino` file
- Set SERVER_HOST to your computer's IP address
- See SETUP_INSTRUCTIONS.md for details

### Security
- Default passwords are `2323` - change in production
- Never commit `.env` file to Git
- Keep credentials secure

---

## 🐛 Troubleshooting

### Server won't start
- Check if port 5000 is already in use
- Verify `.env` file exists and is configured
- Run: `npm install` to ensure dependencies

### Printer agent can't connect
- Verify server is running on port 5000
- Check printer name is correct
- Ensure printer is powered on

### Can't upload files
- Check Cloudinary credentials in `.env`
- Verify internet connection
- Check browser console for errors (F12)

### ThingSpeak not updating
- Verify Write API Key and Channel ID
- Check server logs for ThingSpeak errors
- Wait 15 seconds between updates (free tier limit)

---

## 📊 System Metrics

View real-time metrics at:
**ThingSpeak Channel:** https://thingspeak.com/channels/3491976

**Tracked Metrics:**
- Field 1: Total Jobs Today
- Field 2: Total Pages Printed
- Field 3: Revenue (INR)
- Field 4: Queue Length
- Field 5: Color Ratio (%)
- Field 6: Latest Ticket Number
- Field 7: Printer Status
- Field 8: Paper Status

---

## 🎊 Success!

Your PrintBridge-PaaS system is fully operational!

**Next Steps:**
1. Test the customer portal by uploading a PDF
2. Monitor the printer agent for job detection
3. Check analytics dashboard for metrics
4. When ready, connect Arduino for full IoT functionality

**Support Documents:**
- `QUICK_START.md` - Quick reference
- `SETUP_INSTRUCTIONS.md` - Detailed setup
- `PROJECT_READY_CHECKLIST.md` - Verification steps
- `README.md` - Complete documentation

---

**Application started:** 2026-09-12  
**Status:** Running Successfully ✅  
**Team:** VPS  
**Project:** IoT Expo 2026
