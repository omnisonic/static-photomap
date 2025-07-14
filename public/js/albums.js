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
        
        // Get the JavaScript content as text
        const jsContent = await response.text();
        
        // Create a safe evaluation context
        const evalContext = {};
        
        // Execute the JavaScript in a controlled way
        const func = new Function('context', `
            ${jsContent}
            context.ALBUM_DATA = ALBUM_DATA;
        `);
        
        func(evalContext);
        
        return evalContext.ALBUM_DATA || [];
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
