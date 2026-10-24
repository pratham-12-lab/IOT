/**
 * Shared Navigation Bar Component
 * Automatically adds consistent navigation to all pages
 */

(function() {
  // Get current page
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  // Navigation HTML
  const navHTML = `
    <nav class="PrintBridge-PaaS-nav">
      <div class="nav-container">
        <a href="customer.html" class="nav-brand">
          <div class="nav-brand-icon">🖨️</div>
          <div>
            <div class="nav-brand-text">PrintBridge-PaaS</div>
            <div class="nav-brand-subtitle">Printer as a Service</div>
          </div>
        </a>
        
        <button class="nav-toggle" onclick="toggleMobileNav()" aria-label="Toggle navigation">
          ☰
        </button>
        
        <div class="nav-links" id="navLinks">
          <a href="customer.html" class="nav-link ${currentPage === 'customer.html' ? 'active' : ''}">
            Customer Portal
          </a>
          <a href="about.html" class="nav-link ${currentPage === 'about.html' ? 'active' : ''}">
            About
          </a>
          <a href="architecture-live.html" class="nav-link ${currentPage === 'architecture-live.html' ? 'active' : ''}">
            Live Demo
          </a>
          <a href="thingspeak-customer.html" class="nav-link ${currentPage === 'thingspeak-customer.html' ? 'active' : ''}">
            Analytics
          </a>
          <a href="https://github.com/VA-run23/IoT-Project" target="_blank" class="nav-link">
            GitHub
          </a>
          <a href="admin.html" class="nav-link ${currentPage === 'admin.html' || currentPage === 'index.html' || currentPage === 'thingspeak-admin.html' ? 'active' : ''}">
            Admin Dashboard
          </a>
        </div>
      </div>
    </nav>
  `;
  
  // Insert navigation at the beginning of body
  document.addEventListener('DOMContentLoaded', function() {
    // Add nav to body
    document.body.insertAdjacentHTML('afterbegin', navHTML);
    
    // Add class to body for padding
    document.body.classList.add('has-nav');
  });
  
  // Mobile menu toggle
  window.toggleMobileNav = function() {
    const navLinks = document.getElementById('navLinks');
    navLinks.classList.toggle('open');
  };
  
  // Close mobile menu when clicking outside
  document.addEventListener('click', function(event) {
    const navLinks = document.getElementById('navLinks');
    const navToggle = document.querySelector('.nav-toggle');
    
    if (navLinks && navToggle && 
        !navLinks.contains(event.target) && 
        !navToggle.contains(event.target)) {
      navLinks.classList.remove('open');
    }
  });
})();
