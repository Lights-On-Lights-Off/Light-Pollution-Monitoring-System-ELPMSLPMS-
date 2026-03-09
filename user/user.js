// ── Animated Background ──
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

// ── Pollution Colors ──
// ── Capitalize first letter ──
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

const POLLUTION_COLORS = {
  low:      '#22c55e',
  moderate: '#f59e0b',
  high:     '#ef4444'
};

// ── User Dashboard Class ──
class UserDashboard {
  constructor() {
    this.currentUser  = null;
    this.requests     = [];
    this.notifications = [];
    this.campusBuildings = [];
    this.map          = null;
    this.mapMarkers   = [];
    this.currentTab   = 'map';
    this.init();
  }

  init() {
    this.checkAuth();
    this.initTabs();
    this.bindEvents();
    this.loadUserData();
    this.initMapTab(); // init map immediately since it's the default tab
  }

  // ── Auth ──
  checkAuth() {
    const raw = localStorage.getItem('nbsc_session');
    if (!raw) { window.location.href = '../index.html'; return; }
    this.currentUser = JSON.parse(raw);
  }

  // ── Nav UI ──
  updateNavUI() {
    if (!this.currentUser) return;
    const name  = this.currentUser.name  || this.currentUser.email.split('@')[0];
    const email = this.currentUser.email || '';
    const initial = name.charAt(0).toUpperCase();

    document.getElementById('avatarInitial').textContent  = initial;
    document.getElementById('pillName').textContent       = name;
    document.getElementById('pillEmail').textContent      = email;
    document.getElementById('dropdownName').textContent   = name;
    document.getElementById('dropdownEmail').textContent  = email;
  }

  // ── Tabs ──
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

  // ── Load user data ──
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

  // ── Requests ──
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

