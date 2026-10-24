/*
 * PrintBridge-PaaS - PaaS (Printer as a Service)
 * Arduino Uno R4 WiFi Controller for A4 Printer
 * 
 * This Arduino acts as an IoT payment verifier and print trigger for
 * a standard A4 printer connected to a computer.
 * 
 * Architecture:
 * 1. Arduino polls server via WiFi for paid jobs
 * 2. Arduino verifies payment status
 * 3. Arduino sends print command to computer via Serial/HTTP
 * 4. Computer prints document on A4 printer
 * 
 * Hardware Setup:
 * - Arduino Uno R4 WiFi (WiFi connection to server)
 * - Computer with A4 printer (USB/Network connected)
 * - Optional: USB connection to computer for serial commands
 * 
 * Configuration:
 * Update WiFi credentials and server URL below
 */

#include <WiFiS3.h>
#include <WiFiSSLClient.h>
#include <LiquidCrystal.h>        // 16x2 LCD library

// ============ CONFIGURATION - UPDATE THESE ============
const char* WIFI_SSID = "Pratham";
const char* WIFI_PASSWORD = "12345678";
const char* SERVER_HOST = "printbridge-by-vps.onrender.com";  // Render deployment URL
const int SERVER_PORT = 443;  // HTTPS port for Render

// ============ HARDWARE PINS ============
#define LED_PIN LED_BUILTIN
#define BUZZER_PIN 2          // Buzzer connected to pin 2
#define LED_RED_PIN 6         // Red LED (Common Cathode RGB LED) - PWM capable
#define LED_GREEN_PIN 5       // Green LED - PWM capable
#define LED_BLUE_PIN 3        // Blue LED - PWM capable (MOVED from pin 4)
#define IR_SENSOR_PIN A0      // IR Proximity Sensor (Analog Input, MOVED from pin 3)

// 16x2 LCD Pins (using 4-bit mode)
#define LCD_RS 12             // Register Select
#define LCD_E  11             // Enable
#define LCD_D4 10             // Data 4
#define LCD_D5 9              // Data 5
#define LCD_D6 8              // Data 6
#define LCD_D7 7              // Data 7

// ======================================================

#define POLL_INTERVAL 5000  // Poll every 5 seconds

// Status colors
enum SystemStatus {
  STATUS_IDLE,       // Green - Ready/Available
  STATUS_PRINTING,   // Blue - Printing in progress
  STATUS_WAITING,    // Yellow - Waiting for paper collection
  STATUS_ERROR       // Red - Error/Not working
};

WiFiSSLClient client;  // Use SSL client for HTTPS
LiquidCrystal lcd(LCD_RS, LCD_E, LCD_D4, LCD_D5, LCD_D6, LCD_D7);  // 16x2 LCD instance
unsigned long lastPollTime = 0;
bool printingInProgress = false;
String lastPrintedJobId = "";  // Track last printed job to avoid reprinting
String currentTicketNumber = "";  // Track current ticket number to display
bool lcdInitialized = false;  // Track if LCD has been updated with ticket at least once
SystemStatus currentStatus = STATUS_IDLE;
bool irSensorAvailable = false;  // Track if IR sensor is connected
bool paperDetected = false;  // Track if paper is currently detected
unsigned long lastBeepTime = 0;  // Track last beep time

