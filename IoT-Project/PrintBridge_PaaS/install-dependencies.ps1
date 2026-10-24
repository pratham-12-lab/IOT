# =====================================================================
# PrintBridge-PaaS - Automated Dependency Installation Script
# =====================================================================
# PowerShell script to install all dependencies and verify setup
# Run as: .\install-dependencies.ps1
# =====================================================================

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         PrintBridge-PaaS Dependency Installer            ║" -ForegroundColor Cyan
Write-Host "║              Automated Setup Script v1.0                 ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Function to check if a command exists
function Test-Command {
    param($Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

# Function to display section headers
function Write-Section {
    param($Title)
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host " $Title" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host ""
}

# Step 1: Check Prerequisites
Write-Section "Step 1: Checking Prerequisites"

# Check Node.js
Write-Host "Checking Node.js..." -NoNewline
if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Host " ✓ Found: $nodeVersion" -ForegroundColor Green
    
    # Check if version is >= 14.0.0
    $versionNumber = [version]($nodeVersion.TrimStart('v'))
    if ($versionNumber -lt [version]"14.0.0") {
        Write-Host "  ⚠ Warning: Node.js version should be 14.0.0 or higher" -ForegroundColor Yellow
        Write-Host "  Current version: $nodeVersion" -ForegroundColor Yellow
        Write-Host "  Download from: https://nodejs.org/" -ForegroundColor Yellow
    }
} else {
    Write-Host " ✗ Not Found" -ForegroundColor Red
    Write-Host "  Please install Node.js (v14+) from: https://nodejs.org/" -ForegroundColor Red
    Write-Host "  After installation, restart this script." -ForegroundColor Red
    exit 1
}

# Check npm
Write-Host "Checking npm..." -NoNewline
if (Test-Command "npm") {
    $npmVersion = npm --version
    Write-Host " ✓ Found: v$npmVersion" -ForegroundColor Green
} else {
    Write-Host " ✗ Not Found" -ForegroundColor Red
    Write-Host "  npm should come with Node.js. Please reinstall Node.js." -ForegroundColor Red
    exit 1
}

# Check Git (optional but recommended)
Write-Host "Checking Git (optional)..." -NoNewline
if (Test-Command "git") {
    $gitVersion = git --version
    Write-Host " ✓ Found: $gitVersion" -ForegroundColor Green
} else {
    Write-Host " ✗ Not Found (Optional)" -ForegroundColor Yellow
    Write-Host "  Git is optional but recommended for version control" -ForegroundColor Yellow
}

# Step 2: Install Node.js Dependencies
Write-Section "Step 2: Installing Node.js Dependencies"

Write-Host "Installing npm packages..." -ForegroundColor Cyan
Write-Host ""

# Clear npm cache if this is a retry
if (Test-Path "node_modules") {
    Write-Host "Existing node_modules folder found." -ForegroundColor Yellow
    $response = Read-Host "Do you want to reinstall? (Y/N)"
    if ($response -eq "Y" -or $response -eq "y") {
        Write-Host "Removing old node_modules..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
        Remove-Item "package-lock.json" -ErrorAction SilentlyContinue
    }
}

# Run npm install
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ All dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "✗ npm install failed!" -ForegroundColor Red
    Write-Host "  Try running: npm cache clean --force" -ForegroundColor Yellow
    Write-Host "  Then run this script again." -ForegroundColor Yellow
    exit 1
}

# Step 3: Verify Installed Packages
Write-Section "Step 3: Verifying Installed Packages"

$requiredPackages = @{
    "express" = "^4.18.2"
    "cloudinary" = "^1.41.0"
    "dotenv" = "^16.3.1"
    "pdf-parse" = "^1.1.1"
    "pdfkit" = "^0.13.0"
    "uuid" = "^9.0.1"
    "axios" = "^1.6.2"
    "cors" = "^2.8.5"
}

Write-Host "Checking installed packages:" -ForegroundColor Cyan
Write-Host ""

