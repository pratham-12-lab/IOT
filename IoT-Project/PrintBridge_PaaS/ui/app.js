// Load shop status on page load
async function loadShopStatus() {
  try {
    const res = await fetch('/api/shop-status');
    const status = await res.json();
    updateShopStatusDisplay(status);
  } catch (error) {
    console.error('Error loading shop status:', error);
  }
}

function updateShopStatusDisplay(status) {
  const indicator = document.getElementById('shopStatusIndicator');
  const message = document.getElementById('shopStatusMessage');
  const openBtn = document.getElementById('openBtn');
  const closeBtn = document.getElementById('closeBtn');
  
  if (status.isOpen) {
    indicator.textContent = '● Open';
    indicator.style.background = '#f0fdf4';
    indicator.style.borderColor = '#059669';
    indicator.style.color = '#059669';
    message.textContent = 'Customers can upload and pay for print jobs';
    openBtn.style.opacity = '0.5';
    closeBtn.style.opacity = '1';
  } else {
    indicator.textContent = '● Closed';
    indicator.style.background = '#fef2f2';
    indicator.style.borderColor = '#dc2626';
    indicator.style.color = '#dc2626';
    message.textContent = status.closedMessage;
    openBtn.style.opacity = '1';
    closeBtn.style.opacity = '0.5';
  }
}

async function setShopOpen() {
  try {
    const res = await fetch('/api/shop-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        isOpen: true
      })
    });
    const data = await res.json();
    
    // Handle response format
    const status = data.status || data;
    
    if (status.isOpen !== undefined) {
      updateShopStatusDisplay(status);
      alert('✅ Shop is now OPEN. Customers can upload documents.');
    }
  } catch (error) {
    console.error('Error opening shop:', error);
    alert('Error opening shop');
  }
}

async function setShopClosed() {
  try {
    const res = await fetch('/api/shop-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        isOpen: false
      })
    });
    const data = await res.json();
    
    // Handle response format
    const status = data.status || data;
    
    if (status.isOpen !== undefined) {
      updateShopStatusDisplay(status);
      alert('🔒 Shop is now CLOSED. Customers cannot upload documents.');
    }
  } catch (error) {
    console.error('Error closing shop:', error);
    alert('Error closing shop');
  }
}

async function loadJobs() {
  const res = await fetch('/api/jobs');
  const jobs = await res.json();
  const container = document.getElementById('jobs');
  
  if (jobs.length === 0) {
    container.innerHTML = '<p class="no-jobs">No jobs yet. Upload a document at <a href="/customer.html">/customer.html</a></p>';
    return;
  }
  
  container.innerHTML = '';
  jobs.forEach(job => {
    const div = document.createElement('div');
    div.className = `job ${job.paymentStatus === 'paid' ? 'paid' : 'pending'}`;
    
    const paymentBadge = `<span class="status ${job.paymentStatus}">${job.paymentStatus.toUpperCase()}</span>`;
    const statusBadge = `<span class="status ${job.status}">${job.status.toUpperCase()}</span>`;
    
    div.innerHTML = `
      <div class="job-header">
        <span class="job-id">Job #${job.id} | Ticket #${job.ticketNumber || 'N/A'}</span>
        <div class="badges">
          ${paymentBadge}
          ${statusBadge}
        </div>
      </div>
      <div class="job-details">
        ${job.paymentId ? `<strong>Payment ID:</strong> ${job.paymentId}<br>` : ''}
        <strong>Pages:</strong> ${job.pageCount || 'N/A'} | 
        <strong>Type:</strong> ${job.isColor ? 'Color' : 'B&W'}<br>
        <strong>File:</strong> ${job.fileUrl.substring(0, 60)}...
      </div>
    `;
    
    // Manual approve button (only if unpaid and pending)
    if (job.status === 'pending' && job.paymentStatus === 'unpaid') {
      const btn = document.createElement('button');
      btn.textContent = 'Manual Approve (Override)';
      btn.style.marginTop = '10px';
      btn.onclick = async () => {
        if (confirm('Approve without payment verification?')) {
          await fetch(`/api/approve/${job.id}`, { method: 'POST' });
          loadJobs();
        }
      };
      div.appendChild(btn);
    }
    
    container.appendChild(div);
  });
}

// Load shop status on page load
loadShopStatus();

setInterval(loadJobs, 3000);
loadJobs();