void setup() {
  Serial.begin(115200);  // USB serial for communication with computer
  
  // Initialize 16x2 LCD
  lcd.begin(16, 2);  // 16 columns, 2 rows
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("PrintBridge-PaaS");
  lcd.setCursor(0, 1);
  lcd.print("Initializing...");
  
  // Initialize pins
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_RED_PIN, OUTPUT);
  pinMode(LED_GREEN_PIN, OUTPUT);
  pinMode(LED_BLUE_PIN, OUTPUT);
  pinMode(IR_SENSOR_PIN, INPUT);  // IR sensor on analog pin
  
  // Turn off buzzer initially
  digitalWrite(BUZZER_PIN, LOW);
  
  // Check if IR sensor is connected
  checkIRSensor();
  
  Serial.println("\n=================================");
  Serial.println("PrintBridge-PaaS");
  Serial.println("Printer as a Service");
  Serial.println("Arduino Uno R4 WiFi");
  Serial.println("=================================\n");
  
  // Startup sequence
  setStatusColor(STATUS_ERROR);  // Red during startup
  playStartupTone();
  
  // Connect to WiFi
  connectWiFi();
  
  Serial.println("\n✓ System Ready!");
  Serial.println("Polling for paid jobs every 5 seconds...\n");
  
  // Show "READY" on LCD
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("  SYSTEM READY  ");
  lcd.setCursor(0, 1);
  lcd.print("Waiting for job");
  
  // Set to idle (green) when ready
  setStatusColor(STATUS_IDLE);
  blinkLED(3);
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠ WiFi disconnected! Reconnecting...");
    setStatusColor(STATUS_ERROR);  // Red when disconnected
    connectWiFi();
    if (WiFi.status() == WL_CONNECTED) {
      setStatusColor(STATUS_IDLE);  // Back to green when connected
    }
  }
  
  // Check for paper in output tray (if IR sensor available)
  if (irSensorAvailable && paperDetected) {
    if (!isPaperDetected()) {
      // Paper has been collected
      Serial.println("✓ Paper collected!");
      paperDetected = false;
      setStatusColor(STATUS_IDLE);  // Back to green
      
      // Update LCD to show ready
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("  SYSTEM READY  ");
      lcd.setCursor(0, 1);
      lcd.print("Waiting for job");
      
      Serial.println("✓ Ready for next job\n");
    } else {
      // Paper still there - beep every 3 seconds
      if (millis() - lastBeepTime >= 3000) {
        Serial.println("🔊 Reminder: Please collect your pages");
        playCollectionReminderTone();
        lastBeepTime = millis();
      }
    }
  }
  
  // Poll server for new jobs
  if (millis() - lastPollTime >= POLL_INTERVAL && !printingInProgress && !paperDetected) {
    lastPollTime = millis();
    checkForPaidJobs();
  }
  
  delay(100);
}

// ============ MAIN FUNCTIONS ============

void checkForPaidJobs() {
  Serial.println("→ Polling server for paid jobs...");
  
  if (!client.connect(SERVER_HOST, SERVER_PORT)) {
    Serial.println("✗ Connection to server failed");
    setStatusColor(STATUS_ERROR);  // Red on connection error
    playErrorTone();
    return;
  }
  
  // Keep green while checking (don't change to blue)
  // Status only changes to blue when actually printing
  
  // Send HTTP GET request
  client.println("GET /api/jobs HTTP/1.1");
  client.print("Host: ");
  client.println(SERVER_HOST);
  client.println("Connection: close");
  client.println();
  
  // Wait for response
  unsigned long timeout = millis();
  while (client.available() == 0) {
    if (millis() - timeout > 5000) {
      Serial.println("✗ Server timeout");
      setStatusColor(STATUS_ERROR);
      playErrorTone();
      client.stop();
      return;
    }
  }
  
  // Skip HTTP headers
  bool headersEnded = false;
  while (client.available()) {
    String line = client.readStringUntil('\n');
    if (line == "\r") {
      headersEnded = true;
      break;
    }
  }
  
  // Read JSON response
  String jsonResponse = "";
  while (client.available()) {
    jsonResponse += (char)client.read();
  }
  client.stop();
  
  // DEBUG: Show raw JSON response
  Serial.println("\n════════ SERVER RESPONSE ════════");
  Serial.println(jsonResponse);
  Serial.println("═════════════════════════════════\n");
  
  // Parse and process jobs
  processJobs(jsonResponse);
}

