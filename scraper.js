const axios = require('axios');
const cheerio = require('cheerio');

let pastDeadlineCount = 0; // To count consecutive past deadlines

/**
 * Function to scrape Bravo projects.
 */
const scrapeBravoProjects = async () => {
  const baseUrl = 'https://bravo-bih.com';
  const mainPageUrl = `${baseUrl}/bravo-projects/key-action-1/`;

  try {
    const { data } = await axios.get(mainPageUrl);
    const $ = cheerio.load(data);

    const projectLinks = [];

    // Extract all project links
    $('a.elementor-icon').each((i, el) => {
      const href = $(el).attr('href');
      const title = $(el).find('span').text().trim();

      if (href && (title.includes('Youth Exchange') || title.includes('Training Course'))) {
        projectLinks.push(href.startsWith('http') ? href : `${baseUrl}${href}`);
      }
    });

    const detailedProjects = [];
    for (const projectUrl of projectLinks) {
      if (pastDeadlineCount >= 3) {
        console.log('Stopping scraping after 3 consecutive past deadlines.');
        break;
      }

      const details = await scrapeBravoDetails(projectUrl);
      if (details) {
        detailedProjects.push(details);
      }
    }

    return detailedProjects;
  } catch (error) {
    console.error('Error scraping Bravo projects:', error.message);
    return [];
  }
};

/**
 * Function to scrape Bravo project details.
 */
const scrapeBravoDetails = async (projectUrl) => {
  try {
    const { data } = await axios.get(projectUrl);
    const $ = cheerio.load(data);

    const container = $('div.elementor-widget-container');
    if (!container.length) {
      console.warn(`No container found for URL: ${projectUrl}`);
      return null;
    }

    const title = container.find('li:contains("Name of the project:") strong').text().trim();
    const dates = container.find('li:contains("Dates of Project:") strong').text().trim();
    const location = container.find('li:contains("Places:") strong').text().trim();
    const rawDeadlineText = container.find('li:contains("Deadline for applying:") strong').text().trim();
    const deadlineMatch = rawDeadlineText.match(/\d{2}\.\d{2}\.\d{4}/);
    const deadlineText = deadlineMatch ? deadlineMatch[0] : null;

    if (!deadlineText) {
      console.warn(`Skipping project without a valid deadline. URL: ${projectUrl}`);
      return null;
    }

    const deadline = new Date(deadlineText.split('.').reverse().join('-'));
    const today = new Date();

    if (deadline < today) {
      console.log(`Skipping project "${title}" due to expired deadline (${deadlineText}).`);
      pastDeadlineCount++;
      return null;
    }

    pastDeadlineCount = 0;

    return { title, dates, location, deadline: deadlineText, url: projectUrl };
  } catch (error) {
    console.error(`Error scraping Bravo project (${projectUrl}):`, error.message);
    return null;
  }
};

/**
 * Function to scrape Salto projects with pagination support.
 */
const scrapeSaltoProjects = async () => {
  const baseUrl =
    'https://www.salto-youth.net/tools/european-training-calendar/browse/?b_keyword=&b_funded_by_yia=0&b_country=&b_participating_countries=country-53&b_accessible_for_disabled=0&b_begin_date_after_day=11&b_begin_date_after_month=1&b_begin_date_after_year=2025&b_end_date_before_day=&b_end_date_before_month=&b_end_date_before_year=&b_application_deadline_after_day=11&b_application_deadline_after_month=1&b_application_deadline_after_year=2025&b_application_deadline_before_day=&b_application_deadline_before_month=&b_application_deadline_before_year=&b_browse=Search+training+offers&b_offset=0&b_limit=10&b_order=applicationDeadline';

  let currentPageUrl = baseUrl; // Start from the first page
  const allProjects = [];

  try {
    while (currentPageUrl) {
      console.log(`Scraping page: ${currentPageUrl}`);

      const { data } = await axios.get(currentPageUrl);
      const $ = cheerio.load(data);

      // Scrape projects on the current page
      $('div.tool-item-description').each((i, el) => {
        const title = $(el).find('h2.tool-item-name a').text().trim();
        const href = $(el).find('h2.tool-item-name a').attr('href').trim();
        const dates = $(el).find('p.h5').first().text().trim();
        const location = $(el).find('p.microcopy.mrgn-btm-17').text().trim();
        const rawDeadlineText = $(el).find('div.callout-module p.h3').text().trim();

        // Parse and validate the deadline
        const deadlineMatch = rawDeadlineText.match(/\d{1,2} \w+ \d{4}/); // Match "DD Month YYYY"
        const deadlineText = deadlineMatch ? deadlineMatch[0] : null;

        if (!deadlineText) {
          console.warn(`Skipping project without a valid deadline.`);
          return;
        }

        const deadline = new Date(deadlineText);
        const today = new Date();

        if (deadline < today) {
          console.log(`Skipping project "${title}" due to expired deadline (${deadlineText}).`);
          return;
        }

        allProjects.push({
          title,
          dates,
          location,
          deadline: deadlineText,
          url: href.startsWith('http') ? href : `https://www.salto-youth.net${href}`,
        });
      });

      // Find and construct the next page URL dynamically
      const currentOffsetMatch = currentPageUrl.match(/b_offset=(\d+)/);
      const currentOffset = currentOffsetMatch ? parseInt(currentOffsetMatch[1], 10) : 0;
      const nextPageUrl = currentPageUrl.replace(
        `b_offset=${currentOffset}`,
        `b_offset=${currentOffset + 10}`
      );

      // Check if a "Next page" exists
      const hasNextPage = $('a.entry.link.next-page').length > 0;

      // If there's no next page, stop scraping
      currentPageUrl = hasNextPage ? nextPageUrl : null;
    }
  } catch (error) {
    console.error('Error scraping Salto projects:', error.message);
  }

  return allProjects;
};

const scrapeAllProjects = async () => {
  console.log("Starting to scrape all projects...");

  const bravoProjects = await scrapeBravoProjects(); // Call Bravo scraper
  const saltoProjects = await scrapeSaltoProjects(); // Call updated Bosnian scraper

  const allProjects = [...bravoProjects, ...saltoProjects];

  console.log('----- Scraped All Projects -----');
  allProjects.forEach((project) => {
    console.log(`Title: ${project.title}`);
    console.log(`Dates: ${project.dates}`);
    console.log(`Location: ${project.location}`);
    console.log(`Deadline: ${project.deadline}`);
    console.log(`URL: ${project.url}`);
    console.log('-----------------------------------');
  });

  return allProjects;
};

// Export all functions
module.exports = {
  scrapeBravoProjects,
  scrapeSaltoProjects,
  scrapeAllProjects, // Export this function
};

scrapeAllProjects();
