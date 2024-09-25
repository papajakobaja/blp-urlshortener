require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const dns = require('dns');
const url = require('url');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});
// In-memory database to store URLs and their corresponding short URLs
const urlDatabase = {};
let urlCounter = 1;

// Helper function to validate the URL using DNS lookup
function isValidUrl(userUrl, callback) {
  try {
    const parsedUrl = new URL(userUrl);
    // DNS lookup to validate the hostname
    dns.lookup(parsedUrl.hostname, (err) => {
      callback(!err); // valid if no error
    });
  } catch {
    callback(false);
  }
}

// POST route to create a shortened URL
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  // Validate URL
  isValidUrl(originalUrl, (isValid) => {
    if (!isValid) {
      return res.json({ error: 'invalid url' });
    }

    // Check if URL already exists in the database
    let shortUrl = Object.keys(urlDatabase).find((key) => urlDatabase[key] === originalUrl);
    if (!shortUrl) {
      shortUrl = urlCounter++;
      urlDatabase[shortUrl] = originalUrl;
    }

    res.json({
      original_url: originalUrl,
      short_url: shortUrl,
    });
  });
});

// GET route to redirect to the original URL
app.get('/api/shorturl/:shortUrl', (req, res) => {
  const { shortUrl } = req.params;
  const originalUrl = urlDatabase[shortUrl];

  if (originalUrl) {
    res.redirect(originalUrl);
  } else {
    res.json({ error: 'No short URL found for the given input' });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