void processJobs(String jsonResponse) {
  // Find the LATEST paid and approved job that hasn't been printed yet
  String latestJobId = "";
  String latestPaymentId = "";
  String latestFileUrl = "";
  String latestTicketNumber = "";  // Track ticket number
  long latestId = 0;
  
  // Also track the MOST RECENT ticket number (even if already printed) for display
  String mostRecentTicketNumber = "";
  long mostRecentId = 0;
  
  int startPos = 0;
  int jobCount = 0;
  int approvedCount = 0;
  int paidCount = 0;
  int printedCount = 0;
  
  Serial.println("→ Parsing jobs from server...");
  
  while (true) {
    // Find next job object start
    int jobStart = jsonResponse.indexOf("{\"id\":", startPos);
    if (jobStart == -1) break;
    
    // Find the end of this job object by counting braces (robust parsing)
    int depth = 0;
    int jobEnd = jobStart;
    while (jobEnd < jsonResponse.length()) {
      char c = jsonResponse.charAt(jobEnd);
      if (c == '{') depth++;
      if (c == '}') {
        depth--;
        if (depth == 0) break;
      }
      jobEnd++;
    }
    
    if (jobEnd >= jsonResponse.length()) break;  // Malformed JSON
    
    // Extract this job's JSON
    String jobJson = jsonResponse.substring(jobStart, jobEnd + 1);
    jobCount++;
    
    // Check if this job is approved AND paid AND NOT printed
    bool isApproved = jobJson.indexOf("\"status\":\"approved\"") != -1;
    bool isPaid = jobJson.indexOf("\"paymentStatus\":\"paid\"") != -1;
    bool isPrinted = jobJson.indexOf("\"printed\":true") != -1;  // Check if already printed
    
    if (isApproved) approvedCount++;
    if (isPaid) paidCount++;
    if (isPrinted) printedCount++;
    
    // DEBUG: Show job details
    int idPos = jobJson.indexOf("\"id\":");
    int idStart = jobJson.indexOf(':', idPos) + 1;
    int idEnd = jobJson.indexOf(',', idStart);
    String jobId = jobJson.substring(idStart, idEnd);
    jobId.trim();
    
    Serial.print("  Job " + jobId + ": ");
    Serial.print(isApproved ? "approved " : "pending ");
    Serial.print(isPaid ? "paid " : "unpaid ");
    Serial.println(isPrinted ? "printed" : "not-printed");
    
    // Extract ticket number for ALL jobs (for display purposes)
    String ticketNum = "";
    int ticketPos = jobJson.indexOf("\"ticketNumber\":");
    if (ticketPos != -1) {
      int ticketStart = jobJson.indexOf(':', ticketPos) + 1;
      int ticketEnd = jobJson.indexOf(',', ticketStart);
      if (ticketEnd == -1) ticketEnd = jobJson.indexOf('}', ticketStart);
      ticketNum = jobJson.substring(ticketStart, ticketEnd);
      ticketNum.trim();
      ticketNum.replace("\"", "");  // Remove quotes if present
      
      // DEBUG: Show extracted ticket number
      Serial.print("    → Extracted ticket number: ");
      Serial.println(ticketNum);
    } else {
      Serial.println("    → No ticket number found in this job");
    }
    
    // Track most recent ticket number (highest ID) for display
    long jobIdNum = jobId.toInt();
    if (jobIdNum > mostRecentId && ticketNum != "") {
      mostRecentId = jobIdNum;
      mostRecentTicketNumber = ticketNum;
      Serial.print("    → NEW MOST RECENT TICKET: #");
      Serial.println(mostRecentTicketNumber);
    }
    
    if (isApproved && isPaid && !isPrinted) {  // Only process if NOT printed
      // Check if this is newer than what we've seen AND not already printed by Arduino
      if (jobIdNum > latestId && jobId != lastPrintedJobId) {
        latestId = jobIdNum;
        latestJobId = jobId;
        latestTicketNumber = ticketNum != "" ? ticketNum : "N/A";
        latestTicketNumber.replace("\"", "");  // Remove quotes if present
        
        // Extract payment ID
        int paymentIdPos = jobJson.indexOf("\"paymentId\":\"");
        int paymentIdStart = paymentIdPos + 13;
        int paymentIdEnd = jobJson.indexOf('\"', paymentIdStart);
        latestPaymentId = jobJson.substring(paymentIdStart, paymentIdEnd);
        
        // Extract file URL
        int urlPos = jobJson.indexOf("\"fileUrl\":\"");
        int urlStart = urlPos + 11;
        int urlEnd = jobJson.indexOf('\"', urlStart);
        latestFileUrl = jobJson.substring(urlStart, urlEnd);
      }
    }
    
    startPos = jobEnd + 1;
  }
  
  Serial.println("\n→ Summary:");
  Serial.println("  Total jobs: " + String(jobCount));
  Serial.println("  Approved: " + String(approvedCount));
  Serial.println("  Paid: " + String(paidCount));
  Serial.println("  Already printed: " + String(printedCount));
  Serial.println("  Last printed by Arduino: " + (lastPrintedJobId != "" ? lastPrintedJobId : "none"));
  Serial.println("  Most recent ticket: " + (mostRecentTicketNumber != "" ? "#" + mostRecentTicketNumber : "none"));
  
  // DEBUG: Show LCD update conditions
  Serial.println("\n→ LCD Update Check:");
  Serial.print("  Most recent ticket: ");
  Serial.println(mostRecentTicketNumber != "" ? mostRecentTicketNumber : "EMPTY");
  Serial.print("  Current ticket on LCD: ");
  Serial.println(currentTicketNumber != "" ? currentTicketNumber : "EMPTY");
  Serial.print("  LCD initialized: ");
  Serial.println(lcdInitialized ? "YES" : "NO");
  Serial.print("  Printing in progress: ");
  Serial.println(printingInProgress ? "YES" : "NO");
  Serial.print("  Paper detected: ");
  Serial.println(paperDetected ? "YES" : "NO");
  
  // Update LCD with most recent ticket number (force update on first run OR if ticket changed)
  bool shouldUpdate = mostRecentTicketNumber != "" && 
                      (!lcdInitialized || mostRecentTicketNumber != currentTicketNumber) && 
                      !printingInProgress && 
                      !paperDetected;
  
  Serial.print("  Should update LCD: ");
  Serial.println(shouldUpdate ? "YES" : "NO");
  
  // Update LCD with most recent ticket number
  if (shouldUpdate) {
    currentTicketNumber = mostRecentTicketNumber;
    lcdInitialized = true;
    Serial.println("\n📺 UPDATING LCD NOW...");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("LATEST TICKET");
    lcd.setCursor(0, 1);
    lcd.print("     #");
    lcd.print(currentTicketNumber);
    Serial.println("✓ LCD Updated: Displaying Ticket #" + currentTicketNumber);
  } else if (mostRecentTicketNumber == "") {
    Serial.println("  ⚠️ No ticket number found in any job");
  } else if (lcdInitialized && mostRecentTicketNumber == currentTicketNumber) {
    Serial.println("  ℹ️ Ticket already displayed on LCD");
  } else {
    Serial.println("  ⚠️ LCD update skipped (printing or paper detected)");
  }
  
  // Print only the latest job if found
  if (latestId > 0) {
    Serial.println("\n╔════════════════════════════════════════╗");
    Serial.println("║   NEW PAID JOB - TICKET #" + latestTicketNumber + "        ║");
    Serial.println("╚════════════════════════════════════════╝");
    Serial.println("  Ticket Number: #" + latestTicketNumber);
    Serial.println("  Job ID: " + latestJobId);
    Serial.println("  Payment ID: " + latestPaymentId);
    Serial.println("  File URL: " + latestFileUrl);
    
    // VERIFY PAYMENT and TRIGGER PRINT
    if (verifyPayment(latestPaymentId)) {
      triggerPrint(latestJobId, latestPaymentId, latestFileUrl, latestTicketNumber);
      lastPrintedJobId = latestJobId;  // Remember this job
      Serial.println("  ✓ Job marked as printed");
    }
  } else {
    if (lastPrintedJobId != "") {
      Serial.println("  No new jobs (last printed: " + lastPrintedJobId + ")");
    } else {
      Serial.println("  No new paid jobs");
    }
  }
  Serial.println();
}

