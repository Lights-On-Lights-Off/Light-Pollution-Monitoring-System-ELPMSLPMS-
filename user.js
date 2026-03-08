// Animated Background
(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() { this.reset(true); }
    reset(init) {
      this.x     = Math.random() * W;
      this.y     = init ? Math.random() * H : H + 10;
      this.r     = Math.random() * 1.4 + 0.3;
      this.vy    = -(Math.random() * 0.35 + 0.08);
      this.vx    = (Math.random() - 0.5) * 0.12;
      this.alpha = Math.random() * 0.45 + 0.08;
      this.color = Math.random() > 0.6
        ? `rgba(13,110,253,${this.alpha})`
        : `rgba(255,255,255,${this.alpha * 0.5})`;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.y < -10) this.reset(false);
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }

  for (let i = 0; i < 100; i++) particles.push(new Particle());

  function loop() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#252324';
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.5);
    g.addColorStop(0, 'rgba(13,110,253,0.05)');
    g.addColorStop(1, 'rgba(37,35,36,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  }
  loop();
})();

// Capitalize helper
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

const POLLUTION_COLORS = {
  low:      '#22c55e',
  moderate: '#f59e0b',
  high:     '#ef4444'
};

// User Dashboard Class
class UserDashboard {
  constructor() {
    this.currentUser     = null;
    this.requests        = [];
    this.notifications   = [];
    this.campusBuildings = [];
    this.map             = null;
    this.mapMarkers      = [];
    this.currentTab      = 'map';
    this.init();
  }

  init() {
    this.checkAuth();
    this.initTabs();
    this.bindEvents();
    this.loadUserData();
    this.initMapTab();
  }

  // Auth
  checkAuth() {
    const raw = localStorage.getItem('nbsc_session');
    if (!raw) { window.location.href = 'index.html'; return; }
    this.currentUser = JSON.parse(raw);
  }

  // Nav UI
  updateNavUI() {
    if (!this.currentUser) return;
    const name    = this.currentUser.name  || this.currentUser.email.split('@')[0];
    const email   = this.currentUser.email || '';
    const initial = name.charAt(0).toUpperCase();

    document.getElementById('avatarInitial').textContent = initial;
    document.getElementById('pillName').textContent      = name;
    document.getElementById('pillEmail').textContent     = email;
    document.getElementById('dropdownName').textContent  = name;
    document.getElementById('dropdownEmail').textContent = email;
  }

  // Tabs
  initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchTab(btn.getAttribute('data-tab'));
      });
    });
  }

  switchTab(name) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    const btn  = document.querySelector(`[data-tab="${name}"]`);
    const pane = document.getElementById(`${name}-tab`);
    if (btn)  btn.classList.add('active');
    if (pane) pane.classList.add('active');
    this.currentTab = name;

    if (name === 'map' && !this.map) this.initMapTab();
  }

  // Load user data
  loadUserData() {
    this.updateNavUI();
    this.prefillForm();
    this.loadRequests();
    this.loadNotifications();
  }

  prefillForm() {
    const nameEl  = document.getElementById('full-name');
    const emailEl = document.getElementById('email');
    if (nameEl  && this.currentUser.name)  nameEl.value  = this.currentUser.name;
    if (emailEl && this.currentUser.email) emailEl.value = this.currentUser.email;
  }

  // Requests
  loadRequests() {
    const all = JSON.parse(localStorage.getItem('nbscDataRequests') || '[]');
    this.requests = all.filter(r => r.email === this.currentUser.email);
    this.renderRequests();
  }

  renderRequests() {
    const container = document.getElementById('user-requests-list');
    if (!container) return;

    if (this.requests.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <p>You haven't submitted any requests yet.</p>
          <p style="margin-top:6px;font-size:0.8rem;">Use the <strong>New Request</strong> tab to get started.</p>
        </div>`;
      return;
    }

    container.innerHTML = this.requests.map(r => `
      <div class="request-item">
        <div class="request-item-header">
          <span class="request-id">${r.id}</span>
          <span class="status-badge ${r.status}">${cap(r.status)}</span>
        </div>
        <div class="request-meta">
          <div class="meta-item"><label>Data Type</label><span>${r.dataType || '—'}</span></div>
          <div class="meta-item"><label>Location</label><span>${this.formatLocation(r.location)}</span></div>
          <div class="meta-item"><label>Date Range</label><span>${this.formatDateRange(r.startDate, r.endDate)}</span></div>
          <div class="meta-item"><label>Submitted</label><span>${new Date(r.submittedDate).toLocaleDateString()}</span></div>
        </div>
        <div class="request-item-actions">
          ${r.status === 'approved' ? `
            <button class="btn-download" onclick="window.dashboard.downloadData('${r.id}')">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 16 16">
                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
              </svg>
              Download Data
            </button>
          ` : ''}
          <button class="btn-delete" onclick="window.dashboard.deleteRequest('${r.id}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
              <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1 0-2h3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3h11V2h-11v1z"/>
            </svg>
            Delete
          </button>
        </div>
      </div>
    `).join('');
  }