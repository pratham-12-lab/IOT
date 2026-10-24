const canvas = document.getElementById('arch');
const ctx = canvas.getContext('2d');
const logArea = document.getElementById('logArea');
const stepOverlay = document.getElementById('stepOverlay');
const stepBar = document.getElementById('stepBar');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');
const speedSel = document.getElementById('speedSel');

let W, H, nodes, edges;
let paused = false;
let stepTimer = null;
let animFrame = null;
let speedMult = 1;
let activeNodes = new Set();
let doneNodes = new Set();
let glowPulse = 0;

const COLORS = {
  teal: '#00e5c0', purple: '#a87fd4', amber: '#ffc24b',
  coral: '#ff6b5b', green: '#00e676', blue: '#4fc3f7',
  muted: '#4a6080', bg2: '#0d1829', bg3: '#111f35',
  border: 'rgba(255,255,255,0.08)', text: '#e0e8f5'
};

function resize() {
  const area = canvas.parentElement;
  W = canvas.width = area.clientWidth - 48;
  H = canvas.height = area.clientHeight - 48;
  buildLayout();
}

function buildLayout() {
  const cx = W / 2;
  
  // PrintBridge-PaaS Architecture Nodes
  nodes = [
    { id: 'browser',   label: 'Web Browser',     sub: 'customer.html',       x: cx*0.15, y: H*0.10, col: COLORS.teal,   icon: '🌐' },
    { id: 'server',    label: 'Node.js Server',  sub: 'Express + Routes',    x: cx*0.75, y: H*0.10, col: COLORS.purple, icon: '☁️' },
    { id: 'cloudinary',label: 'Cloudinary',      sub: 'PDF Storage',         x: cx*1.35, y: H*0.10, col: COLORS.purple, icon: '📦' },
    { id: 'pdfparse',  label: 'PDF Analyzer',    sub: 'pdf-parse lib',       x: cx*0.75, y: H*0.32, col: COLORS.purple, icon: '📄' },
    { id: 'razorpay',  label: 'Razorpay',        sub: 'Payment Gateway',     x: cx*0.15, y: H*0.50, col: COLORS.amber,  icon: '💳' },
    { id: 'jobs',      label: 'Jobs Queue',      sub: 'In-memory store',     x: cx*0.75, y: H*0.50, col: COLORS.purple, icon: '📋' },
    { id: 'thingspeak',label: 'ThingSpeak',      sub: 'IoT Analytics',       x: cx*1.35, y: H*0.50, col: COLORS.blue,   icon: '📊' },
    { id: 'arduino',   label: 'Arduino R4 WiFi', sub: 'IoT Controller',      x: cx*0.75, y: H*0.72, col: COLORS.coral,  icon: '🔧' },
    { id: 'agent',     label: 'Printer Agent',   sub: 'Node.js daemon',      x: cx*1.35, y: H*0.72, col: COLORS.coral,  icon: '🖥️' },
    { id: 'printer',   label: 'HP LaserJet',     sub: 'P1108 Printer',       x: cx*1.70, y: H*0.88, col: COLORS.coral,  icon: '🖨️' },
  ];
  
  edges = [
    { from: 'browser',    to: 'server',     col: COLORS.teal,   label: 'Upload PDF',      dash: false },
    { from: 'server',     to: 'cloudinary', col: COLORS.purple, label: 'Store',           dash: false },
    { from: 'cloudinary', to: 'pdfparse',   col: COLORS.purple, label: 'Download',        dash: false },
    { from: 'pdfparse',   to: 'jobs',       col: COLORS.purple, label: 'Create job',      dash: false },
    { from: 'browser',    to: 'razorpay',   col: COLORS.amber,  label: 'Pay',             dash: false },
    { from: 'razorpay',   to: 'jobs',       col: COLORS.amber,  label: 'Confirm',         dash: false },
    { from: 'jobs',       to: 'thingspeak', col: COLORS.blue,   label: 'Metrics',         dash: true  },
    { from: 'arduino',    to: 'jobs',       col: COLORS.coral,  label: 'Poll',            dash: true  },
    { from: 'jobs',       to: 'arduino',    col: COLORS.coral,  label: 'Job data',        dash: false },
    { from: 'arduino',    to: 'agent',      col: COLORS.coral,  label: 'Trigger',         dash: false },
    { from: 'agent',      to: 'cloudinary', col: COLORS.coral,  label: 'Download PDF',    dash: true  },
    { from: 'agent',      to: 'printer',    col: COLORS.coral,  label: 'Print',           dash: false },
  ];
}