bool verifyPayment(String paymentId) {
  Serial.println("\n→ Verifying payment: " + paymentId);
  
  // Connect to server to verify payment
  if (!client.connect(SERVER_HOST, SERVER_PORT)) {
    Serial.println("✗ Payment verification failed - connection error");
    return false;
  }
  
  // Request payment receipt
  String request = "GET /api/receipt/" + paymentId + " HTTP/1.1\r\n";
  request += "Host: " + String(SERVER_HOST) + "\r\n";
  request += "Connection: close\r\n\r\n";
  
  client.print(request);
  
  // Wait for response
  unsigned long timeout = millis();
  while (client.available() == 0) {
    if (millis() - timeout > 5000) {
      Serial.println("✗ Payment verification timeout");
      client.stop();
      return false;
    }
  }
  
  // Check HTTP status code
  String statusLine = client.readStringUntil('\n');
  bool verified = statusLine.indexOf("200 OK") != -1;
  
  client.stop();
  
  if (verified) {
    Serial.println("✓ PAYMENT VERIFIED!");
    blinkLED(2);
  } else {
    Serial.println("✗ Payment verification FAILED!");
  }
  
  return verified;
}

void triggerPrint(String jobId, String paymentId, String fileUrl, String ticketNumber) {
  Serial.println("\n╔════════════════════════════════════════╗");
  Serial.println("║   NEW JOB - TICKET #" + ticketNumber + "           ║");
  Serial.println("╚════════════════════════════════════════╝");
  
  // CRITICAL: Check if paper from previous job is still in tray BEFORE printing
  Serial.println("\n→ Checking IR sensor for old paper...");
  Serial.print("   IR Sensor Available: ");
  Serial.println(irSensorAvailable ? "YES" : "NO");
  
  if (irSensorAvailable) {
    int sensorReading = analogRead(IR_SENSOR_PIN);
    Serial.print("   IR Sensor Pin A0 Analog Reading: ");
    Serial.println(sensorReading);
    Serial.print("   Detection Threshold: 512 (");
    Serial.print(sensorReading > 512 ? "ABOVE" : "BELOW");
    Serial.println(" threshold)");
    
    bool paperPresent = isPaperDetected();
    Serial.print("   Paper Detected: ");
    Serial.println(paperPresent ? "YES ⚠️" : "NO ✓");
    
    if (paperPresent) {
      Serial.println("\n⚠️  WARNING: Previous pages still in output tray!");
      Serial.println("⚠️  Please collect them now!");
      Serial.println("⚠️  Printing will start in 5 seconds...\n");
      
      setStatusColor(STATUS_PRINTING);  // Blue LED during warning
      
      // LONG CONTINUOUS SOUND for 5 seconds as warning
      Serial.println("🔊 Playing 5-second warning tone...");
      tone(BUZZER_PIN, 2000);  // Continuous high pitch tone
      delay(5000);  // Hold for 5 seconds
      noTone(BUZZER_PIN);
      
      Serial.println("→ 5 seconds elapsed. Starting print job now...\n");
    } else {
      Serial.println("   ✓ No old paper detected. Printing immediately.\n");
    }
  } else {
    Serial.println("   ⚠️ IR Sensor not available. Printing immediately.\n");
  }
  
  Serial.println("╔════════════════════════════════════════╗");
  Serial.println("║   NOW PRINTING TICKET #" + ticketNumber + "        ║");
  Serial.println("╚════════════════════════════════════════╝");
  Serial.println("\n→ Triggering print job...");
  Serial.println("  Ticket: #" + ticketNumber);
  
  // Display ticket number on LCD
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("PRINTING TICKET");
  lcd.setCursor(0, 1);
  lcd.print("     #");
  lcd.print(ticketNumber);
  
  printingInProgress = true;
  setStatusColor(STATUS_PRINTING);  // Blue during printing
  
  // Send print command via Serial to computer with clear delimiters
  // Computer's printer-agent will listen for this
  Serial.println("\n===== PRINT_COMMAND_START =====");
  Serial.println("{");
  Serial.println("  \"jobId\": \"" + jobId + "\",");
  Serial.println("  \"ticketNumber\": \"" + ticketNumber + "\",");
  Serial.println("  \"paymentId\": \"" + paymentId + "\",");
  Serial.println("  \"fileUrl\": \"" + fileUrl + "\"");
  Serial.println("}");
  Serial.println("===== PRINT_COMMAND_END =====\n");
  
  Serial.println("\n✓ Print command sent to computer!");
  Serial.println("✓ Ticket #" + ticketNumber + " printing...");
  
  // Report back to server
  reportPrintStatus(jobId, true);
  
  // Print completed - return to idle
  printingInProgress = false;
  
  // Check if IR sensor is available and paper is detected
  if (irSensorAvailable && isPaperDetected()) {
    // Paper detected - wait for collection
    paperDetected = true;
    setStatusColor(STATUS_WAITING);  // Yellow when waiting
    lastBeepTime = millis();  // Start beep timer
    
    // Display completion message on LCD
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("TICKET #");
    lcd.print(ticketNumber);
    lcd.setCursor(0, 1);
    lcd.print("COLLECT PAGES!");
    
    Serial.println("\n╔════════════════════════════════════════╗");
    Serial.println("║   TICKET #" + ticketNumber + " COMPLETE!          ║");
    Serial.println("║   Please collect your pages!         ║");
    Serial.println("╚════════════════════════════════════════╝\n");
    
    // Play BEEP SOUND for 5 seconds after successful completion
    Serial.println("🔊 Playing 5-second completion beep...");
    unsigned long beepStart = millis();
    while (millis() - beepStart < 5000) {
      // Beep pattern: 200ms on, 200ms off
      unsigned long elapsed = millis() - beepStart;
      if ((elapsed % 400) < 200) {
        tone(BUZZER_PIN, 1500);  // Medium pitch beep
      } else {
        noTone(BUZZER_PIN);
      }
      delay(50);
    }
    noTone(BUZZER_PIN);
    
    Serial.println("⏳ Waiting for paper collection...");
  } else {
    // No IR sensor or no paper detected - just go back to idle
    setStatusColor(STATUS_IDLE);  // Green when done
    
    // Display completion message on LCD
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("TICKET #");
    lcd.print(ticketNumber);
    lcd.setCursor(0, 1);
    lcd.print("   COMPLETE!   ");
    
    Serial.println("\n╔════════════════════════════════════════╗");
    Serial.println("║   TICKET #" + ticketNumber + " COMPLETE!          ║");
    Serial.println("║   Please collect your pages!         ║");
    Serial.println("╚════════════════════════════════════════╝\n");
    
    // Play BEEP SOUND for 5 seconds after successful completion
    Serial.println("🔊 Playing 5-second completion beep...");
    unsigned long beepStart = millis();
    while (millis() - beepStart < 5000) {
      // Beep pattern: 200ms on, 200ms off
      unsigned long elapsed = millis() - beepStart;
      if ((elapsed % 400) < 200) {
        tone(BUZZER_PIN, 1500);  // Medium pitch beep
      } else {
        noTone(BUZZER_PIN);
      }
      delay(50);
    }
    noTone(BUZZER_PIN);
    
    delay(1000);
    
    Serial.println("✓ Ready for next job\n");
  }
}

