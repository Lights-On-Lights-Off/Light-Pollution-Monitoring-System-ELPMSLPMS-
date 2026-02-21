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