function nodeByID(id) { return nodes.find(n => n.id === id); }

function drawNode(n, alpha = 1) {
  const r = Math.min(W, H) * 0.055;
  const isActive = activeNodes.has(n.id);
  const isDone = doneNodes.has(n.id);
  
  ctx.save();
  ctx.globalAlpha = alpha;
  
  // Glow for active
  if (isActive) {
    const grad = ctx.createRadialGradient(n.x, n.y, r*0.5, n.x, n.y, r*2.2);
    grad.addColorStop(0, n.col + '55');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(n.x, n.y, r*2.2, 0, Math.PI*2); ctx.fill();
  }
  
  // Outer ring
  ctx.beginPath(); ctx.arc(n.x, n.y, r+3, 0, Math.PI*2);
  ctx.strokeStyle = isActive ? n.col : (isDone ? COLORS.green : COLORS.border);
  ctx.lineWidth = isActive ? 2 : 1;
  if (isActive) {
    const dash = (glowPulse * 2) % 20;
    ctx.setLineDash([8, 4]);
    ctx.lineDashOffset = -dash;
  } else {
    ctx.setLineDash([]);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Main circle
  const bg = ctx.createRadialGradient(n.x - r*0.2, n.y - r*0.2, 0, n.x, n.y, r);
  bg.addColorStop(0, isDone ? '#0d2a1e' : isActive ? n.col + '22' : COLORS.bg3);
  bg.addColorStop(1, isDone ? '#071510' : isActive ? n.col + '11' : COLORS.bg2);
  ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI*2);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = isDone ? COLORS.green : isActive ? n.col : COLORS.border;
  ctx.lineWidth = isDone || isActive ? 1.5 : 0.5;
  ctx.stroke();
  
  // Icon
  ctx.font = `${r*0.6}px serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(n.icon, n.x, n.y - r*0.18);
  
  // Label
  ctx.font = `600 ${r*0.28}px Outfit, sans-serif`;
  ctx.fillStyle = isActive ? n.col : isDone ? COLORS.green : COLORS.text;
  ctx.fillText(n.label, n.x, n.y + r*0.38);
  
  // Sub
  ctx.font = `${r*0.22}px Outfit, sans-serif`;
  ctx.fillStyle = COLORS.muted;
  ctx.fillText(n.sub, n.x, n.y + r*0.6);
  
  ctx.restore();
}

function drawEdge(e, alpha = 0.15) {
  const a = nodeByID(e.from), b = nodeByID(e.to);
  if (!a || !b) return;
  const r = Math.min(W, H) * 0.055;
  const dx = b.x - a.x, dy = b.y - a.y;
  const dist = Math.sqrt(dx*dx + dy*dy);
  const ux = dx/dist, uy = dy/dist;
  const x1 = a.x + ux*(r+3), y1 = a.y + uy*(r+3);
  const x2 = b.x - ux*(r+8), y2 = b.y - uy*(r+8);
  
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = e.col;
  ctx.lineWidth = 1;
  ctx.setLineDash(e.dash ? [5,4] : []);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  
  // Arrowhead
  const ang = Math.atan2(y2-y1, x2-x1);
  ctx.setLineDash([]);
  ctx.fillStyle = e.col;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 8*Math.cos(ang-0.4), y2 - 8*Math.sin(ang-0.4));
  ctx.lineTo(x2 - 8*Math.cos(ang+0.4), y2 - 8*Math.sin(ang+0.4));
  ctx.closePath(); ctx.fill();
  
  ctx.restore();
}

// Packet animation class
class Packet {
  constructor(fromID, toID, col, label, onDone) {
    const a = nodeByID(fromID), b = nodeByID(toID);
    this.x0 = a.x; this.y0 = a.y;
    this.x1 = b.x; this.y1 = b.y;
    this.col = col;
    this.label = label;
    this.t = 0;
    this.onDone = onDone;
    this.done = false;
  }
  update() {
    if (this.done) return;
    this.t += 0.018 * speedMult;
    if (this.t >= 1) { this.t = 1; this.done = true; if(this.onDone) this.onDone(); }
  }
  draw() {
    if (this.done) return;
    const ease = this.t < 0.5 ? 2*this.t*this.t : -1+(4-2*this.t)*this.t;
    const x = this.x0 + (this.x1 - this.x0) * ease;
    const y = this.y0 + (this.y1 - this.y0) * ease;
    const pr = 5;
    
    // Trail
    for (let i = 1; i <= 6; i++) {
      const et = Math.max(0, ease - i*0.04);
      const tx = this.x0 + (this.x1 - this.x0) * et;
      const ty = this.y0 + (this.y1 - this.y0) * et;
      ctx.beginPath(); ctx.arc(tx, ty, pr * (1 - i/7), 0, Math.PI*2);
      ctx.fillStyle = this.col;
      ctx.globalAlpha = (1 - i/7) * 0.35;
      ctx.fill();
    }
    
    // Main dot
    ctx.globalAlpha = 1;
    const g = ctx.createRadialGradient(x, y, 0, x, y, pr*2);
    g.addColorStop(0, '#fff');
    g.addColorStop(0.3, this.col);
    g.addColorStop(1, this.col + '00');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, pr*2, 0, Math.PI*2); ctx.fill();
    
    ctx.fillStyle = '#fff'; ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(x, y, pr*0.6, 0, Math.PI*2); ctx.fill();
    
    // Label
    if (this.label) {
      ctx.font = '10px Space Mono, monospace';
      ctx.fillStyle = this.col;
      ctx.textAlign = 'center';
      ctx.fillText(this.label, x, y - pr*2.5);
    }
    ctx.globalAlpha = 1;
  }
}

let packets = [];

function draw() {
  ctx.clearRect(0, 0, W, H);
  glowPulse++;
  
  // Draw all edges dim
  edges.forEach(e => drawEdge(e, 0.15));
  
  // Draw nodes
  nodes.forEach(n => drawNode(n));
  
  // Draw packets
  packets.forEach(p => p.draw());
  packets = packets.filter(p => !p.done);
  if (!paused) packets.forEach(p => p.update());
  
  animFrame = requestAnimationFrame(draw);
}

// Steps definition - PrintBridge-PaaS flow
const STEPS = [
  {
    title: 'User Uploads PDF',
    desc: 'Customer selects PDF on customer.html',
    fn: () => {
      addLog('user', 'BROWSER', 'User selects PDF: "notes.pdf"', 'File size: 2.3 MB');
      setActiveNode('browser');
      setTimeout(() => {
        packets.push(new Packet('browser', 'server', COLORS.teal, 'PDF upload', () => {
          setActiveNode('server');
          addLog('server', 'SERVER', 'PDF received via POST /api/upload', 'Content-Type: application/pdf');
        }));
      }, 400);
    }
  },
  {
    title: 'Upload to Cloudinary',
    desc: 'Server uploads PDF to cloud storage',
    fn: () => {
      addLog('server', 'CLOUDINARY', 'Uploading to cloud...', 'cloudinary.uploader.upload()');
      setTimeout(() => {
        packets.push(new Packet('server', 'cloudinary', COLORS.purple, 'PDF bytes', () => {
          setActiveNode('cloudinary');
          addLog('server', 'CLOUDINARY', 'Upload successful!', 'URL: https://res.cloudinary.com/.../notes.pdf');
          setStats('—', '—', 'Uploaded', '—');
        }));
      }, 300);
    }
  },
  {
    title: 'Analyze PDF',
    desc: 'Count pages using pdf-parse',
    fn: () => {
      addLog('server', 'PDF-PARSE', 'Downloading PDF for analysis...', 'axios.get(cloudinaryURL)');
      setTimeout(() => {
        packets.push(new Packet('cloudinary', 'pdfparse', COLORS.purple, 'download', () => {
          setActiveNode('pdfparse');
          addLog('server', 'PDF-PARSE', 'Counting pages...', 'pdfParse(buffer) → 5 pages');
          setStats('5', '—', 'Analyzing', '—');
        }));
      }, 500);
    }
  },
  {
    title: 'Create Print Job',
    desc: 'Job saved with ticket number',
    fn: () => {
      const ticketNum = 1000 + Math.floor(Math.random() * 100);
      addLog('server', 'JOBS', 'Creating print job...', `Ticket #${ticketNum} | 5 pages | Status: pending`);
      setTimeout(() => {
        packets.push(new Packet('pdfparse', 'jobs', COLORS.purple, 'create job', () => {
          setActiveNode('jobs');
          addLog('server', 'JOBS', 'Job created successfully', `ID: ${Date.now()} | Ticket: #${ticketNum}`);
          setStats('5', '₹10.00', 'Pending Pay', `#${ticketNum}`);
        }));
      }, 400);
    }
  },
  {
    title: 'Calculate Price',
    desc: '5 pages × ₹2 = ₹10.00',
    fn: () => {
      addLog('server', 'PRICING', 'Calculating print cost', '5 pages × ₹2.00 (B&W) = ₹10.00');
      setStats('5', '₹10.00', 'Ready to Pay', document.getElementById('statTicket').textContent);
    }
  },
  {
    title: 'User Pays',
    desc: 'Payment via Razorpay gateway',
    fn: () => {
      addLog('payment', 'RAZORPAY', 'User clicks "Pay Now"', 'Opening Razorpay payment modal...');
      setTimeout(() => {
        packets.push(new Packet('browser', 'razorpay', COLORS.amber, 'pay ₹10', () => {
          setActiveNode('razorpay');
          addLog('payment', 'RAZORPAY', 'Payment processing...', 'Method: UPI (GPay)');
          setTimeout(() => {
            addLog('payment', 'RAZORPAY', 'Payment successful!', 'pay_QkL8mN3j2 | ₹10.00 | SUCCESS');
          }, 800);
        }));
      }, 500);
    }
  },
  {
    title: 'Payment Confirmed',
    desc: 'Job status updated to paid',
    fn: () => {
      setTimeout(() => {
        packets.push(new Packet('razorpay', 'jobs', COLORS.amber, 'confirmed', () => {
          addLog('server', 'JOBS', 'Job approved for printing', 'Status: approved | Payment: paid');
          setStats('5', '₹10.00', 'PAID ✓', document.getElementById('statTicket').textContent);
          doneNodes.add('browser');
          doneNodes.add('razorpay');
          activeNodes.delete('browser');
          activeNodes.delete('razorpay');
        }));
      }, 400);
    }
  },
  {
    title: 'ThingSpeak Update',
    desc: 'Send metrics to IoT analytics',
    fn: () => {
      addLog('server', 'THINGSPEAK', 'Sending metrics...', 'POST https://api.thingspeak.com/update');
      setTimeout(() => {
        packets.push(new Packet('jobs', 'thingspeak', COLORS.blue, 'metrics', () => {
          setActiveNode('thingspeak');
          addLog('server', 'THINGSPEAK', 'Data sent successfully', 'Entry #1234 | Latest ticket updated');
          doneNodes.add('thingspeak');
          activeNodes.delete('thingspeak');
        }));
      }, 300);
    }
  },
  {
    title: 'Arduino Polls Server',
    desc: 'IoT controller checks for jobs',
    fn: () => {
      addLog('hw', 'ARDUINO', 'Polling server...', 'GET https://server.com/api/jobs');
      setActiveNode('arduino');
      setTimeout(() => {
        packets.push(new Packet('arduino', 'jobs', COLORS.coral, 'poll', () => {
          addLog('hw', 'ARDUINO', 'Checking for paid jobs...', 'WiFi connected | Polling every 5s');
        }));
      }, 400);
    }
  },
  {
    title: 'Job Found!',
    desc: 'Arduino detects paid job',
    fn: () => {
      setTimeout(() => {
        packets.push(new Packet('jobs', 'arduino', COLORS.coral, 'job data', () => {
          addLog('hw', 'ARDUINO', 'PAID JOB FOUND!', `Ticket #${document.getElementById('statTicket').textContent} | 5 pages`);
          addLog('hw', 'ARDUINO', 'Verifying payment...', 'GET /api/receipt/:paymentId');
          setTimeout(() => {
            addLog('hw', 'ARDUINO', 'PAYMENT VERIFIED ✓', 'Triggering print job...');
            setStats('5', '₹10.00', 'Printing...', document.getElementById('statTicket').textContent);
          }, 600);
        }));
      }, 500);
    }
  },
  {
    title: 'Trigger Printer Agent',
    desc: 'Arduino signals computer',
    fn: () => {
      setTimeout(() => {
        packets.push(new Packet('arduino', 'agent', COLORS.coral, 'trigger', () => {
          setActiveNode('agent');
          addLog('hw', 'AGENT', 'Printer agent activated', 'Downloading PDF from Cloudinary...');
          setTimeout(() => {
            packets.push(new Packet('agent', 'cloudinary', COLORS.coral, 'download', () => {
              addLog('hw', 'AGENT', 'PDF downloaded', 'File: job_1234567890.pdf | 2.3 MB');
            }));
          }, 300);
        }));
      }, 400);
    }
  },
  {
    title: 'Print Document!',
    desc: 'HP LaserJet P1108 printing',
    fn: () => {
      setTimeout(() => {
        packets.push(new Packet('agent', 'printer', COLORS.coral, 'print', () => {
          setActiveNode('printer');
          addLog('hw', 'PRINTER', 'Printing on HP LaserJet P1108...', 'Command: SumatraPDF -print-to "HP LaserJet"');
          setTimeout(() => {
            addLog('success', 'COMPLETE', 'Document printed successfully!', `Ticket #${document.getElementById('statTicket').textContent} | 5 pages | B&W`);
            setStats('5', '₹10.00', 'PRINTED ✓', document.getElementById('statTicket').textContent);
            doneNodes.add('server');
            doneNodes.add('cloudinary');
            doneNodes.add('pdfparse');
            doneNodes.add('jobs');
            doneNodes.add('arduino');
            doneNodes.add('agent');
            doneNodes.add('printer');
            activeNodes.clear();
          }, 1500);
        }));
      }, 600);
    }
  }
];

