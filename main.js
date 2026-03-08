// ── Campus Center & Bounds ──
const CAMPUS_CENTER = [8.359999, 124.868103];

const CAMPUS_BOUNDS = L.latLngBounds(
  [8.355000, 124.860000],
  [8.365000, 124.876000]
);

// ── Pollution Level Colors ──

// ── Capitalize first letter ──
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
const POLLUTION_COLORS = {
  low:      "#22c55e",   // green
  moderate: "#f59e0b",   // yellow-orange
  high:     "#ef4444"    // red
};

// ── Campus Buildings (sensor data) ──
let campusBuildings = [];

function loadCampusBuildings() {
  const savedBuildings = localStorage.getItem('nbscBuildings');
  if (savedBuildings) {
    campusBuildings = JSON.parse(savedBuildings);
  } else {
    campusBuildings = [
      {
        id: "B01",
        name: "SWDC Building",
        coordinates: [8.360309105794068, 124.86777742438035],
        pollutionLevel: "moderate",
        description: "Main administrative offices",
        lux: 55,
        online: true
      },
      {
        id: "B02",
        name: "Northern Bukidnon State College Covered Court",
        coordinates: [8.360122375785208, 124.86894170546891],
        pollutionLevel: "moderate",
        description: "Sports and events facility",
        lux: 62,
        online: true
      },
      {
        id: "B03",
        name: "NBSC Library",
        coordinates: [8.359264030617997, 124.86789449725583],
        pollutionLevel: "low",
        description: "Main library and study center",
        lux: 18,
        online: true
      },
      {
        id: "B04",
        name: "NBSC Clinic",
        coordinates: [8.359157605365368, 124.86817955256836],
        pollutionLevel: "moderate",
        description: "Medical services and health center",
        lux: 47,
        online: true
      },
      {
        id: "B05",
        name: "BSBA Building",
        coordinates: [8.359096410833255, 124.86842964826772],
        pollutionLevel: "high",
        description: "Business and administration classrooms",
        lux: 130,
        online: true
      },
      {
        id: "B06",
        name: "ICS Laboratory",
        coordinates: [8.359221460529115, 124.86905085372219],
        pollutionLevel: "moderate",
        description: "Computer science and IT laboratory",
        lux: 70,
        online: true
      }
    ];
  }
}

loadCampusBuildings();

// ── Map Init ──
const map = L.map("map", {
  center: CAMPUS_CENTER,
  zoom: 18,
  minZoom: 16,
  maxZoom: 30,
  maxBounds: CAMPUS_BOUNDS,
  maxBoundsViscosity: 1.0,
  rotate: true,
});

// Campus border rectangle
L.rectangle(CAMPUS_BOUNDS, {
  color: "#0d6efd",
  weight: 2,
  fillOpacity: 0.05
}).addTo(map).bindPopup("Northern Bukidnon State College");

// Basemap layers
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

// ── Map Markers ──
const lightMarkers = {};

function buildPopupHTML(building) {
  const color = POLLUTION_COLORS[building.pollutionLevel];
  return `
    <div style="font-family:'Outfit',sans-serif; min-width:180px;">
      <div style="font-weight:700; font-size:0.95rem; margin-bottom:6px;">${building.name}</div>
      <div style="margin-bottom:4px;">
        <span style="color:#888; font-size:0.78rem;">Pollution Level:</span>
        <span style="
          display:inline-block;
          margin-left:6px;
          padding:2px 8px;
          border-radius:10px;
          font-size:0.75rem;
          font-weight:600;
          background:${color}33;
          color:${color};
          border:1px solid ${color}66;
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

    // --- UPDATED POPUP CONTENT (Dark Text for White Background) ---
    const popupContent = `
        <div style="font-family: 'Inter', sans-serif; padding: 5px; min-width: 200px;">
            <h4 style="
                margin: 0 0 8px 0;
                color: #111827; /* Dark Black */
                font-size: 16px;
                font-weight: 700;
                border-bottom: 1px solid #eee;
                padding-bottom: 8px;
            ">${building.name}</h4>
            
            <p style="margin: 8px 0; font-size: 14px; color: #374151;">
                <strong>Level:</strong> 
                <span style="
                    color: ${color}; 
                    font-weight: 600; 
                    background: #f3f4f6; 
                    padding: 2px 6px; 
                    border-radius: 4px;
                ">${getPollutionLabel(building.pollutionLevel)}</span>
            </p>
            
            <p style="
                margin: 0;
                color: #6b7280; /* Grey description text */
                font-size: 13px;
                line-height: 1.4;
            ">${building.description}</p>
        </div>
    `;

    marker.bindPopup(popupContent);
    
    // Simple hover animation
    marker.on('mouseover', function() {
        this._icon.querySelector('div').style.transform = 'scale(1.2)';
    });
    marker.on('mouseout', function() {
        this._icon.querySelector('div').style.transform = 'scale(1)';
    });
}

function getPollutionColor(level) {
    // Slightly darker colors for better contrast on white
    switch(level) {
        case 'low': return '#16a34a';      // Green
        case 'moderate': return '#d97706'; // Orange
        case 'high': return '#dc2626';     // Red
        default: return '#9ca3af';
    }
}

function getPollutionLabel(level) {
    switch(level) {
        case 'low': return 'Low';
        case 'moderate': return 'Moderate';
        case 'high': return 'High';
        default: return 'Unknown';
    }
}

function getPollutionStatus(level) {
    switch(level) {
        case 'low': return 'Acceptable';
        case 'moderate': return 'Check Required';
        case 'high': return 'Action Needed';
        default: return 'Unknown';
    }
}

function populateBuildingTable() {
    const tableBody = document.getElementById('building-table-body');
    // Ensure the table in HTML has class="light-table"
    
    tableBody.innerHTML = '';
    
    campusBuildings.forEach(building => {
        const row = document.createElement('tr');
        const label = getPollutionLabel(building.pollutionLevel);
        
        row.innerHTML = `
            <td><strong>${building.name}</strong></td>
            <td><span class="status-${building.pollutionLevel}">${label}</span></td>
            <td>${getPollutionStatus(building.pollutionLevel)}</td>
        `;
        
        row.addEventListener('click', () => {
            map.eachLayer(function(layer) {
                if (layer instanceof L.Marker && layer.options.title === building.name) {
                    layer.openPopup();
                    map.setView(building.coordinates, 17);
                }
            });
        });
        
        tableBody.appendChild(row);
    });
}

window.addEventListener('resize', function() {
    if (map) map.invalidateSize();
});