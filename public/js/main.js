// Global variables
let map;
let currentMarkers = [];
let currentAvenzaLayer = null;
let imageObserver = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    populateAlbumSelector();
    setupEventListeners();
    initializeLazyLoading();
});

// Initialize the Leaflet map
function initializeMap() {
    map = L.map('map').setView([39.8283, -98.5795], 4);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
}

// Populate the album selector dropdown
function populateAlbumSelector() {
    const albumSelect = document.getElementById('albumSelect');
    const albums = getAvailableAlbums();
    
    // Clear existing options except the first one
    albumSelect.innerHTML = '<option value="">Select an album...</option>';
    
    albums.forEach(album => {
        const option = document.createElement('option');
        option.value = album;
        option.textContent = album;
        albumSelect.appendChild(option);
    });
    
    // Auto-load the first album if available
    if (albums.length > 0) {
        const firstAlbum = albums[0];
        albumSelect.value = firstAlbum;
        loadAlbum(firstAlbum);
    }
}

// Setup event listeners
function setupEventListeners() {
    const albumSelect = document.getElementById('albumSelect');
    const modal = document.getElementById('photoModal');
    const closeBtn = document.querySelector('.close');
    
    // Album selection change
    albumSelect.addEventListener('change', function() {
        const selectedAlbum = this.value;
        if (selectedAlbum) {
            loadAlbum(selectedAlbum);
        } else {
            clearMap();
            clearGallery();
        }
    });
    
    // Modal close events
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Keyboard events
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

// Load an album
async function loadAlbum(albumName) {
    console.log(`Loading album: ${albumName}`);
    showLoading();
    
    try {
        // Validate album name
        if (!albumName || typeof albumName !== 'string') {
            throw new Error('Invalid album name provided');
        }
        
        // Load album data with validation
        const photos = await loadAlbumData(albumName);
        console.log(`Loaded ${photos.length} photos for album: ${albumName}`);
        
        // Validate photo data structure
        const validPhotos = photos.filter(photo => {
            const isValid = photo && 
                           typeof photo.latitude === 'number' && 
                           typeof photo.longitude === 'number' && 
                           photo.filename && 
                           photo.path;
            if (!isValid) {
                console.warn('Invalid photo data found:', photo);
            }
            return isValid;
        });
        
        console.log(`${validPhotos.length} valid photos with GPS data found`);
        
        const avenzaData = await loadAvenzaData(albumName);
        if (avenzaData) {
            console.log('Avenza GPS track data loaded');
        }
        
        // Fetch presigned URLs for all photos using authenticated requests
        const photosWithUrls = await Promise.all(validPhotos.map(async photo => {
            try {
                const response = await window.authManager.makeAuthenticatedRequest(
                    `/.netlify/functions/s3-proxy?key=${encodeURIComponent(photo.path)}`
                );
                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error('Authentication required');
                    }
                    throw new Error('Failed to get URL');
                }
                return {
                    ...photo,
                    presignedUrl: await response.text()
                };
            } catch (error) {
                console.error('Error getting presigned URL:', error);
                if (error.message === 'Not authenticated' || error.message === 'Authentication required') {
                    window.authManager.showAuthUI();
                }
                return {
                    ...photo,
                    presignedUrl: null
                };
            }
        }));

        console.log(`Successfully processed ${photosWithUrls.length} photos for display`);
        
        updateMap(photosWithUrls, avenzaData);
        updateGallery(photosWithUrls);
        updatePhotoCount(photosWithUrls.length);
        
        console.log(`Album ${albumName} loaded successfully`);
    } catch (error) {
        console.error('Error loading album:', error);
        showError('Error loading album: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Update the map with photos and optional Avenza data
function updateMap(photos, avenzaData) {
    clearMap();
    
    if (photos.length === 0) {
        return;
    }
    
    // Sort photos by date taken (chronological order) for consistent ordering
    const sortedPhotos = [...photos].sort((a, b) => {
        // Convert datetime string "2025:07:09 17:54:13" to Date object
        const dateA = new Date(a.datetime.replace(/:/g, '-').replace(/-(\d{2}:\d{2}:\d{2})$/, ' $1'));
        const dateB = new Date(b.datetime.replace(/:/g, '-').replace(/-(\d{2}:\d{2}:\d{2})$/, ' $1'));
        return dateA - dateB;
    });
    
    // Calculate bounds
    const lats = sortedPhotos.map(p => p.latitude);
    const lngs = sortedPhotos.map(p => p.longitude);
    const bounds = [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)]
    ];
    
    // Add photo markers
    sortedPhotos.forEach(photo => {
        const marker = L.marker([photo.latitude, photo.longitude], {
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            })
        });
        
        // Create popup content
        const popupContent = `
            <div style="text-align: center;">
                <img src="${photo.presignedUrl || photo.path}"
                     class="popup-image" 
                     onclick="openModal('${photo.presignedUrl || photo.path}', '${photo.filename}')"
                     onerror="this.style.display='none'">
                <div class="popup-filename">${photo.filename}</div>
            </div>
        `;
        
        marker.bindPopup(popupContent, { maxWidth: 250 });
        marker.addTo(map);
        currentMarkers.push(marker);
    });
    
    // Add Avenza data if available
    if (avenzaData) {
        currentAvenzaLayer = L.geoJSON(avenzaData, {
            style: {
                fillColor: 'blue',
                color: 'blue',
                weight: 2,
                fillOpacity: 0.3
            }
        }).addTo(map);
    }
    
    // Fit map to bounds with padding
    if (photos.length === 1) {
        map.setView([photos[0].latitude, photos[0].longitude], 15);
    } else {
        map.fitBounds(bounds, { padding: [20, 20] });
    }
}