let currentStep = -1;

function buildStepDots() {
  stepBar.innerHTML = '';
  STEPS.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'step-dot';
    d.id = 'dot' + i;
    stepBar.appendChild(d);
  });
}

function setActiveNode(id) {
  activeNodes.add(id);
}

function setStats(pages, amt, status, ticket) {
  if (pages !== null) document.getElementById('statPages').textContent = pages;
  if (amt !== null) document.getElementById('statAmt').textContent = amt;
  if (status !== null) document.getElementById('statStatus').textContent = status;
  if (ticket !== null) document.getElementById('statTicket').textContent = ticket;
}

function addLog(type, tag, msg, code) {
  const el = document.createElement('div');
  el.className = `log-entry ${type}`;
  el.innerHTML = `<div class="log-tag">${tag}</div><div class="log-msg">${msg}</div>${code ? `<div class="log-code">${code}</div>` : ''}`;
  logArea.appendChild(el);
  logArea.scrollTop = logArea.scrollHeight;
}

function updateStepUI(i) {
  const s = STEPS[i];
  const colors = [COLORS.teal, COLORS.purple, COLORS.purple, COLORS.purple, COLORS.purple, COLORS.amber, COLORS.amber, COLORS.blue, COLORS.coral, COLORS.coral, COLORS.coral, COLORS.green];
  stepOverlay.innerHTML = `
    <div class="step-num">STEP ${i+1} / ${STEPS.length}</div>
    <div class="step-title" style="color:${colors[i]}">${s.title}</div>
    <div class="step-desc">${s.desc}</div>`;
  
  document.querySelectorAll('.step-dot').forEach((d, idx) => {
    d.className = 'step-dot' + (idx < i ? ' done' : idx === i ? ' active' : '');
  });
}

