const axios = require("axios");
const cheerio = require("cheerio");

/**
 * Function to scrape Salto projects dynamically using the current date.
 */
const scrapeSaltoProjects = async () => {
  // Get today's date
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1; // JavaScript months are 0-based
  const year = today.getFullYear();

  // Construct the base URL dynamically with the current date
  const baseUrl = `https://www.salto-youth.net/tools/european-training-calendar/browse/?b_keyword=&b_funded_by_yia=0&b_country=&b_participating_countries=country-53&b_accessible_for_disabled=0&b_begin_date_after_day=${day}&b_begin_date_after_month=${month}&b_begin_date_after_year=${year}&b_end_date_before_day=&b_end_date_before_month=&b_end_date_before_year=&b_application_deadline_after_day=${day}&b_application_deadline_after_month=${month}&b_application_deadline_after_year=${year}&b_application_deadline_before_day=&b_application_deadline_before_month=&b_application_deadline_before_year=&b_browse=Search+training+offers&b_offset=0&b_limit=10&b_order=applicationDeadline`;

  let currentPageUrl = baseUrl; // Start from the first page
  const allProjects = [];
  let pastDeadlineCount = 0; // To count consecutive past deadlines

  try {
    while (currentPageUrl) {
      console.log(`Scraping SALTO page: ${currentPageUrl}`);

      const { data } = await axios.get(currentPageUrl);
      const $ = cheerio.load(data);

      // Scrape projects on the current page
      $("div.tool-item-description").each((i, el) => {
        const title = $(el).find("h2.tool-item-name a").text().trim();
        const href = $(el).find("h2.tool-item-name a").attr("href")?.trim() || "";
        const dates = $(el).find("p.h5").first().text().trim();
        const location = $(el)
          .find("p.microcopy.mrgn-btm-17")
          .text()
          .trim();
        const rawDeadlineText = $(el)
          .find("div.callout-module p.h3")
          .text()
          .trim();

        // Parse and validate the deadline
        const deadlineMatch = rawDeadlineText.match(/\d{1,2} \w+ \d{4}/); // Match "DD Month YYYY"
        const deadlineText = deadlineMatch ? deadlineMatch[0] : null;

        if (!deadlineText) {
          console.warn(`Skipping SALTO project without a valid deadline.`);
          return;
        }

        const deadline = new Date(deadlineText);

        if (deadline < today) {
          console.log(
            `Skipping SALTO project "${title}" due to expired deadline (${deadlineText}).`
          );
          pastDeadlineCount++;
          if (pastDeadlineCount >= 3) {
            console.log(
              "Stopping SALTO scraping after 3 consecutive past deadlines."
            );
            return false; // Exit scraping
          }
          return;
        }

        pastDeadlineCount = 0; // Reset past deadline count for valid projects

        allProjects.push({
          title,
          dates,
          location,
          deadline: deadlineText,
          url: href.startsWith("http")
            ? href
            : `https://www.salto-youth.net${href}`,
          source: "SALTO Youth"
        });
      });

      // Find and construct the next page URL dynamically
      const currentOffsetMatch = currentPageUrl.match(/b_offset=(\d+)/);
      const currentOffset = currentOffsetMatch
        ? parseInt(currentOffsetMatch[1], 10)
        : 0;
      const nextPageUrl = currentPageUrl.replace(
        `b_offset=${currentOffset}`,
        `b_offset=${currentOffset + 10}`
      );

      // Check if a "Next page" exists
      const hasNextPage = $("a.entry.link.next-page").length > 0;

      // If there's no next page, stop scraping
      currentPageUrl = hasNextPage ? nextPageUrl : null;
    }
  } catch (error) {
    console.error("Error scraping Salto projects:", error.message);
  }

  return allProjects;
};

/**
 * Function to scrape BRAVO BiH projects from both URLs
 */
