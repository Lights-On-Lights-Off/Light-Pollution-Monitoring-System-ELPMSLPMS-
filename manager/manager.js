// NBSC Manager Dashboard — manager.js

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


const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
const POLLUTION_COLORS = { low: '#22c55e', moderate: '#f59e0b', high: '#ef4444' };

let requests        = [];
let deletedRequests = [];

const DEFAULT_BUILDINGS = [
  { id: 1, name: 'SWDC Building',    lat: 8.360309, lng: 124.867777, pollutionLevel: 'high',     description: 'Main administrative offices' },
  { id: 2, name: 'NBSC Library',     lat: 8.359264, lng: 124.867894, pollutionLevel: 'moderate', description: 'Main library and study center' },
  { id: 3, name: 'NBSC Clinic',      lat: 8.359158, lng: 124.868179, pollutionLevel: 'low',      description: 'Medical services and health center' },
  { id: 4, name: 'BSBA Building',    lat: 8.359096, lng: 124.868429, pollutionLevel: 'moderate', description: 'Business and administration classrooms' },
  { id: 5, name: 'ICS Laboratory',   lat: 8.359221, lng: 124.869050, pollutionLevel: 'high',     description: 'Computer science and IT laboratory' },
  { id: 6, name: 'Covered Court',    lat: 8.360122, lng: 124.868941, pollutionLevel: 'low',      description: 'Sports and events facility' },
  { id: 7, name: 'Cafeteria',        lat: 8.358900, lng: 124.868200, pollutionLevel: 'moderate', description: 'Student dining facility' },
];

function loadBuildings() {
  try {
    const raw = localStorage.getItem('nbscBuildings');
    if (raw) {
      const parsed = JSON.parse(raw);
      buildings = parsed.map(b => ({
        id:            b.id,
        name:          b.name,
        lat:           Array.isArray(b.coordinates) ? b.coordinates[0] : b.lat,
        lng:           Array.isArray(b.coordinates) ? b.coordinates[1] : b.lng,
        pollutionLevel:b.pollutionLevel,
        description:   b.description || '',
        lux:           b.lux,
      }));
    } else {
      buildings = DEFAULT_BUILDINGS.map(b => ({ ...b }));
      persistBuildings();
    }
  } catch (e) {
    buildings = DEFAULT_BUILDINGS.map(b => ({ ...b }));
  }
}

function persistBuildings() {
  const toSave = buildings.map(b => ({
    id:            b.id,
    name:          b.name,
    coordinates:   [b.lat, b.lng],
    pollutionLevel:b.pollutionLevel,
    description:   b.description || '',
    lux:           b.lux !== undefined ? b.lux : 50,
    online:        true,
  }));
  localStorage.setItem('nbscBuildings', JSON.stringify(toSave));
}

let buildings = [];

let currentSection  = 'dashboard';
let statusFilter    = 'all';
let pollutionFilter = 'all';
let mapFilter       = 'all';
let editingBuildingId = null;

let adminMap;
let adminMapMarkers    = [];
let adminSatelliteLayer;
let adminStandardLayer;
let adminCurrentTile;

let locationPickerMap    = null;
let locationPickerMarker = null;


document.addEventListener('DOMContentLoaded', () => {
  seedDefaultManager();
  checkManagerAuth();
  loadManagerProfile();
  loadBuildings();
  loadRequests();
  updateQuickStats();
  renderDashboard();
  renderBuildingsGrid();
  initNavigation();
  setupEventListeners();
  checkForNewRequests();
});

function seedDefaultManager() {
  const users = JSON.parse(localStorage.getItem('nbsc_users') || '[]');
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
  if (!raw) {
    window.location.href = '../index.html';
    return;
  }
  try {
    const session = JSON.parse(raw);
    if (session.role !== 'manager') {
      window.location.href = '../index.html';
    }
  } catch (e) {
    window.location.href = '../index.html';
  }
}