$allInstalled = $true
foreach ($package in $requiredPackages.Keys) {
    Write-Host "  $package" -NoNewline
    $version = npm list $package --depth=0 2>$null | Select-String -Pattern "$package@"
    if ($version) {
        Write-Host " ✓" -ForegroundColor Green
    } else {
        Write-Host " ✗" -ForegroundColor Red
        $allInstalled = $false
    }
}

Write-Host ""
if ($allInstalled) {
    Write-Host "✓ All required packages are installed!" -ForegroundColor Green
} else {
    Write-Host "⚠ Some packages are missing. Run 'npm install' again." -ForegroundColor Yellow
}

# Step 4: Check Environment Configuration
Write-Section "Step 4: Checking Environment Configuration"

if (Test-Path ".env") {
    Write-Host "✓ .env file found" -ForegroundColor Green
    
    # Check if credentials are filled in
    $envContent = Get-Content ".env" -Raw
    
    Write-Host ""
    Write-Host "Checking environment variables:" -ForegroundColor Cyan
    
    $checks = @{
        "CLOUDINARY_CLOUD_NAME" = "Cloudinary Cloud Name"
        "CLOUDINARY_API_KEY" = "Cloudinary API Key"
        "CLOUDINARY_API_SECRET" = "Cloudinary API Secret"
        "THINGSPEAK_WRITE_KEY" = "ThingSpeak Write Key"
        "THINGSPEAK_CHANNEL_ID" = "ThingSpeak Channel ID"
    }
    
    $needsConfiguration = $false
    foreach ($key in $checks.Keys) {
        Write-Host "  $($checks[$key])..." -NoNewline
        if ($envContent -match "$key=your_") {
            Write-Host " ⚠ Not configured" -ForegroundColor Yellow
            $needsConfiguration = $true
        } elseif ($envContent -match "$key=\s*$") {
            Write-Host " ⚠ Empty" -ForegroundColor Yellow
            $needsConfiguration = $true
        } else {
            Write-Host " ✓ Set" -ForegroundColor Green
        }
    }
    
    Write-Host ""
    if ($needsConfiguration) {
        Write-Host "⚠ Action Required: Edit .env file and add your credentials" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  1. Cloudinary: https://console.cloudinary.com/" -ForegroundColor Cyan
        Write-Host "  2. ThingSpeak: https://thingspeak.com/" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "  See SETUP_INSTRUCTIONS.md for detailed steps" -ForegroundColor Cyan
    } else {
        Write-Host "✓ All environment variables are configured!" -ForegroundColor Green
    }
    
} else {
    Write-Host "✗ .env file not found" -ForegroundColor Red
    Write-Host "  The .env file should have been created." -ForegroundColor Yellow
    Write-Host "  Check if it exists in the PrintBridge_PaaS directory." -ForegroundColor Yellow
}

# Step 5: Check Arduino Setup
Write-Section "Step 5: Checking Arduino Setup (Optional)"

Write-Host "Arduino IDE is required to program the Arduino Uno R4 WiFi" -ForegroundColor Cyan
Write-Host ""
Write-Host "Required:" -ForegroundColor Yellow
Write-Host "  • Arduino IDE (latest version)" -ForegroundColor White
Write-Host "  • Arduino UNO R4 Boards support" -ForegroundColor White
Write-Host "  • ArduinoJson library" -ForegroundColor White
Write-Host "  • LiquidCrystal library (optional, for LCD)" -ForegroundColor White
Write-Host ""
Write-Host "Download Arduino IDE: https://www.arduino.cc/en/software" -ForegroundColor Cyan

# Step 6: Check Printer Setup
Write-Section "Step 6: Checking Printer Setup"

Write-Host "Checking for HP LaserJet Professional P1108..." -ForegroundColor Cyan
Write-Host ""

$printers = Get-Printer -ErrorAction SilentlyContinue