const scrapeBravoBiHProjects = async () => {
  const bravoBiHUrls = [
    "https://bravo-bih.com/bravo-projects/european-solidarity-corps/",
    "https://bravo-bih.com/bravo-projects/key-action-1/"
  ];

  const allProjects = [];

  try {
    for (const baseUrl of bravoBiHUrls) {
      console.log(`Scraping BRAVO BiH page: ${baseUrl}`);
      
      // Get the main page that contains links to individual projects
      const { data } = await axios.get(baseUrl);
      const $ = cheerio.load(data);
      
      // Find all project links
      const projectLinks = [];
      
      // Look for links with the expected format
      $("a.elementor-icon").each((i, el) => {
        const href = $(el).attr("href");
        const title = $(el).find("span").text().trim() || $(el).text().trim();
        
        if (href && href.includes("bravo-bih.com")) {
          projectLinks.push({
            url: href,
            title: title
          });
        }
      });
      
      // Also check for other potential link formats
      $("a").each((i, el) => {
        const href = $(el).attr("href");
        const title = $(el).text().trim();
        
        // Only include links to the same domain and that contain "open-call" or similar keywords
        if (href && 
            href.includes("bravo-bih.com") && 
            (href.includes("open-call") || href.includes("erasmus") || href.includes("call-for"))) {
          
          // Check if this link is already in our list
          const exists = projectLinks.some(link => link.url === href);
          if (!exists) {
            projectLinks.push({
              url: href,
              title: title
            });
          }
        }
      });
      
      console.log(`Found ${projectLinks.length} BRAVO BiH project links on ${baseUrl}`);
      
      // Visit each project page to extract details
      for (const project of projectLinks) {
        try {
          console.log(`Scraping BRAVO BiH project: ${project.url}`);
          
          const { data: projectData } = await axios.get(project.url);
          const project$ = cheerio.load(projectData);
          
          // Extract project information based on the provided HTML structure
          let programName = "";
          let location = "";
          let deadline = "";
          let dates = "";
          
          // Look for list items with labeled information
          project$("ul li").each((i, el) => {
            const text = project$(el).text().trim();
            
            if (text.includes("Name of the program:")) {
              programName = project$(el).find("strong").text().trim();
            }
            else if (text.includes("Places:")) {
              location = project$(el).find("b, strong").text().trim();
            }
            else if (text.includes("Deadline for applying:")) {
              deadline = project$(el).find("strong").text().trim();
            }
            else if (text.includes("Date:") || text.includes("Duration:") || text.includes("Period:")) {
              dates = project$(el).find("strong, b").text().trim();
            }
          });
          
          // If program name wasn't found, use the title from the link
          if (!programName) {
            programName = project.title;
          }
          
          // Add the extracted project to our list
          allProjects.push({
            title: programName,
            dates: dates,
            location: location,
            deadline: deadline,
            url: project.url,
            source: "BRAVO BiH"
          });
          
        } catch (error) {
          console.error(`Error scraping BRAVO BiH project ${project.url}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.error("Error scraping BRAVO BiH projects:", error.message);
  }

  return allProjects;
};

/**
 * Function to scrape all projects from both sources
 */
const scrapeAllProjects = async () => {
  try {
    console.log("Starting to scrape all projects...");
    
    // Run both scrapers in parallel
    const [saltoProjects, bravoBiHProjects] = await Promise.all([
      scrapeSaltoProjects(),
      scrapeBravoBiHProjects()
    ]);
    
    console.log(`Found ${saltoProjects.length} SALTO projects and ${bravoBiHProjects.length} BRAVO BiH projects`);
    
    // Combine the results
    const allProjects = [...saltoProjects, ...bravoBiHProjects];
    
    return allProjects;
  } catch (error) {
    console.error("Error scraping all projects:", error.message);
    return [];
  }
};

// Export the functions
module.exports = {
  scrapeSaltoProjects,
  scrapeBravoBiHProjects,
  scrapeAllProjects
};