// Initialize lazy loading with Intersection Observer
function initializeLazyLoading() {
    // Check if Intersection Observer is supported
    if ('IntersectionObserver' in window) {
        imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const actualSrc = img.dataset.src;
                    
                    if (actualSrc) {
                        // Show loading indicator
                        img.classList.add('loading');
                        
                        // Load the actual image
                        img.src = actualSrc;
                        img.removeAttribute('data-src');
                        
                        // Remove loading class when image loads
                        img.onload = () => {
                            img.classList.remove('loading');
                            img.classList.add('loaded');
                        };
                        
                        // Handle errors
                        img.onerror = () => {
                            img.classList.remove('loading');
                            handleImageError(img);
                        };
                        
                        // Stop observing this image
                        observer.unobserve(img);
                    }
                }
            });
        }, {
            // Load images when they're 100px away from viewport
            rootMargin: '100px'
        });
    }
}

// Update the photo gallery with lazy loading
function updateGallery(photos) {
    const gallery = document.getElementById('gallery');
    
    if (photos.length === 0) {
        gallery.innerHTML = '<div class="no-photos"><p>No photos with GPS data found in this album</p></div>';
        return;
    }
    
    // Sort photos by date taken (chronological order)
    const sortedPhotos = [...photos].sort((a, b) => {
        // Convert datetime string "2025:07:09 17:54:13" to Date object
        const dateA = new Date(a.datetime.replace(/:/g, '-').replace(/-(\d{2}:\d{2}:\d{2})$/, ' $1'));
        const dateB = new Date(b.datetime.replace(/:/g, '-').replace(/-(\d{2}:\d{2}:\d{2})$/, ' $1'));
        return dateA - dateB;
    });
    
    gallery.innerHTML = '';
    
    sortedPhotos.forEach(photo => {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        
        // Create placeholder image with lazy loading
        const actualSrc = photo.presignedUrl || photo.path;
        const placeholderSrc = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+';
        
        photoItem.innerHTML = `
            <img src="${placeholderSrc}"
                 data-src="${actualSrc}"
                 alt="${photo.filename}"
                 class="lazy-image"
                 onclick="openModal('${actualSrc}', '${photo.filename}')"
                 onerror="handleImageError(this)">
            <div class="photo-caption">${photo.filename}</div>
            <div class="photo-coordinates">📍 ${photo.latitude.toFixed(4)}, ${photo.longitude.toFixed(4)}</div>
        `;
        
        gallery.appendChild(photoItem);
        
        // Start observing the image for lazy loading
        const img = photoItem.querySelector('.lazy-image');
        if (imageObserver && img) {
            imageObserver.observe(img);
        } else if (img) {
            // Fallback for browsers without Intersection Observer support
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        }
    });
}

// Update photo count display
function updatePhotoCount(count) {
    const photoCount = document.getElementById('photoCount');
    photoCount.textContent = `${count} photos with GPS data`;
}

// Clear map markers and layers
function clearMap() {
    currentMarkers.forEach(marker => {
        map.removeLayer(marker);
    });
    currentMarkers = [];
    
    if (currentAvenzaLayer) {
        map.removeLayer(currentAvenzaLayer);
        currentAvenzaLayer = null;
    }
}

// Clear gallery
function clearGallery() {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = '<div class="no-photos"><p>Select an album to view photos</p></div>';
    updatePhotoCount(0);
}

// Open photo modal
function openModal(imageSrc, caption) {
    const modal = document.getElementById('photoModal');
    const modalImage = document.getElementById('modalImage');
    const modalCaption = document.getElementById('modalCaption');
    
    modalImage.src = imageSrc;
    modalCaption.textContent = caption || '';
    modal.style.display = 'block';
    
    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
}

// Close photo modal
function closeModal() {
    const modal = document.getElementById('photoModal');
    modal.style.display = 'none';
    
    // Restore body scrolling
    document.body.style.overflow = 'auto';
}

// Show loading spinner
function showLoading() {
    const spinner = document.getElementById('loadingSpinner');
    spinner.style.display = 'flex';
}

// Hide loading spinner
function hideLoading() {
    const spinner = document.getElementById('loadingSpinner');
    spinner.style.display = 'none';
}

// Show error message
function showError(message) {
    // Simple error display - could be enhanced with a proper notification system
    alert(message);
}

// Utility function to handle image loading errors
function handleImageError(img) {
    img.style.display = 'none';
    const errorMsg = document.createElement('div');
    errorMsg.textContent = 'Error loading image';
    errorMsg.style.color = '#999';
    errorMsg.style.fontStyle = 'italic';
    img.parentNode.appendChild(errorMsg);
}
