const axios = require('axios');
const cheerio = require('cheerio');

let pastDeadlineCount = 0; // To count consecutive past deadlines

/**
 * Function to scrape a single page of projects for Montenegro.
 */
const scrapeMontenegroProjectsPage = async (url) => {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const projects = [];
    $('div.tool-item-description').each((i, el) => {
      const title = $(el).find('h2.tool-item-name a').text().trim();
      const href = $(el).find('h2.tool-item-name a').attr('href').trim();
      const dates = $(el).find('p.h5').first().text().trim();
      const location = $(el).find('p.microcopy.mrgn-btm-17').text().trim();
      const rawDeadlineText = $(el).find('div.callout-module p.h3').text().trim();

      // Parse and validate deadline
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
        pastDeadlineCount++;
        return;
      }

      // Reset past deadline count for valid projects
      pastDeadlineCount = 0;

      projects.push({
        title,
        dates,
        location,
        deadline: deadlineText,
        url: href.startsWith('http') ? href : `https://www.salto-youth.net${href}`,
      });
    });

    // Find the offset from the current URL and increment it for the next page
    const currentOffsetMatch = url.match(/b_offset=(\d+)/);
    const currentOffset = currentOffsetMatch ? parseInt(currentOffsetMatch[1], 10) : 0;
    const nextPageUrl = url.replace(
      `b_offset=${currentOffset}`,
      `b_offset=${currentOffset + 10}`
    );

    // Check if the "Next page" link exists
    const hasNextPage = $('a.entry.link.next-page').length > 0;

    return { projects, nextPageUrl: hasNextPage ? nextPageUrl : null };
  } catch (error) {
    console.error('Error scraping a page:', error.message);
    return { projects: [], nextPageUrl: null };
  }
};

/**
 * Main function to scrape all pages for Montenegro projects.
 */
const scrapeMontenegroProjects = async () => {
  const baseUrl =
    'https://www.salto-youth.net/tools/european-training-calendar/browse/?b_keyword=&b_funded_by_yia=0&b_country=&b_participating_countries=country-238&b_accessible_for_disabled=0&b_begin_date_after_day=11&b_begin_date_after_month=1&b_begin_date_after_year=2025&b_end_date_before_day=&b_end_date_before_month=&b_end_date_before_year=&b_application_deadline_after_day=11&b_application_deadline_after_month=1&b_application_deadline_after_year=2025&b_application_deadline_before_day=&b_application_deadline_before_month=&b_application_deadline_before_year=&b_browse=Search+training+offers&b_offset=0&b_limit=10&b_order=applicationDeadline';

  let currentPageUrl = baseUrl;
  const allProjects = [];

  while (currentPageUrl) {
    console.log(`Scraping page: ${currentPageUrl}`);
    const { projects, nextPageUrl } = await scrapeMontenegroProjectsPage(currentPageUrl);
    allProjects.push(...projects);
    currentPageUrl = nextPageUrl; // Move to the next page
    if (pastDeadlineCount >= 3) {
      console.log('Stopping scraping after 3 consecutive past deadlines.');
      break;
    }
  }

  return allProjects;
};

/**
 * Main function to execute the scraper and display results.
 */
const scrapeAndPrintMontenegroProjects = async () => {
  const projects = await scrapeMontenegroProjects();

  console.log('----- Scraped Projects for Montenegro -----');
  projects.forEach((project) => {
    console.log(`Title: ${project.title}`);
    console.log(`Dates: ${project.dates}`);
    console.log(`Location: ${project.location}`);
    console.log(`Deadline: ${project.deadline}`);
    console.log(`URL: ${project.url}`);
    console.log('-----------------------------------');
  });
};

module.exports = { scrapeMontenegroProjects };