void reportPrintStatus(String jobId, bool success) {
  Serial.println("→ Reporting print status to server...");
  
  if (!client.connect(SERVER_HOST, SERVER_PORT)) {
    Serial.println("✗ Failed to connect to server for status update");
    return;
  }
  
  // Send POST request to mark job as printed
  String postData = "{\"printed\":true}";
  
  client.println("POST /api/jobs/" + jobId + "/printed HTTP/1.1");
  client.print("Host: ");
  client.println(SERVER_HOST);
  client.println("Content-Type: application/json");
  client.print("Content-Length: ");
  client.println(postData.length());
  client.println("Connection: close");
  client.println();
  client.println(postData);
  
  // Wait for response
  unsigned long timeout = millis();
  while (client.available() == 0) {
    if (millis() - timeout > 5000) {
      Serial.println("✗ Server timeout on status update");
      client.stop();
      return;
    }
  }
  
  // Check response
  String statusLine = client.readStringUntil('\n');
  if (statusLine.indexOf("200") != -1) {
    Serial.println("✓ Server updated: Job " + jobId + " marked as printed");
  } else {
    Serial.println("⚠ Server response: " + statusLine);
  }
  
  client.stop();
}

// ============ HELPER FUNCTIONS ============

void connectWiFi() {
  Serial.print("→ Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi connected!");
    Serial.print("  IP address: ");
    Serial.println(WiFi.localIP());
    Serial.print("  Signal strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("\n✗ WiFi connection failed!");
    Serial.println("  Check SSID and password");
    Serial.println("  Ensure 2.4GHz WiFi (R4 doesn't support 5GHz)");
  }
}

