export default async function handler(req, res) {
  // Enable CORS for all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Decode the URL
    const ticketmasterUrl = decodeURIComponent(url);
    
    // Verify it's a Ticketmaster API URL for security
    if (!ticketmasterUrl.startsWith('https://app.ticketmaster.com/discovery/v2/')) {
      return res.status(400).json({ error: 'Invalid API URL' });
    }

    console.log('Proxying request to:', ticketmasterUrl);

    const response = await fetch(ticketmasterUrl);
    
    if (!response.ok) {
      console.error('Ticketmaster API error:', response.status, response.statusText);
      return res.status(response.status).json({ 
        error: `Ticketmaster API error: ${response.status} ${response.statusText}` 
      });
    }

    const data = await response.json();
    
    // Return the data with CORS headers
    res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}