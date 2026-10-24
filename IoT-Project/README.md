# PrintBridge-PaaS (Printer as a Service)

**An IoT-Based Cloud Printing Platform**

![Project Status](https://img.shields.io/badge/status-production%20ready-brightgreen)
![IoT](https://img.shields.io/badge/IoT-Arduino%20R4%20WiFi-blue)
![Cloud](https://img.shields.io/badge/cloud-Render%20%7C%20Cloudinary-orange)

**🌐 Live Demo**: [https://printbridge-by-vps.onrender.com/](https://printbridge-by-vps.onrender.com/)

**🎭 Demo Mode**: The live deployment runs in demo mode to prevent abuse. Files are not actually uploaded to Cloudinary, and printing is simulated. All other features (pricing, payments, analytics, ticket numbers) work exactly as in production.

**Demo Credentials**:
- Password of the Day: `2323`
- Admin Access Code: `2323`

---

## Table of Contents

- [Live Demo](#live-demo)
- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Hardware Components](#hardware-components)
- [Pin Configuration](#pin-configuration)
- [Pricing Model](#pricing-model)
- [Installation & Setup](#installation--setup)
- [Deployment Workflow](#deployment-workflow)
- [API Endpoints](#api-endpoints)
- [Communication Protocols](#communication-protocols--technical-specifications)
- [Project Presentations](#project-presentations)
- [Troubleshooting](#troubleshooting)
- [Team](#team)

---

## Live Demo

**🚀 Access the Live System**: [https://printbridge-by-vps.onrender.com/](https://printbridge-by-vps.onrender.com/)

### Available Pages

| Page | URL | Description |
|------|-----|-------------|
| **Customer Portal** | [/customer.html](https://printbridge-by-vps.onrender.com/customer.html) | Upload PDFs, process payments, get receipts |
| **Admin Dashboard** | [/index.html](https://printbridge-by-vps.onrender.com/index.html) | View all jobs, approve payments, manage shop status |
| **About System** | [/about.html](https://printbridge-by-vps.onrender.com/about.html) | Complete system workflow and architecture |
| **Live Analytics** | [/thingspeak-customer.html](https://printbridge-by-vps.onrender.com/thingspeak-customer.html) | Real-time ThingSpeak dashboard |
| **Architecture Diagram** | [/architecture-live.html](https://printbridge-by-vps.onrender.com/architecture-live.html) | Interactive system architecture |

### Demo Credentials

- **Password of the Day**: `2323` (required for customer uploads)
- **Admin Access Code**: `2323` (required for admin panel)

### Try It Out

1. Visit the [Customer Portal](https://printbridge-by-vps.onrender.com/customer.html)
2. Enter Password of the Day: `2323`
3. Upload a PDF (or use sample PDFs provided)
4. Select print options (B&W/Color, copies)
5. Process payment (simulated gateway)
6. Receive digital receipt with ticket number
7. Check [Live Analytics](https://printbridge-by-vps.onrender.com/thingspeak-customer.html) to see your job in the queue

**Note**: The live demo uses **Demo Mode** to prevent Cloudinary abuse and printer wear. Your uploaded file is simulated with a random page count (1-15 pages), but all other features work exactly as in production. To deploy with full functionality, set `DEMO_MODE=false` in your environment variables.

---

## Overview

PrintBridge-PaaS transforms traditional institutional printing centers into a fully automated, cloud-based IoT printing ecosystem. Traditional printing centers suffer from critical bottlenecks: long physical queues, manual file transfers via USB drives, manual payment verifications, and confusion over mixed documents in the output tray.

**Important Note**: Our project "PrintBridge_PaaS" is an IoT-based cloud printing system for small print shops and educational institutions. This is different from the commercial enterprise product "PrintBridge" by Nuance Communications, which is a document capture and workflow automation tool for large-scale enterprise document management. Our solution targets informal, pay-per-job, small-shop IoT automation with hardware-level output management, while the commercial product focuses on enterprise content management pipelines.

### Time Savings & Efficiency Metrics

Based on a structured observational study conducted at a campus print shop over two weeks (60+ timed transactions):

| Scenario | Traditional Method | PrintBridge-PaaS | Time Saved |
|----------|-------------------|-------------|------------|
| **Peak Hours** (9-11 AM, 1-3 PM) | 4 minutes per transaction | <30 seconds | **87.5% reduction** |
| **Non-Peak Hours** | 2 minutes per transaction | <30 seconds | **75% reduction** |
| **Daily Student Time** (50 peak transactions) | ~200 minutes (3.3 hours) | ~25 minutes | **3 hours saved daily** |
| **Shop Owner Overhead** (80+ jobs/day) | 80-160 minutes | Fully automated | **2+ hours saved daily** |

**Methodology**: Start time recorded when student arrived at shop; end time when they walked away with printout. PrintBridge-PaaS timing includes upload (5-8s) + payment (3-5s) + Arduino polling cycle (max 5s) = consistently under 30 seconds.

PrintBridge-PaaS solves these problems by enabling:
- **Remote document upload** from anywhere via web portal
- **Automated payment processing** with receipt generation
- **Independent IoT verification** using Arduino Uno R4 WiFi
- **Sequential ticket-based tracking** to prevent document confusion
- **Real-time analytics** via ThingSpeak IoT platform

This project was developed by **Team VPS** for the IoT Project Expo 2026.

---

## Key Features

### Cloud-Based Operations
- **Remote Upload & Dynamic Pricing**: Users upload PDFs from anywhere. The system uses `pdf-parse` to automatically count pages and calculate pricing (₹2 B&W, ₹5 Color).
- **Multi-Method Payment Gateway**: Built-in simulated gateway supporting UPI, Net Banking, and Debit/Credit Cards.

### True IoT Edge Intelligence
- **Arduino Uno R4 WiFi** autonomously polls the cloud server every 5 seconds
- Independent payment verification before communicating with the printer
- No dependency on computer for payment validation

### Smart Queue Management
- **Sequential Ticketing System**: Every job gets a unique ticket number (starting at #1000)
- Ticket numbers display on user receipt, admin dashboard, and optional 16x2 LCD
- Prevents document confusion in output tray

### Hardware Automation
- **Progressive Timeout System**: IR Proximity Sensor monitors the output tray
  - 10s polite wait for paper collection
  - 5s urgent alert (buzzer/flashing LED)
  - Auto-resume at 15s to keep queue moving
- **Status Indicators**: RGB LED shows system status (Green=Ready, Blue=Printing, Yellow=Waiting, Red=Error)

### Live Cloud Telemetry
- Real-time system metrics streamed to **MathWorks ThingSpeak** every 15 seconds
- Tracks: total revenue, queue length, printer status, pages printed, and more
- Remote administrative monitoring from anywhere

---

## System Architecture

PrintBridge-PaaS uses a **Hybrid IoT Architecture** combining Cloud Core logic with Physical Edge execution:

```
┌─────────────────────────────────────────────────────────────────────┐
│                      PrintBridge-PaaS ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐      ┌──────────────┐      ┌─────────────────┐  │
│  │   Customer   │      │ Cloud Server │      │  Arduino IoT    │  │
│  │   Portal     │─────>│  (Node.js)   │─────>│  Controller     │  │
│  │  (HTML/JS)   │      │   on Render  │      │  (Uno R4 WiFi)  │  │
│  └──────────────┘      └──────────────┘      └─────────────────┘  │
│         │                      │                      │             │
│         │                      │                      │             │
│         v                      v                      v             │
│  ┌──────────────┐      ┌──────────────┐      ┌─────────────────┐  │
│  │   Upload &   │      │  Cloudinary  │      │  WiFi Polling   │  │
│  │   Payment    │      │ (PDF Storage)│      │  (Every 5s)     │  │
│  └──────────────┘      └──────────────┘      └─────────────────┘  │
│                                                       │             │
│                                                       v             │
│                                               ┌─────────────────┐  │
│                                               │ Printer Agent   │  │
│                                               │   (Node.js)     │  │
│                                               │ Local Computer  │  │
│                                               └─────────────────┘  │
│                                                       │             │
│                                                       v             │
│                                               ┌─────────────────┐  │
│                                               │ HP LaserJet     │  │
│                                               │ P1108 (USB)     │  │
│                                               └─────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

1. **Customer Portal** (`PrintBridge_PaaS/ui/customer.html`)
   - User-friendly interface for document upload
   - Payment processing with receipt generation
   - Price calculation (pages × copies × rate)
   - Ticket number tracking

2. **Cloud Server** (`PrintBridge_PaaS/server/`)
   - Express.js backend API
   - Cloudinary integration for file storage
   - Job management system
   - Payment gateway simulation
   - ThingSpeak analytics integration

3. **Arduino IoT Controller** (`PrintBridge_PaaS/arduino/`)
   - Arduino Uno R4 WiFi
   - WiFi connectivity to cloud server
   - Independent payment verification
   - Print command triggering
   - Status indicators (RGB LED, Buzzer, LCD)

4. **Printer Agent** (`PrintBridge_PaaS/printer-agent/`)
   - Node.js application running locally
   - Downloads PDFs from Cloudinary
   - Sends print commands to HP LaserJet P1108
   - Tracks printed jobs to prevent duplicates

5. **Cloud Services**
   - **Cloudinary**: PDF and image storage
   - **ThingSpeak**: IoT analytics and visualization
   - **Render**: Web server hosting (production)

---

## Technology Stack

### Frontend
- HTML5 for structure
- CSS3 for styling (custom design system)
- JavaScript (ES6+) for interactivity
- Responsive design for mobile devices

### Backend
- **Node.js** runtime environment
- **Express.js** web framework
- **Cloudinary SDK** for file management
- **pdf-parse** for PDF page counting
- **pdfkit** for image-to-PDF conversion
- **uuid** for payment ID generation
- **dotenv** for environment configuration
- **axios** for HTTP requests

### IoT Hardware
- **Arduino Uno R4 WiFi** (Renesas RA4M1, 48 MHz, 512 KB Flash)
- **RGB LED** (Common Cathode) for status indication
- **Active Buzzer** for audio feedback
- **IR Proximity Sensor** for paper detection
- **16x2 LCD Display** (HD44780 compatible) for ticket information

### Cloud Services
- **Cloudinary**: Cloud storage and CDN
- **ThingSpeak**: IoT analytics platform (Channel ID: 3373847)
  - Updates every 15 seconds
  - Tracks: Total Jobs, Pages Printed, Revenue, Queue Length, Color Ratio, Latest Ticket Number, Printer Status, Paper Status
- **Render**: Cloud hosting platform (live at [printbridge-by-vps.onrender.com](https://printbridge-by-vps.onrender.com))

---

## Hardware Components

### Arduino Uno R4 WiFi Specifications
- **Microcontroller**: Renesas RA4M1 (Cortex-M4)
- **Clock Speed**: 48 MHz
- **Flash Memory**: 512 KB
- **RAM**: 32 KB
- **WiFi**: 2.4 GHz (802.11 b/g/n)
- **Operating Voltage**: 5V
- **Digital I/O Pins**: 22
- **Analog Input Pins**: 6

### Printer Specifications
- **Model**: HP LaserJet Professional P1108
- **Type**: Laser Printer
- **Print Speed**: Up to 18 ppm (A4)
- **First Page Out**: <8.5 seconds
- **Resolution**: 600 x 600 dpi
- **Connection**: USB 2.0

---

## Pin Configuration

### Base Hardware Setup

| Component | Pin Type | Arduino Pin | Connection Details |
|-----------|----------|-------------|-------------------|
| **Buzzer (Active)** | Digital (PWM) | Pin 2 | Connect (+) to Pin 2, (-) to GND |
| **RGB LED - Blue** | Analog (PWM) | Pin 3 | Via 220Ω resistor to Pin 3 |
| **RGB LED - Green** | Analog (PWM) | Pin 5 | Via 220Ω resistor to Pin 5 |
| **RGB LED - Red** | Analog (PWM) | Pin 6 | Via 220Ω resistor to Pin 6 |
| **IR Proximity Sensor** | Analog Input | Pin A0 | VCC to 5V, GND to GND, OUT to A0 |

**Note**: The RGB LED requires a **Common Cathode** connection to GND.

### Optional 16x2 LCD Display Setup

PrintBridge-PaaS supports an optional **16x2 LCD (Model JHD162A)** operating in 4-bit mode to display ticket numbers and system status.

#### LCD Wiring (4-bit mode)

| LCD Pin | Function | Arduino Pin | Notes |
|---------|----------|-------------|-------|
| **RS** | Register Select | Pin 12 | |
| **E** | Enable | Pin 11 | |
| **D4** | Data 4 | Pin 10 | |
| **D5** | Data 5 | Pin 9 | |
| **D6** | Data 6 | Pin 8 | |
| **D7** | Data 7 | Pin 7 | |
| **VSS** | Ground | GND | |
| **VDD** | Power | 5V | |
| **RW** | Read/Write | GND | Always write mode |
| **V0** | Contrast | Potentiometer | 10kΩ pot center pin |
| **A (LED+)** | Backlight + | 5V | Via 220Ω resistor |
| **K (LED-)** | Backlight - | GND | |

#### LCD Display States

- **Startup**: "PrintBridge-PaaS" / "Initializing..."
- **Ready**: "SYSTEM READY" / "Waiting for job"
- **Printing**: "PRINTING TICKET" / " #1000 "
- **Complete**: "TICKET #1000" / "COLLECT PAGES!"

### Status LED Color Codes

| Color | Status | Meaning |
|-------|--------|---------|
| **Green** | IDLE | System ready, waiting for jobs |
| **Blue** | PRINTING | Printing in progress |
| **Yellow** | WAITING | Waiting for paper collection |
| **Red** | ERROR | Error condition or WiFi disconnected |

---

## Pricing Model

### Print Rates

| Print Type | Rate per Page | Use Case |
|------------|---------------|----------|
| **Black & White** | ₹2 | Text documents, cost-effective for large volumes |
| **Color** | ₹5 | Images and graphics, higher quality output |

### Multiple Copies
- **Range**: 1-10 copies per job
- **Automatic price calculation**
- **Subtotal and total pricing display**

### Price Calculation Formula

```
Subtotal = Pages × Price per Page
Total = Subtotal × Number of Copies
```

### Examples

- 5 pages, Black & White, 1 copy: `5 × ₹2 × 1 = ₹10`
- 5 pages, Black & White, 3 copies: `5 × ₹2 × 3 = ₹30`
- 10 pages, Color, 5 copies: `10 × ₹5 × 5 = ₹250`

---

## Installation & Setup

### Prerequisites

- **Node.js** (v14 or higher)
- **Arduino IDE** (for uploading Arduino code)
- **HP LaserJet P1108** printer with drivers installed
- **WiFi Network** (2.4 GHz for Arduino R4)
- **Cloudinary Account** (free tier available)
- **ThingSpeak Account** (free tier available)

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/printbridge-paas.git
cd printbridge-paas/PrintBridge_PaaS
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

Create a `.env` file in the `PrintBridge_PaaS` directory:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ThingSpeak Configuration
THINGSPEAK_WRITE_KEY=your_write_key
THINGSPEAK_CHANNEL_ID=your_channel_id

# Server Configuration
PORT=5000
NODE_ENV=development
```

### Step 4: Configure Printer Agent

Edit `PrintBridge_PaaS/printer-agent/config.js`:

```javascript
module.exports = {
  SERVER_URL: 'http://localhost:5000',  // Update for production
  POLL_INTERVAL: 5000,  // 5 seconds
  PRINTER_NAME: 'HP LaserJet Professional P1108',  // Your printer name
  DOWNLOAD_DIR: './downloads'
};
```

### Step 5: Configure Arduino

Open `PrintBridge_PaaS/arduino/PrintBridge-PaaS_A4_Printer.ino` in Arduino IDE and update:

```cpp
// WiFi Configuration
const char* WIFI_SSID = "YourWiFiName";
const char* WIFI_PASSWORD = "YourWiFiPassword";

// Server Configuration (for live demo)
const char* SERVER_HOST = "printbridge-by-vps.onrender.com";  // No https://
const int SERVER_PORT = 443;  // HTTPS port
```

**Important**: 
- Do NOT include `https://` in `SERVER_HOST`
- Use port `443` for HTTPS (Render deployment)
- Arduino R4 WiFi only supports 2.4 GHz networks

### Step 6: Upload Arduino Code

1. Connect Arduino Uno R4 WiFi via USB
2. Select **Tools > Board > Arduino Uno R4 WiFi**
3. Select the correct **Port**
4. Click **Upload**
5. Open **Serial Monitor** (115200 baud) to verify connection

---

## Deployment Workflow

### Option 1: Local Development (Testing)

1. **Start the Cloud Server**
   ```bash
   cd PrintBridge_PaaS
   node server/index.js
   ```

2. **Start the Printer Agent** (in a new terminal)
   ```bash
   cd PrintBridge_PaaS/printer-agent
   node agent.js
   ```

3. **Power on Arduino** (ensure it's connected to WiFi)

4. **Access the Portal**
   - Open browser: `http://localhost:5000`
   - Customer Portal: `http://localhost:5000/customer.html`
   - Admin Panel: `http://localhost:5000/index.html`
   - Live Analytics: `http://localhost:5000/thingspeak-customer.html`

### Option 2: Production Deployment (Render)

**✅ Already Deployed**: [https://printbridge-by-vps.onrender.com/](https://printbridge-by-vps.onrender.com/)

To deploy your own instance:

#### Deploy Cloud Server to Render

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Create Render Web Service**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click **New > Web Service**
   - Connect your GitHub repository
   - Configure:
     - **Name**: `printbridge-paas`
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `node server/index.js`
     - **Instance Type**: Free

3. **Add Environment Variables** in Render Dashboard
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `THINGSPEAK_WRITE_KEY`
   - `THINGSPEAK_CHANNEL_ID`

4. **Deploy** and copy your live URL (e.g., `https://printbridge-paas.onrender.com`)

#### Update Printer Agent

Edit `printer-agent/config.js`:

```javascript
SERVER_URL: 'https://printbridge-by-vps.onrender.com'  // Live demo URL
```

Restart the printer agent:

```bash
node agent.js
```

#### Update Arduino Configuration

Update `PrintBridge-PaaS_A4_Printer.ino`:

```cpp
const char* SERVER_HOST = "printbridge-by-vps.onrender.com";  // No https://
const int SERVER_PORT = 443;  // HTTPS port
```

Re-upload the Arduino code.

### Deployment Checklist

- [ ] Environment variables configured in Render
- [ ] Printer agent updated with production URL
- [ ] Arduino code updated with production URL and WiFi credentials
- [ ] Arduino uploaded and connected to WiFi
- [ ] Printer agent running on local computer
- [ ] HP LaserJet P1108 connected and powered on
- [ ] Test end-to-end workflow (upload → payment → print)

---

## How It Works: Complete Workflow

### Step-by-Step Process

1. **📤 Upload Document**
   - User opens [customer portal](https://printbridge-by-vps.onrender.com/customer.html)
   - Enters Password of the Day (`2323` for demo)
   - Selects and uploads PDF file
   - File securely uploaded to Cloudinary cloud storage

2. **📊 Document Analysis**
   - Server analyzes PDF using `pdf-parse` library
   - Counts total pages (e.g., 5 pages)
   - Creates job with status: `pending`, payment: `unpaid`
   - Generates unique sequential ticket number (starting from #1000)

3. **💰 Price Configuration**
   - User selects print mode: Black & White (₹2/page) or Color (₹5/page)
   - Chooses number of copies (1-10)
   - System calculates: `(Pages × Price per Page) × Copies`
   - Displays subtotal and total price

4. **💳 Payment Processing**
   - User enters email for receipt
   - Processes payment through simulated gateway (UPI/Card/Net Banking)
   - Server generates Payment ID and digital receipt
   - Job updated: `status → approved`, `payment → paid`

5. **📡 Arduino Polling**
   - Arduino Uno R4 WiFi continuously polls server every 5 seconds
   - Sends: `GET https://printbridge-by-vps.onrender.com/api/jobs`
   - Searches for jobs with: `status = approved` AND `payment = paid`

6. **🔍 Job Detection**
   - Arduino finds paid job in server response
   - Extracts: Job ID, Ticket Number, Payment ID, File URL
   - Displays job details on Serial Monitor with banner

7. **✅ Payment Verification**
   - Arduino makes independent verification: `GET /api/receipt/:paymentId`
   - Confirms payment legitimacy
   - If verified, proceeds to print trigger

8. **🚨 Hardware Feedback**
   - RGB LED shows status:
     - 🟢 Green = Idle/Ready
     - 🔵 Blue = Printing in progress
     - 🟡 Yellow = Waiting for paper collection
     - 🔴 Red = Error/WiFi disconnected
   - Buzzer provides audio alerts
   - IR Proximity Sensor detects paper removal

9. **⬇️ File Download**
   - `printer-agent/agent.js` running on local computer detects paid job
   - Downloads PDF from Cloudinary URL
   - Saves to local downloads directory

10. **🖨️ Print Execution**
    - Printer agent sends file to HP LaserJet P1108
    - Document prints with selected options (B&W/Color)
    - Prints all requested copies sequentially

11. **📈 Analytics Update**
    - Server automatically updates ThingSpeak every 15 seconds
    - Tracks: Total Jobs, Pages Printed, Revenue, Queue Length, Color Ratio, Latest Ticket Number, Printer Status, Paper Status
    - View live at: [ThingSpeak Customer Dashboard](https://printbridge-by-vps.onrender.com/thingspeak-customer.html)

12. **✅ Job Completion**
    - User receives printed document
    - Digital receipt with ticket number saved in browser
    - Job marked as `printed: true` on server
    - System ready for next print job

### Total Time: Upload to Print Start

- **Upload**: 5-8 seconds
- **Payment**: 3-5 seconds  
- **Arduino Poll Cycle**: Maximum 5 seconds
- **Total**: **Under 30 seconds** (vs 2-4 minutes traditional method)

---

## API Endpoints

### Arduino Polling Endpoints

The Arduino Uno R4 WiFi polls these three endpoints over HTTPS (port 443):

| Endpoint | Method | Polling Frequency | Purpose |
|----------|--------|-------------------|---------|
| `/api/jobs` | `GET` | Every 5 seconds | Fetch paid + approved + unprinted jobs |
| `/api/receipt/:paymentId` | `GET` | On-demand | Verify payment legitimacy before printing |
| `/api/jobs/:id/printed` | `POST` | After print trigger | Mark job as printed on server |

### Job Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload` | Upload PDF to Cloudinary |
| `POST` | `/api/upload-images` | Upload multiple images, convert to PDF |
| `POST` | `/api/calculate-price` | Calculate print price |
| `GET` | `/api/jobs` | Get all jobs |
| `DELETE` | `/api/jobs/clear-all` | Clear all jobs (admin) |
| `DELETE` | `/api/jobs/:id` | Delete specific job (admin) |

### Payment & Verification

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/payment/:id` | Process payment for job |
| `GET` | `/api/receipt/:paymentId` | Get payment receipt |
| `GET` | `/api/verify-payment/:id` | Verify payment (Arduino) |
| `POST` | `/api/approve/:id` | Approve job for printing |

### Print Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/jobs/:id/printed` | Mark job as printed |
| `GET` | `/api/shop-status` | Get shop status (open/closed) |
| `POST` | `/api/shop-status` | Update shop status (admin) |

---

## Communication Protocols & Technical Specifications

### Network Protocols

| Protocol | Usage | Details |
|----------|-------|---------|
| **HTTPS (TLS over TCP/IP)** | Arduino to Cloud Server | All API calls use WiFiSSLClient, Port 443, HTTP/1.1 |
| **WiFi (IEEE 802.11 b/g/n)** | Arduino Connectivity | 2.4 GHz only (R4 WiFi's ESP32-S3), WPA2 authentication |
| **UART / Serial (RS-232)** | Arduino to Printer Agent | 115200 baud, JSON commands delimited by markers |
| **I2C / Parallel** | LCD Communication | 16x2 LCD in 4-bit parallel mode via LiquidCrystal.h |
| **Analog Signal** | IR Sensor | 10-bit ADC (0-1023), threshold at 512 for paper detection |

### Power Supply Specifications

| Component | Power Source | Current Draw | Notes |
|-----------|--------------|--------------|-------|
| **Arduino Uno R4 WiFi** | USB (5V) or Barrel Jack (6-24V) | 80mA idle, 250mA WiFi active | Onboard regulator steps down to 5V/3.3V |
| **RGB LED** | Arduino PWM Pins (3, 5, 6) | ~100mA total | Requires 220Ω resistors per channel |
| **Buzzer** | Pin 2 (PWM) | 30-50mA | Passive buzzer driven by tone() |
| **IR Proximity Sensor** | 5V Rail | 20-40mA | FC-51 or TCRT5000 module |
| **16x2 LCD** | 5V Rail | 1mA logic + 80-120mA backlight | HD44780 compatible |

**Total Peak Draw**: ~560mA (WiFi transmission burst + all peripherals active)

**Recommended Power**: 5V 1A or 2A adapter via barrel jack (USB 2.0's 500mA limit can be marginal during WiFi bursts)

### Arduino Polling Workflow

```
Every 5 seconds:
1. Arduino → GET https://printbridge-by-vps.onrender.com/api/jobs
2. Parse JSON response for paid + approved + unprinted jobs
3. If new job found:
   a. Arduino → GET /api/receipt/{paymentId} (verify payment)
   b. Arduino → Serial → Printer Agent (send print command JSON)
   c. Printer Agent → Cloudinary (download PDF)
   d. Printer Agent → HP LaserJet P1108 (execute print)
   e. Arduino → POST /api/jobs/{jobId}/printed (mark complete)
```

---

## Project Presentations

The `PPTs` folder contains comprehensive presentations covering various aspects of the project:

| Presentation | Description | Size |
|--------------|-------------|------|
| `IoT_Architecture.pptx` | System architecture and component interaction | 20.8 MB |
| `IoT_Cloud_Printing.pptx` | Cloud printing workflow and features | 12.2 MB |
| `IoT_Ecosystem.pptx` | Complete IoT ecosystem overview | 13.7 MB |
| `IoT_PaaS.pptx` | Printer as a Service concept and implementation | 19.6 MB |
| `IoT_Printing_System.pptx` | Detailed printing system mechanics | 14.2 MB |
| `IoT_Project_Presentation_GitHub_Upload_Version.pptx` | GitHub-ready project presentation | 6.4 MB |

**Total Presentation Materials**: 86.9 MB

---

## Troubleshooting

### Arduino Issues

**Problem**: Can't connect to WiFi
- **Solution**: Check SSID and password in Arduino code
- **Solution**: Ensure using 2.4 GHz WiFi (R4 doesn't support 5 GHz)
- **Solution**: Check WiFi signal strength near Arduino

**Problem**: Can't reach server
- **Solution**: Verify `SERVER_HOST` (no `https://` prefix)
- **Solution**: Use port `443` for HTTPS, `80` for HTTP
- **Solution**: Check if server is running and accessible

**Problem**: Not detecting jobs
- **Solution**: Ensure server is running
- **Solution**: Check Serial Monitor for error messages
- **Solution**: Verify jobs exist and are marked as "paid" and "approved"

### Printer Agent Issues

**Problem**: Can't download PDF
- **Solution**: Check internet connection
- **Solution**: Verify Cloudinary credentials
- **Solution**: Check firewall settings

**Problem**: Can't print
- **Solution**: Verify printer name in `config.js`
- **Solution**: Ensure printer drivers are installed
- **Solution**: Check printer is powered on and connected via USB

**Problem**: Job not marked as printed
- **Solution**: Check server connectivity
- **Solution**: Verify API endpoint is accessible

### Server Issues

**Problem**: Can't start server
- **Solution**: Check `PORT` in environment variables
- **Solution**: Verify all environment variables are set
- **Solution**: Run `npm install` to install dependencies

**Problem**: API errors
- **Solution**: Check Cloudinary credentials in `.env`
- **Solution**: Verify ThingSpeak API keys
- **Solution**: Check server logs for detailed error messages

**Problem**: Jobs not saving
- **Solution**: Check file permissions in server directory
- **Solution**: Verify `jobs.json` file exists and is writable

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Connection refused" | Server not running | Start the server with `node server/index.js` |
| "WiFi not connected" | Wrong SSID/password | Update Arduino code with correct credentials |
| "PDF download failed" | Internet connectivity | Check network connection |
| "Printer not found" | Incorrect printer name | Update `config.js` with exact printer name |

---

## Team

**Team VPS**

Developed for the **IoT Project Expo 2026**

*"Bridging the gap between cloud convenience and physical printing."*

---

## License

This project is developed for educational purposes as part of the IoT Project Expo 2026.

---

## Acknowledgments

- **MathWorks ThingSpeak** for IoT analytics platform
- **Cloudinary** for cloud storage and CDN services
- **Render** for cloud hosting platform
- **Arduino** for the Uno R4 WiFi platform

---

**For questions, issues, or contributions, please contact Team VPS.**
