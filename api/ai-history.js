export default async function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Manejar preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { place, lat, lng } = req.body;

    if (!place) {
        return res.status(400).json({ error: 'Place name is required' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
        return res.status(500).json({
            error: 'Anthropic API key not configured'
        });
    }

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1024,
                messages: [{
                    role: 'user',
                    content: `Proporciona información histórica interesante y breve sobre este lugar: ${place}. 
          ${lat && lng ? `Coordenadas: ${lat}, ${lng}` : ''}
          
          Responde en español, de forma concisa (máximo 200 palabras), con datos históricos relevantes y curiosidades.
          Formato: Párrafo narrativo sin bullets.`
                }]
            })
        });

        const data = await response.json();

        if (data.content && data.content[0]) {
            res.status(200).json({
                history: data.content[0].text,
                place: place
            });
        } else {
            throw new Error('Invalid response from AI');
        }
    } catch (error) {
        console.error('AI History Error:', error);
        res.status(500).json({
            error: 'Error fetching historical information',
            details: error.message
        });
    }
}
