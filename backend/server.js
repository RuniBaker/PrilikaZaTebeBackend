const express = require('express');
const { scrapeBravoProjects } = require('./scraper'); // Bravo scraper
const { scrapeSaltoProjects } = require('./scraper'); // Bosnian scraper
const { scrapeCroatiaProjects } = require('./scrapeCroatia'); // Croatian scraper
const { scrapeSerbiaProjects } = require('./scrapeSerbia'); // Serbian scraper
const { scrapeMontenegroProjects } = require('./scrapeMontenegro'); // Montenegro scraper


const app = express();
const PORT = process.env.PORT || 3001;
const cors = require('cors');
app.use(cors());


/**
 * API endpoint to scrape all projects (Bravo and Salto combined).
 */
app.get('/api/projects', async (req, res) => {
  try {
    console.log("Received request to /api/projects");
    const bravoProjects = await scrapeBravoProjects();
    const bosnianProjects = await scrapeSaltoProjects();
    const croatianProjects = await scrapeCroatiaProjects();
    const montenegroProjects = await scrapeMontenegroProjects();
    const serbianProjects = await scrapeSerbiaProjects();
    const allProjects = [...bravoProjects, ...bosnianProjects, ...croatianProjects, ...montenegroProjects, ...serbianProjects];
    console.log("Scraped all projects:", allProjects);
    res.json(allProjects);
  } catch (error) {
    console.error("Error in /api/projects:", error.message);
    res.status(500).json({ error: "Failed to scrape projects" });
  }
});

/**
 * API endpoint to scrape Bravo projects.
 */
app.get('/api/projects/bravo', async (req, res) => {
  try {
    console.log("Received request to /api/projects/bravo");
    const projects = await scrapeBravoProjects();
    console.log("Scraped Bravo projects:", projects);
    res.json(projects);
  } catch (error) {
    console.error("Error in /api/projects/bravo:", error.message);
    res.status(500).json({ error: "Failed to scrape Bravo projects" });
  }
});

/**
 * API endpoint to scrape Bosnian Salto projects.
 */
app.get('/api/projects/bosnia', async (req, res) => {
  try {
    console.log("Received request to /api/projects/bosnia");
    const projects = await scrapeSaltoProjects();
    console.log("Scraped Bosnian projects:", projects);
    res.json(projects);
  } catch (error) {
    console.error("Error in /api/projects/bosnia:", error.message);
    res.status(500).json({ error: "Failed to scrape Bosnian projects" });
  }
});

/**
 * API endpoint to scrape Croatian Salto projects.
 */
app.get('/api/projects/croatia', async (req, res) => {
  try {
    console.log("Received request to /api/projects/croatia");
    const projects = await scrapeCroatiaProjects();
    console.log("Scraped Croatian projects:", projects);
    res.json(projects);
  } catch (error) {
    console.error("Error in /api/projects/croatia:", error.message);
    res.status(500).json({ error: "Failed to scrape Croatian projects" });
  }
});

/**
 * API endpoint to scrape Montenegro Salto projects.
 */
app.get('/api/projects/montenegro', async (req, res) => {
  try {
    console.log("Received request to /api/projects/montenegro");
    const projects = await scrapeMontenegroProjects();
    console.log("Scraped Montenegro projects:", projects);
    res.json(projects);
  } catch (error) {
    console.error("Error in /api/projects/montenegro:", error.message);
    res.status(500).json({ error: "Failed to scrape Montenegro projects" });
  }
});

app.get('/api/projects/serbia', async (req, res) => {
  try {
    console.log("Received request to /api/projects/serbia");
    const projects = await scrapeSerbiaProjects();
    console.log("Scraped Serbian projects:", projects);
    res.json(projects);
  } catch (error) {
    console.error("Error in /api/projects/serbia:", error.message);
    res.status(500).json({ error: "Failed to scrape Serbia projects" });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
