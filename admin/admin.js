//  NBSC Admin App — admin.js
//  All localStorage paths relative to the
//  shared system (same keys as manager/user)

const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

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


function loadAdminProfile() {
  document.getElementById('admin-avatar').textContent = 'AD';
  document.getElementById('admin-name').textContent   = 'NBSC Admin';
}


//  NAVIGATION

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

  document.getElementById('page-title').textContent  = PAGE_LABELS[section].title;
  document.getElementById('topbar-sub').textContent  = PAGE_LABELS[section].sub;

  if (section === 'settings') renderStorageUsage();
}


//  DATA HELPERS

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
  // Manager activity is derived from approved/denied requests
  return getRequests()
    .filter(r => r.status === 'approved' || r.status === 'denied')
    .sort((a, b) => new Date(b.reviewedAt || b.date) - new Date(a.reviewedAt || a.date));
}


//  STATS

function updateStats() {
  const users    = getUsers().filter(u => u.role !== 'admin');
  const requests = getRequests();

  const totalUsers    = users.filter(u => u.role === 'user').length;
  const totalManagers = users.filter(u => u.role === 'manager').length;
  const totalRequests = requests.length;
  const pending       = requests.filter(r => r.status === 'pending').length;

  document.getElementById('stat-total-users').textContent    = totalUsers;
  document.getElementById('stat-total-managers').textContent = totalManagers;
  document.getElementById('stat-total-requests').textContent = totalRequests;
  document.getElementById('stat-pending').textContent        = pending;
}


//  DASHBOARD

function renderDashboard() {
  renderRecentUsers();
  renderActivityFeed();
}

