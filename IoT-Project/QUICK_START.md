# PrintBridge-PaaS - Quick Start Guide

## 🚀 Get Up and Running in 5 Minutes

### Prerequisites Checklist
- [ ] Node.js installed (v14+)
- [ ] Arduino IDE installed
- [ ] HP LaserJet P1108 connected
- [ ] WiFi network (2.4 GHz)
- [ ] Cloudinary account
- [ ] ThingSpeak account

---

## Step 1: Install Dependencies (2 minutes)

```powershell
cd "c:\Users\prath\OneDrive\Desktop\IoT-Project\PrintBridge_PaaS"
npm install
```

---

## Step 2: Configure Environment (3 minutes)

### Edit `.env` file:
```
PrintBridge_PaaS\.env
```

**Required values to add:**

```env
# Cloudinary (from https://console.cloudinary.com/)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ThingSpeak (from https://thingspeak.com/)
THINGSPEAK_WRITE_KEY=your_write_key
THINGSPEAK_CHANNEL_ID=your_channel_id
```

---

## Step 3: Upload Arduino Code (2 minutes)

### Edit Arduino file:
```
PrintBridge_PaaS\arduino\PrintBridge_A4_Printer.ino
```

**Update WiFi credentials:**
```cpp
const char* WIFI_SSID = "Your_WiFi_Name";
const char* WIFI_PASSWORD = "Your_WiFi_Password";

// For local testing, use your computer's IP:
const char* SERVER_HOST = "192.168.1.XXX";  // Find with: ipconfig
const int SERVER_PORT = 5000;
```

**Upload to Arduino:**
1. Connect Arduino via USB
2. Select: Tools → Board → Arduino UNO R4 WiFi
3. Select: Tools → Port → (your COM port)
4. Click Upload (→)

---

## Step 4: Run the System (30 seconds)

### Terminal 1: Start Server
```powershell
cd "c:\Users\prath\OneDrive\Desktop\IoT-Project\PrintBridge_PaaS"
node server/index.js
```

### Terminal 2: Start Printer Agent
```powershell
cd "c:\Users\prath\OneDrive\Desktop\IoT-Project\PrintBridge_PaaS\printer-agent"
node agent.js
```

### Terminal 3: Monitor Arduino
- Open Arduino IDE → Tools → Serial Monitor
- Set baud rate: 115200

---

## Step 5: Test the System (1 minute)

1. **Open browser:** http://localhost:5000
2. **Enter password:** `2323`
3. **Upload a PDF file**
4. **Select print options** (B&W/Color, copies)
5. **Process payment**
6. **Watch it print!** 🎉

---

## 📋 All Commands in One Place

```powershell
# Install dependencies
cd "c:\Users\prath\OneDrive\Desktop\IoT-Project\PrintBridge_PaaS"
npm install

# Start server
node server/index.js

# Start printer agent (new terminal)
cd "c:\Users\prath\OneDrive\Desktop\IoT-Project\PrintBridge_PaaS\printer-agent"
node agent.js

# Find your IP address (for Arduino config)
ipconfig

# Check printer name (for printer agent config)
Get-Printer | Select-Object Name
```

---

## 🔧 Common Issues & Quick Fixes

### "Environment variables missing"
→ Edit `.env` file and add your Cloudinary and ThingSpeak credentials

### "Arduino can't connect to WiFi"
→ Check WiFi is 2.4 GHz, verify SSID/password spelling

### "Arduino can't reach server"
→ Use computer's IP address (from `ipconfig`) in Arduino code

### "Printer not found"
→ Run `Get-Printer | Select-Object Name` and update `printer-agent/config.js`

### "Port 5000 already in use"
→ Change `PORT=5001` in `.env` file

---

## 📊 Access Points

| What | URL |
|------|-----|
| Customer Portal | http://localhost:5000/customer.html |
| Admin Dashboard | http://localhost:5000/index.html |
| Live Analytics | http://localhost:5000/thingspeak-customer.html |
| System Info | http://localhost:5000/about.html |

**Default Password:** `2323`

---

## 🎯 Success Indicators

### Server Running Successfully:
```
✓ Server running on port 5000
✓ Environment: development
✓ Ready to accept connections

☁️ ThingSpeak integration enabled
   Channel ID: 3373847
```

### Arduino Connected:
```
✓ WiFi connected!
📶 IP Address: 192.168.1.150
🟢 STATUS: IDLE - Waiting for jobs...
```

### Printer Agent Running:
```
🖨️ Printer Agent Started
📡 Polling: http://localhost:5000
🖨️ Target Printer: HP LaserJet Professional P1108
⏱️ Checking every 5 seconds...
```

---

## 📚 Next Steps

- Read full **SETUP_INSTRUCTIONS.md** for detailed configuration
- Check **README.md** for architecture and API documentation
- Review **COMPLETE_IOT_EXPO.txt** for project documentation

---

## 🆘 Need Help?

1. Check **SETUP_INSTRUCTIONS.md** Troubleshooting section
2. Verify all credentials in `.env` file
3. Check server logs for error messages
4. Verify Arduino Serial Monitor for connection issues

---

**Quick Start Guide by Team VPS**