function loadManagerProfile() {
  const raw = localStorage.getItem('nbsc_session');
  if (!raw) return;
  try {
    const session = JSON.parse(raw);
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
    'dashboard':  'Dashboard Overview',
    'requests':   'Data Requests Management',
    'buildings':  'Building Management',
    'map':        'Campus Map',
    'recycle-bin':'Recycle Bin',
  };
  document.getElementById('page-title').textContent = titles[id] || 'Dashboard';

  switch (id) {
    case 'dashboard':   renderDashboard();      break;
    case 'requests':    renderRequestsTable();  break;
    case 'buildings':   renderBuildingsGrid();  break;
    case 'map':         initManagerMap(); renderMapMarkers(); break;
    case 'recycle-bin': renderRecycleBin();     break;
  }

  currentSection = id;
}


function updateQuickStats() {
  document.getElementById('pending-count').textContent       = requests.filter(r => r.status === 'pending').length;
  document.getElementById('approved-count').textContent      = requests.filter(r => r.status === 'approved').length;
  document.getElementById('high-pollution-count').textContent = buildings.filter(b => b.pollutionLevel === 'high').length;
  document.getElementById('total-buildings-count').textContent = buildings.length;
}


function renderDashboard() {
  renderDashboardRequests();
  renderDashboardBuildings();
}

