const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const Tesseract = require("tesseract.js");
require("dotenv").config();
const multer = require("multer");
const querystring = require('querystring');

const app = express();
const PORT = 5000;


// Middleware setup for CORS
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(bodyParser.json());

// Set up Multer for file upload handling
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

app.get('/spotify-token', async (req, res) => {
  try {
    console.log('Fetching Spotify token...');
    const tokenResponse = await axios.post(
      'https://accounts.spotify.com/api/token',
      querystring.stringify({ grant_type: 'client_credentials' }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(
            `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
          ).toString('base64')}`,
        },
      }
    );
    console.log('Token Response:', tokenResponse.data);
    res.json({ access_token: tokenResponse.data.access_token });
  } catch (error) {
    console.error('Error fetching Spotify token:', error.message);
    res.status(500).json({ error: 'Failed to fetch Spotify token' });
  }
});

app.get('/recommend/:mood', async (req, res) => {
    const { mood } = req.params;
    const tokenResponse = await axios.get('http://localhost:5000/spotify-token');
    const token = tokenResponse.data.access_token;
  
    try {
      const response = await axios.get(
        `https://api.spotify.com/v1/recommendations?seed_genres=${mood}&limit=1`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const track = response.data.tracks[0];
      res.json({
        name: track.name,
        artist: track.artists[0].name,
        url: track.external_urls.spotify,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });  

// OCR Endpoint
app.post("/ocr", upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Image file is required." });
  }

  // Use the uploaded image buffer instead of an URL
  Tesseract.recognize(req.file.buffer, "eng", { logger: (m) => console.log(m) })
    .then(({ data: { text } }) => res.json({ text }))
    .catch((error) =>
      res.status(500).json({ error: `OCR failed: ${error.message}` })
    );
});

// Sentiment Analysis Endpoint
app.post('/analyze', async (req, res) => {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required for sentiment analysis.' });
    }
    try {
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english',
        { inputs: text },
        {
          headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` },
        }
      );
      res.json(response.data);
    } catch (error) {
      console.error('Sentiment Analysis Error:', error.message);
      console.error('Response data:', error.response?.data); // Log the error response data
      res.status(500).json({
        error: error.response ? error.response.data : error.message,
      });
    }
  });
  

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