void blinkLED(int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(200);
    digitalWrite(LED_PIN, LOW);
    delay(200);
  }
}

// ============ STATUS LED FUNCTIONS ============

void setStatusColor(SystemStatus status) {
  currentStatus = status;
  
  switch (status) {
    case STATUS_IDLE:
      // Green - System ready/available
      analogWrite(LED_RED_PIN, 0);
      analogWrite(LED_GREEN_PIN, 255);
      analogWrite(LED_BLUE_PIN, 0);
      Serial.println("💚 Status: IDLE (Ready)");
      break;
      
    case STATUS_PRINTING:
      // Blue - Printing in progress
      analogWrite(LED_RED_PIN, 0);
      analogWrite(LED_GREEN_PIN, 0);
      analogWrite(LED_BLUE_PIN, 255);
      Serial.println("💙 Status: PRINTING");
      break;
      
    case STATUS_WAITING:
      // Yellow - Waiting for paper collection
      analogWrite(LED_RED_PIN, 255);
      analogWrite(LED_GREEN_PIN, 255);
      analogWrite(LED_BLUE_PIN, 0);
      Serial.println("💛 Status: WAITING (Collect pages)");
      break;
      
    case STATUS_ERROR:
      // Red - Error/Not working
      analogWrite(LED_RED_PIN, 255);
      analogWrite(LED_GREEN_PIN, 0);
      analogWrite(LED_BLUE_PIN, 0);
      Serial.println("❤️ Status: ERROR");
      break;
  }
}