function renderDashboardRequests() {
  const el = document.getElementById('dashboard-requests');
  const recent = [...requests].reverse().slice(0, 5);
  if (!recent.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><p>No requests yet</p></div>`;
    return;
  }
  el.innerHTML = recent.map(r => `
    <div class="mini-item">
      <div class="mini-item-left">
        <span class="mini-item-name">${escHtml(r.userName)}</span>
        <span class="mini-item-email">${escHtml(r.email)}</span>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <span class="badge ${r.status}">${cap(r.status)}</span>
        <span style="font-size:0.75rem;color:var(--muted);">${r.submittedDate}</span>
      </div>
    </div>
  `).join('');
}

function renderDashboardBuildings() {
  const el = document.getElementById('dashboard-buildings');
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


function renderRequestsTable() {
  const tbody  = document.getElementById('requests-tbody');
  const empty  = document.getElementById('requests-empty');
  const filtered = getFilteredRequests();

  if (!filtered.length) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = filtered.map(r => `
    <tr>
      <td><span style="font-family:monospace;font-size:0.82rem;color:var(--accent);">${escHtml(r.id)}</span></td>
      <td><strong>${escHtml(r.userName)}</strong></td>
      <td style="color:var(--muted);">${escHtml(r.email)}</td>
      <td>${escHtml(r.location || '—')}</td>
      <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(r.purpose || '—')}</td>
      <td style="color:var(--muted);white-space:nowrap;">${escHtml(r.submittedDate)}</td>
      <td><span class="badge ${r.status}">${cap(r.status)}</span></td>
      <td>
        <div class="td-actions">
          ${r.status === 'pending' ? `
            <button class="btn btn-sm btn-success" onclick="approveRequest('${r.id}')">
              <svg width="11" height="11" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></svg>
              Approve
            </button>
            <button class="btn btn-sm btn-warn" onclick="denyRequest('${r.id}')">
              <svg width="11" height="11" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/></svg>
              Deny
            </button>
          ` : ''}
          <button class="btn btn-sm btn-danger" onclick="deleteRequest('${r.id}')">
            <svg width="11" height="11" fill="currentColor" viewBox="0 0 16 16"><path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5Z"/></svg>
            Delete
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function getFilteredRequests() {
  if (statusFilter === 'all') return requests;
  return requests.filter(r => r.status === statusFilter);
}



function getSessionName() {
  try {
    const s = JSON.parse(localStorage.getItem('nbsc_session'));
    return (s && s.name) ? s.name : 'Manager';
  } catch (e) { return 'Manager'; }
}

function logActivity(action, detail) {
  try {
    const log = JSON.parse(localStorage.getItem('nbscActivityLog') || '[]');
    log.unshift({
      actor:     getSessionName(),
      action,
      detail,
      timestamp: new Date().toISOString(),
    });
    // Cap the log at 100 entries so localStorage doesn't grow unbounded
    localStorage.setItem('nbscActivityLog', JSON.stringify(log.slice(0, 100)));
  } catch (e) { /* non-critical */ }
}

function approveRequest(id) {
  const r = requests.find(r => r.id === id);
  if (!r) return;
  r.status     = 'approved';
  r.reviewedAt = new Date().toISOString();
  r.reviewedBy = getSessionName();
  saveRequests();
  logActivity('approved_request', `Approved request #${r.id} from ${r.userName || r.email || '—'}`);
  notifyUser(r, 'approved');
  updateQuickStats();
  renderRequestsTable();
  if (currentSection === 'dashboard') renderDashboard();
}

function denyRequest(id) {
  const r = requests.find(r => r.id === id);
  if (!r) return;
  r.status     = 'denied';
  r.reviewedAt = new Date().toISOString();
  r.reviewedBy = getSessionName();
  saveRequests();
  logActivity('denied_request', `Denied request #${r.id} from ${r.userName || r.email || '—'}`);
  notifyUser(r, 'denied');
  updateQuickStats();
  renderRequestsTable();
  if (currentSection === 'dashboard') renderDashboard();
}

function deleteRequest(id) {
  const r = requests.find(r => r.id === id);
  if (!r) return;
  if (!confirm(`Move ${r.userName}'s request to the recycle bin?`)) return;
  deletedRequests.push({ ...r, deletedOn: new Date().toISOString() });
  requests = requests.filter(r => r.id !== id);
  saveRequests();
  updateQuickStats();
  renderRequestsTable();
  if (currentSection === 'dashboard') renderDashboard();
}


function renderBuildingsGrid() {
  const grid = document.getElementById('buildings-grid');
  const list = getFilteredBuildings();

  if (!list.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">🏢</div><p>No buildings found</p></div>`;
    return;
  }

  grid.innerHTML = list.map(b => `
    <div class="building-card">
      <div class="bc-head">
        <h4>${escHtml(b.name)}</h4>
        <span class="badge ${b.pollutionLevel}">${cap(b.pollutionLevel)}</span>
      </div>
      <div class="bc-desc">${escHtml(b.description || '—')}</div>
      <div class="bc-coords">📍 ${b.lat.toFixed(6)}, ${b.lng.toFixed(6)}</div>
      <div class="bc-actions">
        <button class="btn btn-sm btn-ghost" onclick="editBuilding(${b.id})">
          <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/></svg>
          Edit
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteBuilding(${b.id})">
          <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5Z"/></svg>
          Delete
        </button>
      </div>
    </div>
  `).join('');
}

function getFilteredBuildings() {
  if (pollutionFilter === 'all') return buildings;
  return buildings.filter(b => b.pollutionLevel === pollutionFilter);
}



function openBuildingModal(isEdit = false) {
  document.getElementById('modal-title').textContent = isEdit ? 'Edit Building' : 'Add Building';
  document.getElementById('building-modal').classList.add('open');
  // Delay map init until the modal is visible; Leaflet needs the container to have dimensions
  setTimeout(() => initLocationPicker(), 80);
}

function closeBuildingModal() {
  document.getElementById('building-modal').classList.remove('open');
  document.getElementById('building-form').reset();
  editingBuildingId = null;
  document.getElementById('modal-title').textContent = 'Add Building';
  resetLocationPickerDisplay();
  if (locationPickerMap) {
    locationPickerMap.remove();
    locationPickerMap    = null;
    locationPickerMarker = null;
  }
}

function resetLocationPickerDisplay() {
  const display = document.getElementById('location-picker-display');
  const text    = document.getElementById('location-picker-text');
  const mapEl   = document.getElementById('location-picker-map');
  if (display) { display.classList.remove('selected'); }
  if (text)    { text.textContent = 'No location selected'; }
  if (mapEl)   { mapEl.classList.remove('has-location'); }
}

function setLocationPickerPin(lat, lng) {
  document.getElementById('building-lat').value = lat;
  document.getElementById('building-lng').value = lng;
  const display = document.getElementById('location-picker-display');
  const text    = document.getElementById('location-picker-text');
  const mapEl   = document.getElementById('location-picker-map');
  if (text)    text.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  if (display) display.classList.add('selected');
  if (mapEl)   mapEl.classList.add('has-location');
}

function initLocationPicker() {
  if (locationPickerMap) return; // map already exists from a previous open; skip re-init

  locationPickerMap = L.map('location-picker-map', {
    center:     [8.3595, 124.8675],
    zoom:       18,
    zoomControl: true,
    attributionControl: false,
  });

  // OSM tile — dark filter in CSS handles the darkening
  L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    { maxZoom: 19, subdomains: 'abc' }
  ).addTo(locationPickerMap);

  // If editing, pre-place marker at existing coords
  const existingLat = parseFloat(document.getElementById('building-lat').value);
  const existingLng = parseFloat(document.getElementById('building-lng').value);
  if (!isNaN(existingLat) && !isNaN(existingLng)) {
    placePickerMarker(existingLat, existingLng);
    locationPickerMap.setView([existingLat, existingLng], 18);
    setLocationPickerPin(existingLat, existingLng);
  }

  // Click to place / move marker
  locationPickerMap.on('click', e => {
    placePickerMarker(e.latlng.lat, e.latlng.lng);
    setLocationPickerPin(e.latlng.lat, e.latlng.lng);
  });
}

