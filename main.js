let map;

// NBSC Campus Buildings Data
const campusBuildings = [
    {
        name: "SWDC Building",
        coordinates: [8.360392119715149, 124.86762916676057],
        pollutionLevel: "moderate",
        description: "Main administrative offices"
        
    },
    // Add more buildings here...
]
document.addEventListener('DOMContentLoaded', function() {
    showHomePage();
});
function showHomePage() {
    document.getElementById('home-page').classList.add('active');
    document.getElementById('map-page').classList.remove('active');
    if (map) {
        map.remove();
        map = null;
    }
}

function showMapPage() {
    document.getElementById('home-page').classList.remove('active');
    document.getElementById('map-page').classList.add('active');
    setTimeout(() => {
        initializeMap();
        populateBuildingTable();
    }, 100);
}
function initializeMap() {
    const campusCenter = [8.3595, 124.8675];
    map = L.map('campus-map', {
        center: campusCenter,
        zoom: 16,
        minZoom: 14,
        maxZoom: 18,
        zoomControl: true
    });
  }
    // 1. STANDARD OSM TILES (Naturally Light/White)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    // 2. Campus Boundary (Darker Yellow for visibility on white)
    const campusBounds = L.latLngBounds(
        [8.3540, 124.8620],
        [8.3650, 124.8730]
    );
    
    L.rectangle(campusBounds, {
        color: '#f59e0b', // Darker yellow/orange
        weight: 2,
        fillOpacity: 0.05,
        fillColor: '#f59e0b'
    }).addTo(map).bindPopup('NBSC Campus Boundary');

    campusBuildings.forEach(building => {
        addBuildingMarker(building);
    });

function addBuildingMarker(building) {
    const color = getPollutionColor(building.pollutionLevel);
    
    const customIcon = L.divIcon({
        className: 'campus-marker',
        html: `<div style="
            background: ${color};
            width: 18px;
            height: 18px;
            border-radius: 50%;
            border: 3px solid #fff; /* White border makes it pop on map */
            box-shadow: 0 3px 8px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: transform 0.2s ease;
        "></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });

    const marker = L.marker(building.coordinates, {
        icon: customIcon,
        title: building.name
    }).addTo(map);
  }
  
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