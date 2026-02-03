/**
 * NEAR YOU AUTO-SCAN SYSTEM
 * Implements periodic scanning for nearby historical POIs
 */

const NearYouScanner = {
    isActive: false,
    scanInterval: null,
    lastScanPosition: null,
    SCAN_RADIUS_KM: 2, // 2km radius
    SCAN_INTERVAL_MS: 30000, // 30 seconds
    MIN_DISTANCE_TO_RESCAN_M: 100, // Rescan if user moved 100m

    init() {
        console.log("🔍 NearYouScanner: Initializing...");
        // Request location permission on load
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    window.userPosition = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    this.performInitialScan(window.userPosition);
                    this.startPeriodicScan();
                },
                (error) => {
                    console.warn("NearYouScanner: Location permission denied", error);
                }
            );
        }
    },

    performInitialScan(position) {
        console.log("🔍 NearYouScanner: Performing initial scan...", position);
        this.lastScanPosition = position;
        this.scanNearbyPOIs(position);
    },

    startPeriodicScan() {
        if (this.isActive) return; // Already running
        this.isActive = true;

        this.scanInterval = setInterval(() => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const newPos = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        };

                        // Check if user moved enough to warrant a rescan
                        if (this.shouldRescan(newPos)) {
                            console.log("🔍 NearYouScanner: User moved, rescanning...");
                            this.lastScanPosition = newPos;
                            this.scanNearbyPOIs(newPos);
                        }
                    },
                    (error) => {
                        console.warn("NearYouScanner: Could not get location for periodic scan", error);
                    }
                );
            }
        }, this.SCAN_INTERVAL_MS);

        console.log("🔍 NearYouScanner: Periodic scanning started");
    },

    stopPeriodicScan() {
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
            this.isActive = false;
            console.log("🔍 NearYouScanner: Periodic scanning stopped");
        }
    },

    shouldRescan(newPosition) {
        if (!this.lastScanPosition) return true;

        const distance = this.calculateDistance(
            this.lastScanPosition.lat,
            this.lastScanPosition.lng,
            newPosition.lat,
            newPosition.lng
        );

        return distance >= this.MIN_DISTANCE_TO_RESCAN_M;
    },

    async scanNearbyPOIs(position) {
        try {
            // Use Google Places Nearby Search
            if (!window.chronosMap) {
                console.warn("NearYouScanner: chronosMap not ready yet");
                return;
            }

            const service = new google.maps.places.PlacesService(window.chronosMap);
            const request = {
                location: new google.maps.LatLng(position.lat, position.lng),
                radius: this.SCAN_RADIUS_KM * 1000, // Convert to meters
                type: ['tourist_attraction', 'museum', 'church', 'point_of_interest']
            };

            service.nearbySearch(request, (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                    console.log(`🔍 Found ${results.length} nearby POIs`);
                    this.showNearbyNotification(results.length);

                    // Optionally: Store results for "Nearby" view
                    window.nearbyPOIs = results;
                } else {
                    console.warn("NearYouScanner: Places search failed", status);
                }
            });
        } catch (error) {
            console.error("NearYouScanner: Error during scan", error);
        }
    },

    showNearbyNotification(count) {
        if (count === 0) return;

        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'nearby-toast';
        toast.innerHTML = `
            <div class="toast-content">
                <span class="material-icons">explore</span>
                <div>
                    <div class="toast-title">${count} lugares históricos cerca</div>
                    <div class="toast-subtitle">Explora tu alrededor</div>
                </div>
            </div>
        `;
        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => toast.classList.add('show'), 100);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    calculateDistance(lat1, lon1, lat2, lon2) {
        // Haversine formula to calculate distance between two points
        const R = 6371e3; // Earth radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    }
};

// Auto-initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    // Wait for map to be ready
    const checkMapReady = setInterval(() => {
        if (window.chronosMap) {
            clearInterval(checkMapReady);
            NearYouScanner.init();
        }
    }, 500);
});

// Export for global access
window.NearYouScanner = NearYouScanner;