  downloadData(requestId) {
    const r = this.requests.find(req => req.id === requestId);
    if (!r || r.status !== 'approved') return;

    // Find the matching building
    const locationLabel = this.formatLocation(r.location);
    const building = this.campusBuildings.find(b =>
      b.name.toLowerCase() === locationLabel.toLowerCase() ||
      b.name.toLowerCase().includes(locationLabel.toLowerCase()) ||
      locationLabel.toLowerCase().includes(b.name.toLowerCase())
    ) || this.campusBuildings.find(b =>
      r.location && (
        r.location.toLowerCase().includes(b.name.toLowerCase()) ||
        b.name.toLowerCase().includes(r.location.toLowerCase())
      )
    );

    // Build CSV rows
    const now     = new Date();
    const rows    = [];
    const headers = ['Timestamp', 'Building', 'Location (Lat)', 'Location (Lng)', 'Lux Reading', 'Pollution Level', 'Status', 'Data Type'];
    rows.push(headers.join(','));

    if (building) {
      // Generate simulated historical readings for the requested date range
      const start = r.startDate ? new Date(r.startDate) : new Date(now - 7 * 86400000);
      const end   = r.endDate   ? new Date(r.endDate)   : now;
      const diffMs = end - start;
      const intervals = Math.min(Math.floor(diffMs / (3600000)), 168); // max 168 rows (hourly for 7 days)

      for (let i = 0; i <= intervals; i++) {
        const ts      = new Date(start.getTime() + (i / intervals) * diffMs);
        const lux     = Math.max(5, Math.min(150, building.lux + (Math.random() - 0.5) * 20)).toFixed(1);
        const level   = parseFloat(lux) < 30 ? 'Low' : parseFloat(lux) < 80 ? 'Moderate' : 'High';
        const [lat, lng] = Array.isArray(building.coordinates)
          ? building.coordinates
          : [building.lat, building.lng];
        rows.push([
          ts.toISOString(),
          `"${building.name}"`,
          lat,
          lng,
          lux,
          level,
          building.online ? 'Online' : 'Offline',
          r.dataType || 'Light Pollution'
        ].join(','));
      }
    } else {
      // Fallback: single summary row with request info only
      rows.push([
        now.toISOString(),
        `"${r.location || 'Unknown'}"`,
        '—', '—', '—', '—', '—',
        r.dataType || 'Light Pollution'
      ].join(','));
    }

    // Metadata header block
    const meta = [
      `# NBSC Light Pollution Monitoring System`,
      `# Request ID: ${r.id}`,
      `# Requested by: ${r.userName || r.email}`,
      `# Organization: ${r.organization || '—'}`,
      `# Location: ${locationLabel}`,
      `# Data Type: ${r.dataType || '—'}`,
      `# Date Range: ${this.formatDateRange(r.startDate, r.endDate)}`,
      `# Purpose: ${r.purpose || '—'}`,
      `# Generated: ${now.toISOString()}`,
      `#`,
    ].join('\n');

    const csv      = meta + '\n' + rows.join('\n');
    const blob     = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url      = URL.createObjectURL(blob);
    const a        = document.createElement('a');
    a.href         = url;
    a.download     = `NBSC_LightData_${(locationLabel).replace(/\s+/g, '_')}_${r.id}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  deleteRequest(id) {
    if (!confirm('Delete this request? This cannot be undone.')) return;
    this.requests = this.requests.filter(r => r.id !== id);
    this.saveRequests();
    this.renderRequests();
  }

  saveRequests() {
    const all   = JSON.parse(localStorage.getItem('nbscDataRequests') || '[]');
    const others = all.filter(r => r.email !== this.currentUser.email);
    localStorage.setItem('nbscDataRequests', JSON.stringify([...others, ...this.requests]));
  }

  submitRequest(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const req = {
      id:              'REQ-' + Date.now(),
      email:           this.currentUser.email,
      userName:        fd.get('fullName'),
      organization:    fd.get('organization'),
      location:        fd.get('location'),
      dataType:        fd.get('dataType'),
      purpose:         fd.get('purpose'),
      startDate:       fd.get('startDate'),
      endDate:         fd.get('endDate'),
      additionalNotes: fd.get('additionalNotes'),
      submittedDate:   new Date().toISOString(),
      status:          'pending'
    };
    this.requests.push(req);
    this.saveRequests();
    this.renderRequests();
    e.target.reset();
    this.prefillForm();
    setTimeout(() => this.switchTab('requests'), 1000);
  }

  // ── Notifications ──
  loadNotifications() {
    const all = JSON.parse(localStorage.getItem('userNotifications') || '[]');
    this.notifications = all.filter(n => n.email === this.currentUser.email);
    this.renderNotifications();
  }

  renderNotifications() {
    const container = document.getElementById('notifications-list');
    if (!container) return;

    const items = this.notifications.length
      ? this.notifications.slice(0, 10)
      : [{ message: `Welcome back, ${this.currentUser.name || 'User'}! Your dashboard is ready.`, timestamp: new Date().toISOString() }];

    container.innerHTML = items.map(n => `
      <div class="notif-item">
        <div class="notif-dot"></div>
        <div>
          <div class="notif-text">${n.message}</div>
          <div class="notif-time">${this.timeAgo(n.timestamp)}</div>
        </div>
      </div>
    `).join('');
  }

  // ── Map ──
  initMapTab() {
    const el = document.getElementById('user-campus-map');
    if (!el || this.map) return;

    const center = [8.359999, 124.868103];
    const bounds = L.latLngBounds([8.355000, 124.860000], [8.365000, 124.876000]);

    this.map = L.map('user-campus-map', {
      center, zoom: 18,
      minZoom: 16, maxZoom: 20,
      maxBounds: bounds, maxBoundsViscosity: 1.0
    });

    const colored = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    const satellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19 }
    );

    L.control.layers({ 'Colored Map': colored, 'Satellite View': satellite }, null, { position: 'bottomright' }).addTo(this.map);

    L.rectangle(bounds, { color: '#0d6efd', weight: 2, fillOpacity: 0.05 })
      .addTo(this.map).bindPopup('Northern Bukidnon State College');

    this.loadCampusBuildings();
    this.renderMapMarkers();
    this.bindMapControls();
  }

  loadCampusBuildings() {
    const saved = localStorage.getItem('nbscBuildings');
    if (saved) { this.campusBuildings = JSON.parse(saved); return; }
    this.campusBuildings = [
      { id:'B01', name:'SWDC Building',            coordinates:[8.360309105794068, 124.86777742438035], pollutionLevel:'moderate', description:'Main administrative offices',        lux:55, online:true },
      { id:'B02', name:'NBSC Covered Court',        coordinates:[8.360122375785208, 124.86894170546891], pollutionLevel:'moderate', description:'Sports and events facility',          lux:62, online:true },
      { id:'B03', name:'NBSC Library',              coordinates:[8.359264030617997, 124.86789449725583], pollutionLevel:'low',      description:'Main library and study center',       lux:18, online:true },
      { id:'B04', name:'NBSC Clinic',               coordinates:[8.359157605365368, 124.86817955256836], pollutionLevel:'moderate', description:'Medical services and health center',   lux:47, online:true },
      { id:'B05', name:'BSBA Building',             coordinates:[8.359096410833255, 124.86842964826772], pollutionLevel:'high',     description:'Business and administration classrooms', lux:130, online:true },
      { id:'B06', name:'ICS Laboratory',            coordinates:[8.359221460529115, 124.86905085372219], pollutionLevel:'moderate', description:'Computer science and IT laboratory',   lux:70, online:true }
    ];
  }

  renderMapMarkers(filter = 'all') {
    this.mapMarkers.forEach(m => this.map.removeLayer(m));
    this.mapMarkers = [];

    this.campusBuildings
      .filter(b => filter === 'all' || b.pollutionLevel === filter)
      .forEach(b => {
        const color = POLLUTION_COLORS[b.pollutionLevel];
        const marker = L.circleMarker(b.coordinates, {
          radius: 10, fillColor: color, color: '#fff', weight: 2, fillOpacity: 0.9
        }).addTo(this.map);

        marker.bindPopup(`
          <div style="font-family:'Outfit',sans-serif;min-width:170px;">
            <div style="font-weight:700;font-size:0.92rem;margin-bottom:6px;">${b.name}</div>
            <div style="margin-bottom:4px;">
              <span style="color:#888;font-size:0.75rem;">Pollution Level:</span>
              <span style="display:inline-block;margin-left:6px;padding:2px 8px;border-radius:10px;font-size:0.72rem;font-weight:600;background:${color}33;color:${color};border:1px solid ${color}66;">
                ${cap(b.pollutionLevel)}
              </span>
            </div>
            <div style="font-size:0.78rem;color:#777;margin-top:4px;">${b.description}</div>
          </div>
        `);
        this.mapMarkers.push(marker);
      });
  }

  bindMapControls() {
    document.getElementById('user-map-filter')?.addEventListener('change', e => {
      this.renderMapMarkers(e.target.value);
    });
    document.getElementById('refresh-user-map-btn')?.addEventListener('click', () => {
      this.loadCampusBuildings();
      const f = document.getElementById('user-map-filter')?.value || 'all';
      this.renderMapMarkers(f);
    });
    document.getElementById('reset-user-map-btn')?.addEventListener('click', () => {
      this.map?.setView([8.359999, 124.868103], 18);
    });
  }

  // ── Event Bindings ──
  bindEvents() {
    // Nav dropdown
    const pill    = document.getElementById('userPillToggle');
    const dropdown = document.getElementById('userDropdown');
    pill?.addEventListener('click', e => { e.stopPropagation(); dropdown?.classList.toggle('open'); });
    document.addEventListener('click', () => dropdown?.classList.remove('open'));

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
      localStorage.removeItem('nbsc_session');
      window.location.href = '../index.html';
    });

    // Request form
    document.getElementById('data-request-form')?.addEventListener('submit', e => this.submitRequest(e));
  }

  // ── Helpers ──
  formatLocation(loc) {
    const map = {
      'NBSC LIBRARY': 'NBSC Library', 'NBSC CLINIC': 'NBSC Clinic',
      'BSBA BUILDING': 'BSBA Building', 'ICS LABORATORY': 'ICS Laboratory',
      'SWDC Building': 'SWDC Building',
      'Northern Bukidnon State College Covered Court': 'Covered Court'
    };
    return map[loc] || loc || '—';
  }

  formatDateRange(s, e) {
    if (!s && !e) return '—';
    const fmt = d => new Date(d).toLocaleDateString();
    if (s && e) return `${fmt(s)} → ${fmt(e)}`;
    return fmt(s || e);
  }

  timeAgo(ts) {
    const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  }
}

// ── Boot ──
document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new UserDashboard();
});