if ($printers) {
    Write-Host "Installed Printers:" -ForegroundColor Green
    foreach ($printer in $printers) {
        $status = if ($printer.PrinterStatus -eq 0) { "Ready" } else { "Not Ready" }
        Write-Host "  • $($printer.Name) - $status" -ForegroundColor White
        
        if ($printer.Name -like "*P1108*" -or $printer.Name -like "*HP LaserJet*") {
            Write-Host "    ✓ This might be your target printer!" -ForegroundColor Green
            Write-Host "    Update printer-agent/config.js with exact name: $($printer.Name)" -ForegroundColor Cyan
        }
    }
    
    Write-Host ""
    Write-Host "If HP LaserJet P1108 is not listed above:" -ForegroundColor Yellow
    Write-Host "  1. Connect printer via USB" -ForegroundColor White
    Write-Host "  2. Install HP LaserJet P1108 drivers" -ForegroundColor White
    Write-Host "  3. Run this script again to verify" -ForegroundColor White
    
} else {
    Write-Host "⚠ No printers found or unable to query printer list" -ForegroundColor Yellow
    Write-Host "  Make sure HP LaserJet P1108 is:" -ForegroundColor White
    Write-Host "    • Connected via USB" -ForegroundColor White
    Write-Host "    • Powered on" -ForegroundColor White
    Write-Host "    • Drivers installed" -ForegroundColor White
}

# Step 7: Directory Structure Check
Write-Section "Step 7: Checking Directory Structure"

$requiredDirs = @(
    "server",
    "ui",
    "printer-agent",
    "arduino"
)

Write-Host "Checking project directories:" -ForegroundColor Cyan
$allDirsExist = $true
foreach ($dir in $requiredDirs) {
    Write-Host "  $dir" -NoNewline
    if (Test-Path $dir) {
        Write-Host " ✓" -ForegroundColor Green
    } else {
        Write-Host " ✗" -ForegroundColor Red
        $allDirsExist = $false
    }
}

Write-Host ""
if ($allDirsExist) {
    Write-Host "✓ All required directories exist!" -ForegroundColor Green
} else {
    Write-Host "✗ Some directories are missing. Check project structure." -ForegroundColor Red
}

# Step 8: Create downloads directory for printer agent
Write-Section "Step 8: Creating Required Directories"

$downloadsDir = "printer-agent\downloads"
if (-not (Test-Path $downloadsDir)) {
    New-Item -ItemType Directory -Path $downloadsDir -Force | Out-Null
    Write-Host "✓ Created: $downloadsDir" -ForegroundColor Green
} else {
    Write-Host "✓ Already exists: $downloadsDir" -ForegroundColor Green
}

# Final Summary
Write-Section "Installation Summary"

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                   INSTALLATION COMPLETE                    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Configure .env file with your credentials:" -ForegroundColor White
Write-Host "   • Cloudinary: https://console.cloudinary.com/" -ForegroundColor Cyan
Write-Host "   • ThingSpeak: https://thingspeak.com/" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Configure Arduino:" -ForegroundColor White
Write-Host "   • Edit arduino/PrintBridge_A4_Printer.ino" -ForegroundColor Cyan
Write-Host "   • Update WiFi SSID and password" -ForegroundColor Cyan
Write-Host "   • Update server host (your computer's IP)" -ForegroundColor Cyan
Write-Host "   • Upload to Arduino Uno R4 WiFi" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Update printer configuration:" -ForegroundColor White
Write-Host "   • Edit printer-agent/config.js" -ForegroundColor Cyan
Write-Host "   • Set PRINTER_NAME to exact printer name from list above" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Start the system:" -ForegroundColor White
Write-Host "   Terminal 1: node server/index.js" -ForegroundColor Cyan
Write-Host "   Terminal 2: node printer-agent/agent.js" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. Access the portal:" -ForegroundColor White
Write-Host "   http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Yellow
Write-Host "   • QUICK_START.md - Fast setup guide" -ForegroundColor Cyan
Write-Host "   • SETUP_INSTRUCTIONS.md - Detailed instructions" -ForegroundColor Cyan
Write-Host "   • README.md - Complete project documentation" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ Installation script complete!" -ForegroundColor Green
Write-Host ""

# Pause at the end
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
