// NBSC Admin Dashboard — manager.js

// Animated Background Canvas
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

// Constants
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
const POLLUTION_COLORS = { low: '#22c55e', moderate: '#f59e0b', high: '#ef4444' };

// Data
let requests        = [];
let deletedRequests = [];

let buildings = [
  { id: 1, name: 'SWDC Building',  lat: 8.360309, lng: 124.867777, pollutionLevel: 'high',     description: 'Main administrative offices' },
  { id: 2, name: 'NBSC Library',   lat: 8.359264, lng: 124.867894, pollutionLevel: 'moderate', description: 'Main library and study center' },
  { id: 3, name: 'NBSC Clinic',    lat: 8.359158, lng: 124.868179, pollutionLevel: 'low',      description: 'Medical services and health center' },
  { id: 4, name: 'BSBA Building',  lat: 8.359096, lng: 124.868429, pollutionLevel: 'moderate', description: 'Business and administration classrooms' },
  { id: 5, name: 'ICS Laboratory', lat: 8.359221, lng: 124.869050, pollutionLevel: 'high',     description: 'Computer science and IT laboratory' },
  { id: 6, name: 'Covered Court',  lat: 8.360122, lng: 124.868941, pollutionLevel: 'low',      description: 'Sports and events facility' },
  { id: 7, name: 'Cafeteria',      lat: 8.358900, lng: 124.868200, pollutionLevel: 'moderate', description: 'Student dining facility' },
];

// State
let currentSection    = 'dashboard';
let statusFilter      = 'all';
let pollutionFilter   = 'all';
let mapFilter         = 'all';
let editingBuildingId = null;

// Map
let adminMap;
let adminMapMarkers    = [];
let adminSatelliteLayer;
let adminStandardLayer;
let adminCurrentTile;

// Location picker (building modal)
let locationPickerMap    = null;
let locationPickerMarker = null;

// Init
document.addEventListener('DOMContentLoaded', () => {
  seedDefaultManager();
  checkManagerAuth();
  loadManagerProfile();
  loadRequests();
  updateQuickStats();
  renderDashboard();
  renderBuildingsGrid();
  initNavigation();
  setupEventListeners();
  checkForNewRequests();
});

function seedDefaultManager() {
  const users  = JSON.parse(localStorage.getItem('nbsc_users') || '[]');
  const exists = users.find(u => u.email === 'manager@example.com');
  if (!exists) {
    users.push({
      name:     'NBSC Manager',
      email:    'manager@example.com',
      password: 'manager1',
      role:     'manager',
    });
    localStorage.setItem('nbsc_users', JSON.stringify(users));
  }
}

function checkManagerAuth() {
  const raw = localStorage.getItem('nbsc_session');
  if (!raw) { window.location.href = 'index.html'; return; }
  try {
    const session = JSON.parse(raw);
    if (session.role !== 'manager') window.location.href = 'index.html';
  } catch (e) {
    window.location.href = 'index.html';
  }
}

function loadManagerProfile() {
  const raw = localStorage.getItem('nbsc_session');
  if (!raw) return;
  try {
    const session  = JSON.parse(raw);
    const name     = session.name || 'Manager';
    const initials = name.split(' ').map(w => w[0].toUpperCase()).slice(0, 2).join('');
    document.getElementById('manager-avatar').textContent = initials;
    document.getElementById('manager-name').textContent   = name;
  } catch (e) { /* silent */ }
}


function initNavigation() {
  document.querySelectorAll('.nav-item[data-section]').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.section));
  });
}

function navigateTo(id) {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  const navBtn = document.querySelector(`.nav-item[data-section="${id}"]`);
  if (navBtn) navBtn.classList.add('active');

  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');

  const titles = {
    'dashboard':   'Dashboard Overview',
    'requests':    'Data Requests Management',
    'buildings':   'Building Management',
    'map':         'Campus Map',
    'recycle-bin': 'Recycle Bin',
  };
  document.getElementById('page-title').textContent = titles[id] || 'Dashboard';

  switch (id) {
    case 'dashboard':   renderDashboard();                       break;
    case 'requests':    renderRequestsTable();                   break;
    case 'buildings':   renderBuildingsGrid();                   break;
    case 'map':         initManagerMap(); renderMapMarkers();    break;
    case 'recycle-bin': renderRecycleBin();                      break;
  }

  currentSection = id;
}


function updateQuickStats() {
  document.getElementById('pending-count').textContent        = requests.filter(r => r.status === 'pending').length;
  document.getElementById('approved-count').textContent       = requests.filter(r => r.status === 'approved').length;
  document.getElementById('high-pollution-count').textContent = buildings.filter(b => b.pollutionLevel === 'high').length;
  document.getElementById('total-buildings-count').textContent = buildings.length;
}


function renderDashboard() {
  renderDashboardRequests();
  renderDashboardBuildings();
}

function renderDashboardRequests() {
  const el     = document.getElementById('dashboard-requests');
  const recent = [...requests].reverse().slice(0, 5);
  if (!recent.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><p>No requests yet</p></div>`;
    return;
  }
  el.innerHTML = recent.map(r => `
    <div class="mini-item">
      <div class="mini-item-left">
        <span class="mini-item-name">${escHtml(r.name)}</span>
        <span class="mini-item-email">${escHtml(r.email)}</span>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <span class="badge ${r.status}">${cap(r.status)}</span>
        <span style="font-size:0.75rem;color:var(--muted);">${r.date}</span>
      </div>
    </div>
  `).join('');
}

function renderDashboardBuildings() {
  const el     = document.getElementById('dashboard-buildings');
  const counts = {
    high:     buildings.filter(b => b.pollutionLevel === 'high').length,
    moderate: buildings.filter(b => b.pollutionLevel === 'moderate').length,
    low:      buildings.filter(b => b.pollutionLevel === 'low').length,
  };
  el.innerHTML = `
    <div class="mini-item">
      <span>High Pollution Buildings</span>
      <span class="badge high">${counts.high}</span>
    </div>
    <div class="mini-item">
      <span>Moderate Pollution Buildings</span>
      <span class="badge moderate">${counts.moderate}</span>
    </div>
    <div class="mini-item">
      <span>Low Pollution Buildings</span>
      <span class="badge low">${counts.low}</span>
    </div>
  `;
}

