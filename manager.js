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


