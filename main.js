// long,lat sa campus
const CAMPUS_CENTER = [8.359999, 124.868103];

// Define bounds sa campus paras campus ditso
const CAMPUS_BOUNDS = L.latLngBounds(
  [8.355000, 124.860000],
  [8.365000, 124.876000]  
);

//Leaflet ni for map initialization v2 (naanay panning )
const map = L.map("map", {
  center: CAMPUS_CENTER,
  zoom: 18,
  minZoom: 16,
  maxZoom: 30,
  maxBounds: CAMPUS_BOUNDS,
  maxBoundsViscosity: 1.0,
  rotate: true,
});

// Para ma mark ang border around campus since walay way para campus lang makita
L.rectangle(CAMPUS_BOUNDS, {
  color: "#0d6efd",
  weight: 2,
  fillOpacity: 0.05
}).addTo(map).bindPopup("Northern Bukidnon State College");

// Basemap layer gamitCartoDB Voyager
const colored = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Alternative Satellite Basemap Layer gamit ESRI
const satellite = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  { maxZoom: 19 }
);
colored.addTo(map);

// Control Layer para sa maps (CartoDB Voyager | ESRI Satellite)
L.control.layers(
  {
    "Colored Map": colored,
    "Satellite View": satellite
  },
  null,
  { position: "bottomright" }
).addTo(map);