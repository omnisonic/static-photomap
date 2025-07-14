// Auto-generated albums index
const AVAILABLE_ALBUMS = [
  "july_9_trail_run_unintas",
  "roadtrip_2025"
];

// Get list of available albums
function getAvailableAlbums() {
    return AVAILABLE_ALBUMS;
}

// Load album data dynamically
async function loadAlbumData(albumName) {
    try {
        const response = await fetch(`js/albums/${albumName}.js`);
        if (!response.ok) {
            throw new Error(`Failed to load album data: ${response.status}`);
        }
        
        // Create a script element to load the album data
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `js/albums/${albumName}.js`;
            script.onload = () => {
                const albumData = window.ALBUM_DATA;
                resolve(albumData || []);
            };
            script.onerror = () => reject(new Error(`Failed to load album script`));
            document.head.appendChild(script);
        });
    } catch (error) {
        console.error(`Error loading album data for ${albumName}:`, error);
        return [];
    }
}

// Load Avenza data for an album if available
async function loadAvenzaData(albumName) {
    try {
        const response = await fetch(`photos/${albumName}/avenza.geojson`);
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.log(`No Avenza data found for ${albumName}`);
    }
    return null;
}
