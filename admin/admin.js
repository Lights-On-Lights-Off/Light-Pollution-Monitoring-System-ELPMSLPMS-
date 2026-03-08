// NBSC Admin App — admin.js

const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

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

function checkAdminAuth() {
  const raw = localStorage.getItem('nbsc_session');
  if (!raw) { window.location.href = '../index.html'; return; }
  try {
    const session = JSON.parse(raw);
    if (session.role !== 'admin') window.location.href = '../index.html';
  } catch (e) {
    window.location.href = '../index.html';
  }
}

function loadAdminProfile() {
  const raw = localStorage.getItem('nbsc_session');
  if (!raw) return;
  try {
    const session  = JSON.parse(raw);
    const name     = session.name || 'Admin';
    const initials = name.split(' ').map(w => w[0].toUpperCase()).slice(0, 2).join('');
    document.getElementById('admin-avatar').textContent = initials;
    document.getElementById('admin-name').textContent   = name;
  } catch (e) { /* ignore */ }
}

function seedDefaultAdmin() {
  const raw    = localStorage.getItem('nbsc_users');
  let users    = raw ? JSON.parse(raw) : [];
  const exists = users.find(u => u.email === 'admin@example.com');
  if (!exists) {
    users.push({ email: 'admin@example.com', password: 'admin123', name: 'System Admin', role: 'admin' });
    localStorage.setItem('nbsc_users', JSON.stringify(users));
  }
}

const PAGE_LABELS = {
  dashboard: { title: 'Dashboard',        sub: 'System overview' },
  users:     { title: 'Users Management', sub: 'Manage accounts and roles' },
  settings:  { title: 'System Settings',  sub: 'Storage and data controls' },
};

function navigate(btn) {
  const section = btn.dataset.section;

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  btn.classList.add('active');

  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(`section-${section}`).classList.add('active');

  document.getElementById('page-title').textContent = PAGE_LABELS[section].title;
  document.getElementById('topbar-sub').textContent = PAGE_LABELS[section].sub;

  if (section === 'settings') renderStorageUsage();
}  

function getUsers() {
  try { return JSON.parse(localStorage.getItem('nbsc_users')) || []; }
  catch (e) { return []; }
}

function saveUsers(users) {
  localStorage.setItem('nbsc_users', JSON.stringify(users));
}

function getRequests() {
  try { return JSON.parse(localStorage.getItem('nbscDataRequests')) || []; }
  catch (e) { return []; }
}

function getNotifications() {
  try { return JSON.parse(localStorage.getItem('userNotifications')) || []; }
  catch (e) { return []; }
}

function getActivityLog() {
  return getRequests()
    .filter(r => r.status === 'approved' || r.status === 'denied')
    .sort((a, b) => new Date(b.reviewedAt || b.date) - new Date(a.reviewedAt || a.date));
} 

function updateStats() {
  const users    = getUsers().filter(u => u.role !== 'admin');
  const requests = getRequests();

  document.getElementById('stat-total-users').textContent    = users.filter(u => u.role === 'user').length;
  document.getElementById('stat-total-managers').textContent = users.filter(u => u.role === 'manager').length;
  document.getElementById('stat-total-requests').textContent = requests.length;
  document.getElementById('stat-pending').textContent        = requests.filter(r => r.status === 'pending').length;
} 

function renderDashboard() {
  renderRecentUsers();
  renderActivityFeed();
}

function renderRecentUsers() {
  const users     = getUsers().filter(u => u.role !== 'admin').slice(-5).reverse();
  const container = document.getElementById('recent-users-list');

  if (!users.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">👤</div><p>No accounts yet</p></div>`;
    return;
  }

  container.innerHTML = users.map(u => `
    <div class="mini-item">
      <div class="mini-item-left">
        <span class="mini-item-name">${escHtml(u.name || '—')}</span>
        <span class="mini-item-sub">${escHtml(u.email)}</span>
      </div>
      <span class="badge ${u.role}">${cap(u.role)}</span>
    </div>
  `).join('');
}

function renderActivityFeed() {
  const activities = getActivityLog().slice(0, 10);
  const feed       = document.getElementById('activity-feed');
  const count      = document.getElementById('activity-count');

  count.textContent = `${activities.length} event${activities.length !== 1 ? 's' : ''}`;

  if (!activities.length) {
    feed.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><p>No manager activity yet</p></div>`;
    return;
  }

  feed.innerHTML = activities.map(r => {
    const managerName = r.reviewedBy || 'A manager';
    const statusClass = r.status;
    const statusWord  = cap(r.status);
    const time        = r.reviewedAt ? formatTime(r.reviewedAt) : formatTime(r.date);
    return `
      <div class="activity-item">
        <div class="activity-dot ${statusClass}"></div>
        <div>
          <div class="activity-text">
            <strong>${escHtml(managerName)}</strong> ${statusWord.toLowerCase()} request
            <strong>#${escHtml(r.id)}</strong> from <strong>${escHtml(r.name || r.email || '—')}</strong>
          </div>
          <div class="activity-time">${time}</div>
        </div>
      </div>
    `;
  }).join('');
} 