function placePickerMarker(lat, lng) {
  const icon = L.divIcon({
    className: '',
    html: `<div style="
      width:22px; height:22px; border-radius:50% 50% 50% 0;
      background:#0d6efd; border:2px solid #fff;
      transform:rotate(-45deg);
      box-shadow:0 2px 8px rgba(0,0,0,0.5);
    "></div>`,
    iconSize:   [22, 22],
    iconAnchor: [11, 22],
  });

  if (locationPickerMarker) {
    locationPickerMarker.setLatLng([lat, lng]);
  } else {
    locationPickerMarker = L.marker([lat, lng], { icon, draggable: true })
      .addTo(locationPickerMap);

    // Dragging the pin updates the stored coordinates in real time
    locationPickerMarker.on('dragend', e => {
      const { lat, lng } = e.target.getLatLng();
      setLocationPickerPin(lat, lng);
    });
  }
}

function editBuilding(id) {
  const b = buildings.find(b => b.id === id);
  if (!b) return;
  editingBuildingId = id;
  document.getElementById('building-name').value        = b.name;
  document.getElementById('building-lat').value         = b.lat;
  document.getElementById('building-lng').value         = b.lng;
  document.getElementById('pollution-level').value      = b.pollutionLevel;
  document.getElementById('building-description').value = b.description || '';
  openBuildingModal(true);
}

function deleteBuilding(id) {
  const b = buildings.find(b => b.id === id);
  if (!b) return;
  if (!confirm(`Delete ${b.name}? This cannot be undone.`)) return;
  buildings = buildings.filter(b => b.id !== id);
  persistBuildings();
  logActivity('deleted_building', `Deleted building "${b.name}"`);
  updateQuickStats();
  renderBuildingsGrid();
  if (adminMap) renderMapMarkers();
}



function handleBuildingSubmit(e) {
  e.preventDefault();
  const lat = parseFloat(document.getElementById('building-lat').value);
  const lng = parseFloat(document.getElementById('building-lng').value);

  if (isNaN(lat) || isNaN(lng)) {
    // Flash the map picker red to indicate a pin location is required before saving
    const mapEl = document.getElementById('location-picker-map');
    mapEl.style.borderColor = '#ef4444';
    mapEl.style.boxShadow   = '0 0 0 3px rgba(239,68,68,0.2)';
    setTimeout(() => {
      mapEl.style.borderColor = '';
      mapEl.style.boxShadow   = '';
    }, 2000);
    return;
  }

  const data = {
    name:          document.getElementById('building-name').value.trim(),
    lat,
    lng,
    pollutionLevel:document.getElementById('pollution-level').value,
    description:   document.getElementById('building-description').value.trim(),
  };

  if (editingBuildingId !== null) {
      const idx = buildings.findIndex(b => b.id === editingBuildingId);
    if (idx !== -1) buildings[idx] = { ...buildings[idx], ...data };
    logActivity('edited_building', `Edited building "${data.name}"`);
  } else {
      buildings.push({ id: Date.now(), ...data });
    logActivity('added_building', `Added building "${data.name}"`);
  }

  persistBuildings();
  updateQuickStats();
  renderBuildingsGrid();
  if (adminMap) renderMapMarkers();
  closeBuildingModal();
}


