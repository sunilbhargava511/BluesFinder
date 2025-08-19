import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());
app.use(express.json());

// Serve static files from dist
app.use(express.static(join(__dirname, 'dist')));

// Ticketmaster API proxy endpoint
app.get('/api/ticketmaster', async (req, res) => {
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
    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎵 Blues Finder server running on port ${PORT}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
});