// ============ BUZZER FUNCTIONS ============

void playCollectionReminderTone() {
  // Gentle reminder beep to collect pages
  Serial.println("🔊 Reminder: Please collect your pages");
  
  // Three short medium-pitched beeps
  for (int i = 0; i < 3; i++) {
    tone(BUZZER_PIN, 1500, 100);  // 1500 Hz for 100ms
    delay(150);
  }
  noTone(BUZZER_PIN);
}

void playErrorTone() {
  // Low frequency beep for errors
  Serial.println("🔊 Playing error tone");
  
  // Two long low-pitched beeps
  for (int i = 0; i < 2; i++) {
    tone(BUZZER_PIN, 500, 300);  // 500 Hz for 300ms
    delay(400);
  }
  noTone(BUZZER_PIN);
}

void playStartupTone() {
  // Ascending tone for startup
  Serial.println("🔊 Playing startup tone");
  
  tone(BUZZER_PIN, 1000, 100);
  delay(150);
  tone(BUZZER_PIN, 1500, 100);
  delay(150);
  tone(BUZZER_PIN, 2000, 200);
  delay(250);
  noTone(BUZZER_PIN);
}

// ============ IR SENSOR FUNCTIONS ============

void checkIRSensor() {
  // Check if IR sensor is connected by reading the analog pin
  
  Serial.println("→ Initializing IR sensor...");
  Serial.println("  Pin: A0 (Analog)");
  Serial.println("  Mode: INPUT");
  
  // Read initial sensor state (analog value 0-1023)
  int initialValue = analogRead(IR_SENSOR_PIN);
  Serial.print("  Initial analog value: ");
  Serial.println(initialValue);
  
  // Always enable IR sensor - user will position it correctly
  irSensorAvailable = true;
  
  Serial.println("✓ IR sensor ENABLED on pin A0");
  Serial.println("  HIGH value (>512) = Paper detected");
  Serial.println("  LOW value (<512) = No paper");
  Serial.println("  Position sensor near output tray to detect pages\n");
  
  // Test sensor for 3 seconds
  Serial.println("📊 Testing IR sensor for 3 seconds...");
  Serial.println("   (Place/remove paper to test detection)\n");
  
  unsigned long testStart = millis();
  int lastValue = -1;
  
  while (millis() - testStart < 3000) {
    int currentValue = analogRead(IR_SENSOR_PIN);
    
    // Only report significant changes (>50 difference)
    if (abs(currentValue - lastValue) > 50) {
      Serial.print("   [");
      Serial.print((millis() - testStart) / 1000.0, 1);
      Serial.print("s] Analog value: ");
      Serial.print(currentValue);
      
      if (currentValue > 512) {
        Serial.println(" → ⚠️ PAPER DETECTED ⚠️");
      } else {
        Serial.println(" → ✓ NO PAPER");
      }
      
      lastValue = currentValue;
    }
    
    delay(50);
  }
  
  // Show final state
  int finalValue = analogRead(IR_SENSOR_PIN);
  Serial.println("\n✓ IR sensor test complete");
  Serial.print("   Final value: ");
  Serial.print(finalValue);
  if (finalValue > 512) {
    Serial.println(" → ⚠️ PAPER CURRENTLY DETECTED");
  } else {
    Serial.println(" → ✓ NO PAPER");
  }
  Serial.println();
}

bool isPaperDetected() {
  // IR sensor detection based on analog value
  
  if (!irSensorAvailable) {
    return false;  // No sensor, no paper
  }
  
  // Read analog sensor value (0-1023)
  int sensorValue = analogRead(IR_SENSOR_PIN);
  bool paperPresent = (sensorValue > 512);  // Threshold at midpoint
  
  // Debug output - ALWAYS show this
  Serial.println("════════════════════════════════════════");
  Serial.print("🔍 IR SENSOR CHECK: ");
  Serial.println(paperPresent ? "⚠️ PAPER DETECTED ⚠️" : "✓ NO PAPER (Tray empty)");
  Serial.print("   Pin A0 analog value: ");
  Serial.println(sensorValue);
  Serial.print("   Threshold: 512 (");
  Serial.print(paperPresent ? "ABOVE" : "BELOW");
  Serial.println(" threshold)");
  Serial.println("════════════════════════════════════════");
  
  return paperPresent;
}