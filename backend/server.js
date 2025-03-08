const express = require('express');
const cors = require('cors');
const NodeCache = require('node-cache');

// Import scraper functions from your existing scraper.js file
const { 
  scrapeBravoProjects, 
  scrapeBravoBiHProjects,
  scrapeSaltoProjects 
} = require('./scraper');

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
  try {
    const data = await scraperFunction();
    cache.set(key, data); // Store in cache
    return data;
  } catch (error) {
    console.error(`Error fetching data for ${key}:`, error.message);
    return []; // Return empty array on error to prevent cascading failures
  }
};

/**
 * API endpoint to scrape all projects (Bravo and Salto combined).
 */
app.get('/api/projects', async (req, res) => {
  try {
    console.log('Received request to /api/projects');
    
    // Fetch all project types in parallel
    const [bravoBiHProjects, bosnianProjects, croatianProjects, montenegroProjects, serbianProjects] = 
      await Promise.all([
        getCachedData('bravo', scrapeBravoBiHProjects),
        getCachedData('bosnia', scrapeSaltoProjects),
        getCachedData('croatia', scrapeCroatiaProjects),
        getCachedData('montenegro', scrapeMontenegroProjects),
        getCachedData('serbia', scrapeSerbiaProjects)
      ]);
      
    const allProjects = [
      ...bravoBiHProjects,
      ...bosnianProjects,
      ...croatianProjects,
      ...montenegroProjects,
      ...serbianProjects,
    ];
    
    console.log(`Returning ${allProjects.length} total projects`);
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
    // Use the BRAVO BiH scraper function
    const projects = await getCachedData('bravo', scrapeBravoBiHProjects);
    res.json(projects);
  } catch (error) {
    console.error('Error in /api/projects/bravo:', error.message);
    res.status(500).json({ error: 'Failed to scrape Bravo BiH projects' });
  }
});

app.get('/api/projects/bosnia', async (req, res) => {
  try {
    // Get both SALTO Bosnia projects AND BRAVO BiH projects
    const [saltoProjects, bravoBiHProjects] = await Promise.all([
      getCachedData('bosnia', scrapeSaltoProjects),
      getCachedData('bravo', scrapeBravoBiHProjects)
    ]);
    
    // Combine both types of projects
    const allBosnianProjects = [...saltoProjects, ...bravoBiHProjects];
    console.log(`Returning ${allBosnianProjects.length} combined Bosnian projects (${saltoProjects.length} SALTO + ${bravoBiHProjects.length} BRAVO BiH)`);
    
    res.json(allBosnianProjects);
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

// Clear cache endpoint (useful for development and testing)
app.get('/api/clear-cache', (req, res) => {
  cache.flushAll();
  console.log('Cache cleared');
  res.json({ message: 'Cache cleared successfully' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});