function runStep(i) {
  if (i >= STEPS.length) return;
  currentStep = i;
  updateStepUI(i);
  STEPS[i].fn();
  
  const delays = [2000, 2200, 2500, 2200, 1800, 2500, 2200, 2000, 2500, 2800, 2500, 3000];
  const delay = delays[i] * parseFloat(speedSel.value);
  if (i + 1 < STEPS.length) {
    stepTimer = setTimeout(() => { if (!paused) runStep(i + 1); }, delay);
  }
}

function restart() {
  clearTimeout(stepTimer);
  packets = [];
  activeNodes.clear();
  doneNodes.clear();
  logArea.innerHTML = '';
  setStats('—', '—', 'Idle', '—');
  buildStepDots();
  stepOverlay.innerHTML = `
    <div class="step-num">READY</div>
    <div class="step-title">PrintBridge-PaaS Live Simulation</div>
    <div class="step-desc">Starting in 1 second...</div>`;
  setTimeout(() => runStep(0), 1000);
}

pauseBtn.addEventListener('click', () => {
  paused = !paused;
  pauseBtn.textContent = paused ? '▶ Resume' : '⏸ Pause';
  if (!paused && currentStep >= 0) {
    runStep(Math.min(currentStep + 1, STEPS.length - 1));
  }
});

restartBtn.addEventListener('click', restart);

speedSel.addEventListener('change', () => {
  speedMult = 1 / parseFloat(speedSel.value);
});

window.addEventListener('resize', () => { resize(); });

resize();
draw();
buildStepDots();
setTimeout(restart, 500);
