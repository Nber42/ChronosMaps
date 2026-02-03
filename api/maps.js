export default async function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Manejar preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { action, lat, lng, place, placeId } = req.query;

    if (!process.env.GOOGLE_MAPS_KEY) {
        return res.status(500).json({
            error: 'Google Maps API key not configured'
        });
    }

    try {
        let url;

        // Diferentes endpoints según la acción
        switch (action) {
            case 'geocode':
                url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.GOOGLE_MAPS_KEY}`;
                break;
            case 'place-details':
                url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,photos,rating,types&key=${process.env.GOOGLE_MAPS_KEY}`;
                break;
            case 'nearby':
                url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=tourist_attraction&key=${process.env.GOOGLE_MAPS_KEY}`;
                break;
            default:
                return res.status(400).json({ error: 'Invalid action' });
        }

        const response = await fetch(url);
        const data = await response.json();

        res.status(200).json(data);
    } catch (error) {
        console.error('Maps API Error:', error);
        res.status(500).json({
            error: 'Error fetching map data',
            details: error.message
        });
    }
}
