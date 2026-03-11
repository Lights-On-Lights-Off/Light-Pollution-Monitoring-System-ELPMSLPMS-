const CAMPUS_CENTER = [8.359999, 124.868103];

const CAMPUS_BOUNDS = L.latLngBounds(
  [8.355000, 124.860000],
  [8.365000, 124.876000]
);

const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

const POLLUTION_COLORS = {
  low:      "#22c55e",
  moderate: "#f59e0b",
  high:     "#ef4444"
};

let campusBuildings = [];

function loadCampusBuildings() {
  const savedBuildings = localStorage.getItem('nbscBuildings');
  if (savedBuildings) {
    campusBuildings = JSON.parse(savedBuildings);
  } else {
    campusBuildings = [
      { id: "B01", name: "SWDC Building", coordinates: [8.360309105794068, 124.86777742438035], pollutionLevel: "moderate", description: "Main administrative offices", lux: 55, online: true },
      { id: "B02", name: "Northern Bukidnon State College Covered Court", coordinates: [8.360122375785208, 124.86894170546891], pollutionLevel: "moderate", description: "Sports and events facility", lux: 62, online: true },
      { id: "B03", name: "NBSC Library", coordinates: [8.359264030617997, 124.86789449725583], pollutionLevel: "low", description: "Main library and study center", lux: 18, online: true },
      { id: "B04", name: "NBSC Clinic", coordinates: [8.359157605365368, 124.86817955256836], pollutionLevel: "moderate", description: "Medical services and health center", lux: 47, online: true },
      { id: "B05", name: "BSBA Building", coordinates: [8.359096410833255, 124.86842964826772], pollutionLevel: "high", description: "Business and administration classrooms", lux: 130, online: true },
      { id: "B06", name: "ICS Laboratory", coordinates: [8.359221460529115, 124.86905085372219], pollutionLevel: "moderate", description: "Computer science and IT laboratory", lux: 70, online: true }
    ];
  }
}

loadCampusBuildings();

const map = L.map("map", {
  center: CAMPUS_CENTER,
  zoom: 18,
  minZoom: 16,
  maxZoom: 30,
  maxBounds: CAMPUS_BOUNDS,
  maxBoundsViscosity: 1.0,
  rotate: true,
});

L.rectangle(CAMPUS_BOUNDS, {
  color: "#0d6efd",
  weight: 2,
  fillOpacity: 0.05
}).addTo(map).bindPopup("Northern Bukidnon State College");

const colored = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const satellite = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  { maxZoom: 19 }
);

L.control.layers(
  { "Colored Map": colored, "Satellite View": satellite },
  null,
  { position: "bottomright" }
).addTo(map);

// Removes the dark CSS filter on the map container when satellite view is active
map.on('baselayerchange', e => {
  const container = map.getContainer();
  if (e.name === 'Satellite View') {
    container.classList.add('satellite-active');
  } else {
    container.classList.remove('satellite-active');
  }
});

const lightMarkers = {};

function buildPopupHTML(building) {
  const color = POLLUTION_COLORS[building.pollutionLevel];
  return `
    <div style="font-family:'Outfit',sans-serif; min-width:180px;">
      <div style="font-weight:700; font-size:0.95rem; margin-bottom:6px;">${building.name}</div>
      <div style="margin-bottom:4px;">
        <span style="color:#888; font-size:0.78rem;">Pollution Level:</span>
        <span style="
          display:inline-block; margin-left:6px; padding:2px 8px;
          border-radius:10px; font-size:0.75rem; font-weight:600;
          background:${color}33; color:${color}; border:1px solid ${color}66;
        ">${cap(building.pollutionLevel)}</span>
      </div>
      <div style="font-size:0.8rem; color:#777; margin-top:4px;">${building.description}</div>
    </div>
  `;
}

campusBuildings.forEach(building => {
  const marker = L.circleMarker(building.coordinates, {
    radius: 10,
    fillColor: POLLUTION_COLORS[building.pollutionLevel],
    color: "#fff",
    weight: 2,
    fillOpacity: 0.9
  }).addTo(map);
  marker.bindPopup(buildPopupHTML(building));
  lightMarkers[building.id] = marker;
});

const statusChart = new Chart(document.getElementById("statusChart"), {
  type: "pie",
  data: {
    labels: ["Low", "Moderate", "High"],
    datasets: [{ data: [0, 0, 0], backgroundColor: [POLLUTION_COLORS.low, POLLUTION_COLORS.moderate, POLLUTION_COLORS.high] }]
  },
  options: { plugins: { legend: { labels: { color: "#fff" } } } }
});

function updateKPIsAndStatusChart() {
  const total   = campusBuildings.length;
  const online  = campusBuildings.filter(b => b.online).length;
  const offline = total - online;

  document.getElementById("kpiTotal").textContent   = total;
  document.getElementById("kpiOnline").textContent  = online;
  document.getElementById("kpiOffline").textContent = offline;

  const counts = { low: 0, moderate: 0, high: 0 };
  campusBuildings.forEach(b => counts[b.pollutionLevel]++);
  statusChart.data.datasets[0].data = [counts.low, counts.moderate, counts.high];
  statusChart.update();
}

updateKPIsAndStatusChart();