function renderRecentUsers() {
  const users   = getUsers().filter(u => u.role !== 'admin').slice(-5).reverse();
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


//  USERS MANAGEMENT

function renderUsersTable() {
  const filter = document.getElementById('role-filter').value;
  let   users  = getUsers().filter(u => u.role !== 'admin');
  if (filter !== 'all') users = users.filter(u => u.role === filter);

  const tbody = document.getElementById('users-tbody');
  const empty = document.getElementById('users-empty');

  if (!users.length) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  tbody.innerHTML = users.map(u => `
    <tr>
      <td><strong>${escHtml(u.name || '—')}</strong></td>
      <td style="color:var(--muted);">${escHtml(u.email)}</td>
      <td><span class="badge ${u.role}">${cap(u.role)}</span></td>
      <td>
        <div class="td-actions">
          <button class="btn btn-ghost btn-sm" onclick="openRoleModal('${escHtml(u.email)}')">
            <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
              <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
            </svg>
            Edit Role
          </button>
          <button class="btn btn-danger btn-sm" onclick="confirmDeleteUser('${escHtml(u.email)}')">
            <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
              <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
            </svg>
            Delete
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}


let editingEmail = null;

function openRoleModal(email) {
  const users = getUsers();
  const user  = users.find(u => u.email === email);
  if (!user) return;

  editingEmail = email;
  document.getElementById('role-modal-name').textContent = user.name || user.email;
  document.getElementById('role-select').value = user.role;
  document.getElementById('role-modal').classList.add('open');
}

function closeRoleModal() {
  document.getElementById('role-modal').classList.remove('open');
  editingEmail = null;
}

function saveRole() {
  if (!editingEmail) return;
  const users   = getUsers();
  const idx     = users.findIndex(u => u.email === editingEmail);
  if (idx === -1) return;

  users[idx].role = document.getElementById('role-select').value;
  saveUsers(users);
  closeRoleModal();
  updateStats();
  renderDashboard();
  renderUsersTable();
}


let pendingDeleteEmail = null;

function confirmDeleteUser(email) {
  const users = getUsers();
  const user  = users.find(u => u.email === email);
  if (!user) {
    document.getElementById('confirm-title').textContent  = 'Error';
    document.getElementById('confirm-message').innerHTML  = 'Account does not exist.';
    document.getElementById('confirm-ok-btn').className   = 'btn btn-ghost';
    document.getElementById('confirm-ok-btn').textContent = 'Close';
    pendingConfirmAction = null;
    document.getElementById('confirm-modal').classList.add('open');
    return;
  }

  pendingDeleteEmail = email;
  document.getElementById('confirm-title').textContent   = 'Delete Account';
  document.getElementById('confirm-message').innerHTML   =
    `Are you sure you want to delete the account for <strong>${escHtml(user.name || user.email)}</strong>? This cannot be undone.`;
  document.getElementById('confirm-ok-btn').className    = 'btn btn-danger';
  document.getElementById('confirm-ok-btn').textContent  = 'Confirm';
  document.getElementById('confirm-modal').classList.add('open');
  pendingConfirmAction = doDeleteUser;
}

function doDeleteUser() {
  if (!pendingDeleteEmail) return;

  // Force logout if the deleted account is currently logged in
  try {
    const session = JSON.parse(localStorage.getItem('nbsc_session'));
    if (session && session.email === pendingDeleteEmail) {
      localStorage.removeItem('nbsc_session');
    }
  } catch (e) { /* ignore */ }

  let users = getUsers();
  users = users.filter(u => u.email !== pendingDeleteEmail);
  saveUsers(users);
  pendingDeleteEmail = null;
  updateStats();
  renderDashboard();
  renderUsersTable();
}


//  SYSTEM SETTINGS

function renderStorageUsage() {
  let total = 0;
  for (const key in localStorage) {
    if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
      total += (localStorage[key].length + key.length) * 2; // UTF-16 bytes
    }
  }
  const kb      = (total / 1024).toFixed(1);
  const limit   = 5120; // ~5MB typical limit in KB
  const pct     = Math.min((total / 1024 / limit) * 100, 100).toFixed(1);
  document.getElementById('storage-bar').style.width  = pct + '%';
  document.getElementById('storage-label').textContent = `${kb} KB used (${pct}% of ~5 MB limit)`;
}

function confirmClearRequests() {
  showConfirm(
    'Clear All Requests',
    'This will permanently delete <strong>all data requests</strong> from the system. This cannot be undone.',
    'btn btn-danger',
    () => {
      localStorage.removeItem('nbscDataRequests');
      updateStats();
      renderDashboard();
      renderStorageUsage();
    }
  );
}

function confirmClearNotifications() {
  showConfirm(
    'Clear Notifications',
    'This will remove <strong>all user notifications</strong> stored in the system.',
    'btn btn-warn',
    () => {
      localStorage.removeItem('userNotifications');
      renderStorageUsage();
    }
  );
}

function confirmResetBuildings() {
  showConfirm(
    'Reset Buildings',
    'This will restore campus buildings to the <strong>default configuration</strong>. Any custom buildings will be lost.',
    'btn btn-warn',
    () => {
      localStorage.removeItem('nbscBuildings');
      renderStorageUsage();
    }
  );
}


//  CONFIRM MODAL (generic)

let pendingConfirmAction = null;

function showConfirm(title, message, btnClass, action) {
  document.getElementById('confirm-title').textContent   = title;
  document.getElementById('confirm-message').innerHTML   = message;
  document.getElementById('confirm-ok-btn').className    = btnClass;
  pendingConfirmAction = action;
  document.getElementById('confirm-modal').classList.add('open');
}

function confirmAction() {
  if (typeof pendingConfirmAction === 'function') pendingConfirmAction();
  closeConfirmModal();
}

function closeConfirmModal() {
  document.getElementById('confirm-modal').classList.remove('open');
  document.getElementById('confirm-ok-btn').textContent = 'Confirm';
  document.getElementById('confirm-ok-btn').className   = 'btn btn-danger';
  pendingConfirmAction = null;
  pendingDeleteEmail   = null;
}

// Close modals on backdrop click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) {
      closeRoleModal();
      closeConfirmModal();
      closeAddUserModal();
    }
  });
});


//  UTILS

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
}


function openAddUserModal() {
  document.getElementById('add-user-name').value     = '';
  document.getElementById('add-user-email').value    = '';
  document.getElementById('add-user-password').value = '';
  document.getElementById('add-user-role').value     = 'user';
  document.getElementById('add-user-error').style.display = 'none';
  document.getElementById('add-user-error').textContent   = '';
  document.getElementById('add-user-modal').classList.add('open');
}

function closeAddUserModal() {
  document.getElementById('add-user-modal').classList.remove('open');
}

function submitAddUser() {
  const name     = document.getElementById('add-user-name').value.trim();
  const email    = document.getElementById('add-user-email').value.trim().toLowerCase();
  const password = document.getElementById('add-user-password').value;
  const role     = document.getElementById('add-user-role').value;
  const errEl    = document.getElementById('add-user-error');

  errEl.style.display = 'none';

  if (!name) {
    errEl.textContent = 'Name is required.';
    errEl.style.display = 'block';
    document.getElementById('add-user-name').classList.add('error');
    return;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errEl.textContent = 'Enter a valid email address.';
    errEl.style.display = 'block';
    document.getElementById('add-user-email').classList.add('error');
    return;
  }
  if (!password || password.length < 6) {
    errEl.textContent = 'Password must be at least 6 characters.';
    errEl.style.display = 'block';
    document.getElementById('add-user-password').classList.add('error');
    return;
  }

  const users = getUsers();
  if (users.find(u => u.email === email)) {
    errEl.textContent = 'An account with this email already exists.';
    errEl.style.display = 'block';
    document.getElementById('add-user-email').classList.add('error');
    return;
  }

  users.push({ name, email, password, role });
  saveUsers(users);
  closeAddUserModal();
  updateStats();
  renderDashboard();
  renderUsersTable();
}


//  INIT

loadAdminProfile();
updateStats();
renderDashboard();
renderUsersTable();