function initManagerMap() {
  if (adminMap) return;

  adminMap = L.map('manager-campus-map', {
    center:     [8.3595, 124.8675],
    zoom:       18,
    minZoom:    14,
    maxZoom:    19,
    zoomControl: true,
  });

  adminSatelliteLayer = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { attribution: 'Tiles © Esri', maxZoom: 19 }
  );
  adminStandardLayer = L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    { attribution: '© OpenStreetMap contributors', maxZoom: 19 }
  );

  adminCurrentTile = adminStandardLayer;
  adminCurrentTile.addTo(adminMap);

  const LayerToggle = L.Control.extend({
    options: { position: 'bottomright' },
    onAdd() {
      const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      const btn = L.DomUtil.create('button', '', div);
      btn.innerHTML = '🛰️';
      btn.title     = 'Toggle satellite/standard';
      Object.assign(btn.style, {
        background: 'white', border: '2px solid #ccc', borderRadius: '4px',
        width: '30px', height: '30px', fontSize: '15px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      });
      btn.addEventListener('click', () => {
        adminMap.removeLayer(adminCurrentTile);
        adminCurrentTile = adminCurrentTile === adminStandardLayer
          ? adminSatelliteLayer : adminStandardLayer;
        adminCurrentTile.addTo(adminMap);
        btn.innerHTML = adminCurrentTile === adminSatelliteLayer ? '🗺️' : '🛰️';
        const container = adminMap.getContainer();
        // Removes the dark CSS filter on the map container when satellite view is active
        if (adminCurrentTile === adminSatelliteLayer) {
          container.classList.add('satellite-active');
        } else {
          container.classList.remove('satellite-active');
        }
      });
      L.DomEvent.disableClickPropagation(div);
      return div;
    }
  });
  adminMap.addControl(new LayerToggle());

  renderMapMarkers();
}

function renderMapMarkers() {
  if (!adminMap) return;

  adminMapMarkers.forEach(m => adminMap.removeLayer(m));
  adminMapMarkers = [];

  const list = mapFilter === 'all' ? buildings : buildings.filter(b => b.pollutionLevel === mapFilter);

  list.forEach(b => {
    const color = POLLUTION_COLORS[b.pollutionLevel] || '#6b7280';
    const marker = L.circleMarker([b.lat, b.lng], {
      radius: 14, fillColor: color, color: '#fff',
      weight: 2, opacity: 1, fillOpacity: 0.85,
    }).addTo(adminMap);

    marker.bindPopup(`
      <div style="min-width:200px;font-family:'Outfit',sans-serif;">
        <div style="font-weight:700;font-size:14px;color:#1e293b;margin-bottom:6px;">${escHtml(b.name)}</div>
        <div style="font-size:13px;color:#475569;margin-bottom:4px;">
          Pollution: <span style="color:${color};font-weight:600;">${cap(b.pollutionLevel)}</span>
        </div>
        <div style="font-size:12px;color:#64748b;">${escHtml(b.description || '')}</div>
      </div>
    `);
    adminMapMarkers.push(marker);
  });
}


function renderRecycleBin() {
  const tbody = document.getElementById('recycle-bin-tbody');
  const table = document.getElementById('recycle-bin-table');
  const empty = document.getElementById('empty-recycle-message');

  if (!deletedRequests.length) {
    table.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  table.style.display = '';
  empty.style.display = 'none';

  tbody.innerHTML = deletedRequests.map(r => `
    <tr>
      <td><span style="font-family:monospace;font-size:0.82rem;color:var(--accent);">${escHtml(r.id)}</span></td>
      <td><strong>${escHtml(r.userName)}</strong></td>
      <td style="color:var(--muted);">${escHtml(r.email)}</td>
      <td style="color:var(--muted);">${escHtml(r.submittedDate)}</td>
      <td><span class="badge ${r.status}">${cap(r.status)}</span></td>
      <td style="color:var(--muted);white-space:nowrap;">${formatDate(r.deletedOn)}</td>
      <td>
        <div class="td-actions">
          <button class="btn btn-sm btn-success" onclick="restoreRequest('${r.id}')">
            <svg width="11" height="11" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z"/><path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z"/></svg>
            Restore
          </button>
          <button class="btn btn-sm btn-danger" onclick="permanentlyDeleteRequest('${r.id}')">
            <svg width="11" height="11" fill="currentColor" viewBox="0 0 16 16"><path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5Z"/></svg>
            Delete Forever
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function restoreRequest(id) {
  const r = deletedRequests.find(r => r.id === id);
  if (!r) return;
  const { deletedOn, ...restored } = r;
  requests.push(restored);
  deletedRequests = deletedRequests.filter(r => r.id !== id);
  saveRequests();
  updateQuickStats();
  renderRecycleBin();
}

function permanentlyDeleteRequest(id) {
  const r = deletedRequests.find(r => r.id === id);
  if (!r) return;
  if (!confirm(`Permanently delete ${r.userName}'s request? This cannot be undone.`)) return;
  deletedRequests = deletedRequests.filter(r => r.id !== id);
  renderRecycleBin();
}

function emptyRecycleBin() {
  if (!deletedRequests.length) return;
  if (!confirm(`Permanently delete all ${deletedRequests.length} items in the recycle bin? This cannot be undone.`)) return;
  deletedRequests = [];
  renderRecycleBin();
}


function loadRequests() {
  try {
    const raw = localStorage.getItem('nbscDataRequests');
    if (raw) requests = JSON.parse(raw);
  } catch (e) { requests = []; }
  renderRequestsTable();
  updateQuickStats();
}

function saveRequests() {
  localStorage.setItem('nbscDataRequests', JSON.stringify(requests));
}

function notifyUser(request, status) {
  try {
    const notifs = JSON.parse(localStorage.getItem('userNotifications') || '[]');
    notifs.push({
      id:        'NOTIF-' + Date.now(),
      email:     request.email,
      title:     status === 'approved' ? 'Request Approved ✅' : 'Request Denied ❌',
      message:   `Your data request (${request.id}) has been ${status} by the manager.`,
      type:      status,
      timestamp: new Date().toISOString(),
      read:      false,
    });
    localStorage.setItem('userNotifications', JSON.stringify(notifs));
  } catch (e) { /* silent */ }
}



// Checks if the user dashboard flagged a new request submission; auto-navigates to requests tab if recent
function checkForNewRequests() {
  const flag = localStorage.getItem('managerShowRequests');
  const ts   = localStorage.getItem('managerShowRequestsTimestamp');
  if (flag === 'true' && ts) {
    const age = (Date.now() - new Date(ts).getTime()) / 1000;
    localStorage.removeItem('managerShowRequests');
    localStorage.removeItem('managerShowRequestsTimestamp');
    if (age < 30) setTimeout(() => navigateTo('requests'), 400);
  }
}


function setupEventListeners() {

  document.getElementById('status-filter').addEventListener('change', e => {
    statusFilter = e.target.value;
    renderRequestsTable();
  });

  document.getElementById('pollution-filter').addEventListener('change', e => {
    pollutionFilter = e.target.value;
    renderBuildingsGrid();
  });

  document.getElementById('map-filter').addEventListener('change', e => {
    mapFilter = e.target.value;
    renderMapMarkers();
  });

  document.getElementById('building-form').addEventListener('submit', handleBuildingSubmit);

  document.getElementById('building-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeBuildingModal();
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    if (!confirm('Are you sure you want to logout?')) return;
    localStorage.removeItem('nbsc_session');
    localStorage.removeItem('managerSession');
    sessionStorage.removeItem('managerSession');
    sessionStorage.removeItem('currentUser');
    window.location.href = '../index.html';
  });
}


function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}



window.approveRequest           = approveRequest;
window.denyRequest              = denyRequest;
window.deleteRequest            = deleteRequest;
window.restoreRequest           = restoreRequest;
window.permanentlyDeleteRequest = permanentlyDeleteRequest;
window.emptyRecycleBin          = emptyRecycleBin;
window.openBuildingModal        = openBuildingModal;
window.closeBuildingModal       = closeBuildingModal;
window.editBuilding             = editBuilding;
window.deleteBuilding           = deleteBuilding;
window.handleManagerLogout        = () => document.getElementById('logoutBtn').click();