const lightTrendChart = new Chart(document.getElementById("flowChart"), {
  type: "line",
  data: {
    labels: [],
    datasets: campusBuildings.map(b => ({
      label: b.name, data: [], borderWidth: 2, fill: false,
      borderColor: POLLUTION_COLORS[b.pollutionLevel]
    }))
  },
  options: {
    plugins: { legend: { labels: { color: "#fff", font: { size: 10 } } } },
    scales: {
      y: { title: { display: true, text: "Light Intensity (lux)", color: "#aaa" }, ticks: { color: "#aaa" }, grid: { color: "rgba(255,255,255,0.05)" } },
      x: { ticks: { color: "#aaa" }, grid: { color: "rgba(255,255,255,0.05)" } }
    }
  }
});

// Uses weighted random instead of fixed thresholds to vary simulation output
function getLevelFromLux(lux) {
  const r = Math.random();
  if (r < 0.40) return "low";
  if (r < 0.70) return "moderate";
  return lux > 60 ? "high" : "moderate";
}

function getPollutionLabel(level) {
  const labels = { low: "Low", moderate: "Moderate", high: "High (Light Pollution)" };
  return labels[level] || level;
}

function getLogTimestamp() {
  const now = new Date();
  return now.getFullYear() + "-" +
    String(now.getMonth() + 1).padStart(2, "0") + "-" +
    String(now.getDate()).padStart(2, "0") + " " +
    String(now.getHours()).padStart(2, "0") + ":" +
    String(now.getMinutes()).padStart(2, "0") + ":" +
    String(now.getSeconds()).padStart(2, "0");
}

function addLightLogEntry(building) {
  if (!logBody) return;
  const color = POLLUTION_COLORS[building.pollutionLevel];
  const row   = document.createElement("tr");
  row.innerHTML = `
    <td>${building.name}</td>
    <td>
      <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:6px;"></span>
      ${cap(building.pollutionLevel)}
    </td>
    <td>${building.lux.toFixed(1)}</td>
    <td>${getPollutionLabel(building.pollutionLevel)}</td>
    <td>${building.online ? "Online" : "Offline"}</td>
    <td>${getLogTimestamp()}</td>
  `;
  logBody.prepend(row);
  if (logBody.children.length > 50) logBody.removeChild(logBody.lastChild);
}

// Must be declared before setInterval so the first tick can reference it
const logBody = document.getElementById("logBody");

setInterval(() => {
  const time = new Date().toLocaleTimeString();
  lightTrendChart.data.labels.push(time);
  if (lightTrendChart.data.labels.length > 10) lightTrendChart.data.labels.shift();

  campusBuildings.forEach((building, index) => {
    building.lux            = Math.min(150, Math.max(5, building.lux + (Math.random() - 0.5) * 15));
    building.pollutionLevel = getLevelFromLux(building.lux);

    lightTrendChart.data.datasets[index].data.push(building.lux.toFixed(1));
    if (lightTrendChart.data.datasets[index].data.length > 10) lightTrendChart.data.datasets[index].data.shift();

    lightMarkers[building.id].setStyle({ fillColor: POLLUTION_COLORS[building.pollutionLevel] });
    lightMarkers[building.id].setPopupContent(buildPopupHTML(building));
    addLightLogEntry(building);
  });

  lightTrendChart.update();
  updateKPIsAndStatusChart();
}, 5000);

function getSession() {
  const raw = localStorage.getItem('nbsc_session');
  return raw ? JSON.parse(raw) : null;
}

function updateNavForSession() {
  const dropdown = document.getElementById("userDropdown");
  if (!dropdown) return;
  const session = getSession();
  if (session) {
    const dest = session.role === 'manager' ? 'manager/manager.html'
               : session.role === 'admin'   ? 'admin/admin.html'
               : 'user/user.html';
    dropdown.innerHTML = `
      <div class="user-dropdown-header"><span class="user-status-dot"></span> ${session.name || session.email}</div>
      <a href="${dest}" class="user-dropdown-item">Go to Dashboard</a>
      <a href="#" class="user-dropdown-item" onclick="doLogout()">Logout</a>
    `;
  } else {
    dropdown.innerHTML = `
      <div class="user-dropdown-header"><span class="user-status-dot"></span> USER</div>
      <a href="login.html" class="user-dropdown-item">Login Here</a>
      <a href="login.html#register" class="user-dropdown-item">Register Here</a>
    `;
  }
}

function doLogout() {
  localStorage.removeItem('nbsc_session');
  updateNavForSession();
}

const userMenuToggle = document.getElementById("userMenuToggle");
const userDropdown   = document.getElementById("userDropdown");

userMenuToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  userDropdown.classList.toggle("open");
});

// Clicking anywhere outside the dropdown closes it
document.addEventListener("click", () => userDropdown.classList.remove("open"));

updateNavForSession();

const pollutionFilter = document.getElementById("pollutionFilter");
pollutionFilter.addEventListener("change", () => {
  const val = pollutionFilter.value;
  campusBuildings.forEach(building => {
    const marker = lightMarkers[building.id];
    if (val === "all" || building.pollutionLevel === val) {
      marker.addTo(map);
    } else {
      map.removeLayer(marker);
    }
  });
});

// Redirects guests to login; sends logged-in users to their role dashboard
document.getElementById("requestDataBtn").addEventListener("click", () => {
  const session = getSession();
  if (session) {
    const dest = session.role === 'manager' ? 'manager/manager.html'
               : session.role === 'admin'   ? 'admin/admin.html'
               : 'user/user.html';
    window.location.href = dest;
  } else {
    window.location.href = "login.html";
  }
});
