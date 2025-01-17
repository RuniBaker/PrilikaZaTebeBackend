const express = require('express');
const cors = require('cors');
const NodeCache = require('node-cache');

// Import scraper functions
const { scrapeBravoProjects } = require('./scraper');
const { scrapeSaltoProjects } = require('./scraper');
const { scrapeCroatiaProjects } = require('./scrapeCroatia');
const { scrapeSerbiaProjects } = require('./scrapeSerbia');
const { scrapeMontenegroProjects } = require('./scrapeMontenegro');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize cache
const cache = new NodeCache({ stdTTL: 3600 }); // Cache TTL (1 hour)

app.use(cors());

// Helper function to get data with caching
const getCachedData = async (key, scraperFunction) => {
  // Check cache
  const cachedData = cache.get(key);
  if (cachedData) {
    console.log(`Serving ${key} projects from cache`);
    return cachedData;
  }

  // Fetch fresh data
  console.log(`Fetching fresh data for ${key}`);
  const data = await scraperFunction();
  cache.set(key, data); // Store in cache
  return data;
};

/**
 * API endpoint to scrape all projects (Bravo and Salto combined).
 */
app.get('/api/projects', async (req, res) => {
  try {
    console.log('Received request to /api/projects');
    const bravoProjects = await getCachedData('bravo', scrapeBravoProjects);
    const bosnianProjects = await getCachedData('bosnia', scrapeSaltoProjects);
    const croatianProjects = await getCachedData('croatia', scrapeCroatiaProjects);
    const montenegroProjects = await getCachedData('montenegro', scrapeMontenegroProjects);
    const serbianProjects = await getCachedData('serbia', scrapeSerbiaProjects);
    const allProjects = [
      ...bravoProjects,
      ...bosnianProjects,
      ...croatianProjects,
      ...montenegroProjects,
      ...serbianProjects,
    ];
    res.json(allProjects);
  } catch (error) {
    console.error('Error in /api/projects:', error.message);
    res.status(500).json({ error: 'Failed to scrape projects' });
  }
});

/**
 * Individual API endpoints for each country.
 */
app.get('/api/projects/bravo', async (req, res) => {
  try {
    const projects = await getCachedData('bravo', scrapeBravoProjects);
    res.json(projects);
  } catch (error) {
    console.error('Error in /api/projects/bravo:', error.message);
    res.status(500).json({ error: 'Failed to scrape Bravo projects' });
  }
});

app.get('/api/projects/bosnia', async (req, res) => {
  try {
    const projects = await getCachedData('bosnia', scrapeSaltoProjects);
    res.json(projects);
  } catch (error) {
    console.error('Error in /api/projects/bosnia:', error.message);
    res.status(500).json({ error: 'Failed to scrape Bosnia projects' });
  }
});

app.get('/api/projects/croatia', async (req, res) => {
  try {
    const projects = await getCachedData('croatia', scrapeCroatiaProjects);
    res.json(projects);
  } catch (error) {
    console.error('Error in /api/projects/croatia:', error.message);
    res.status(500).json({ error: 'Failed to scrape Croatia projects' });
  }
});

app.get('/api/projects/montenegro', async (req, res) => {
  try {
    const projects = await getCachedData('montenegro', scrapeMontenegroProjects);
    res.json(projects);
  } catch (error) {
    console.error('Error in /api/projects/montenegro:', error.message);
    res.status(500).json({ error: 'Failed to scrape Montenegro projects' });
  }
});

app.get('/api/projects/serbia', async (req, res) => {
  try {
    const projects = await getCachedData('serbia', scrapeSerbiaProjects);
    res.json(projects);
  } catch (error) {
    console.error('Error in /api/projects/serbia:', error.message);
    res.status(500).json({ error: 'Failed to scrape Serbia projects' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
