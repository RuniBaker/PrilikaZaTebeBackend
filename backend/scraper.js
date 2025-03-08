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
 * Function to scrape BRAVO BiH Key Action 1 projects
 * Based on the exact HTML structure provided
 */
const scrapeBravoBiHProjects = async () => {
  // Only scrape Key Action 1 projects as requested
  const bravoBiHUrl = "https://bravo-bih.com/bravo-projects/key-action-1/";

  const allProjects = [];
  const today = new Date();
  let pastDeadlineCount = 0; // To count consecutive past deadlines

  try {
    console.log(`Scraping BRAVO BiH Key Action 1 page: ${bravoBiHUrl}`);
    
    // Get the main page that contains links to individual projects
    const { data } = await axios.get(bravoBiHUrl);
    const $ = cheerio.load(data);
    
    // Find all project links
    const projectLinks = [];
    
    // Look for all links
    $("a").each((i, el) => {
      const href = $(el).attr("href");
      const linkText = $(el).text().trim();
      
      if (href && 
          href.includes("bravo-bih.com") && 
          (href.includes("open-call") || 
           href.includes("exchange") || 
           href.includes("youth") || 
           href.includes("mobility") ||
           href.includes("training"))) {
        
        // Check if this link is already in our list
        const exists = projectLinks.some(link => link.url === href);
        if (!exists) {
          projectLinks.push({
            url: href,
            title: linkText
          });
        }
      }
    });
    
    console.log(`Found ${projectLinks.length} BRAVO BiH Key Action 1 project links`);
    
    // Visit each project page to extract details
    for (const project of projectLinks) {
      try {
        console.log(`Scraping BRAVO BiH project: ${project.url}`);
        
        const { data: projectData } = await axios.get(project.url);
        const project$ = cheerio.load(projectData);
        
        // Extract project information exactly matching the HTML structure provided
        let projectName = "";
        let location = "";
        let deadline = "";
        let dates = "";
        
        // Process each list item
        project$("ul li").each((i, el) => {
          const text = project$(el).text().trim();
          
          if (text.includes("Name of the project:")) {
            projectName = project$(el).find("strong").text().trim();
          }
          else if (text.includes("Places:")) {
            location = project$(el).find("b").text().trim();
            if (!location) location = project$(el).find("strong").text().trim();
          }
          else if (text.includes("Deadline for applying:")) {
            deadline = project$(el).find("strong").text().trim();
          }
          else if (text.includes("Dates of Project:") || text.includes("Date of project:") || text.includes("Dates of the project:")) {
            dates = project$(el).find("strong, b").text().trim();
          }
        });
        
        // If we still don't have a name, try to extract it from the page title
        if (!projectName) {
          projectName = project$("h1, h2").first().text().trim();
        }
        
        // If we still don't have dates, look for date-like patterns in the content
        if (!dates) {
          const pageText = project$("body").text();
          const dateRangeRegex = /(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})\s*[–-]\s*(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/;
          const dateRangeMatch = pageText.match(dateRangeRegex);
          if (dateRangeMatch) {
            dates = dateRangeMatch[0];
          }
        }
        
        // Skip projects missing required fields
        if (!projectName || !location || !deadline || !dates) {
          console.log(`Skipping incomplete BRAVO BiH project: "${projectName || project.title}"`);
          console.log(`Missing fields: ${!projectName ? 'name ' : ''}${!location ? 'location ' : ''}${!deadline ? 'deadline ' : ''}${!dates ? 'dates' : ''}`);
          continue;
        }
        
        // Parse the deadline for past deadline check
        let deadlinePassed = false;
        if (deadline) {
          // "Rolling basis" deadlines are always valid
          if (deadline.toLowerCase().includes("rolling")) {
            deadlinePassed = false;
          } else {
            // Try to extract dates from various formats
            const dateRegex = /(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/g;
            const dateMatches = deadline.match(dateRegex);
            
            if (dateMatches && dateMatches.length > 0) {
              // Convert to standardized format for Date constructor
              const parts = dateMatches[0].split(/[./-]/);
              if (parts.length === 3) {
                let year = parts[2];
                if (year.length === 2) year = "20" + year; // Convert "23" to "2023"
                
                // European date format: day.month.year
                const deadlineDate = new Date(`${year}-${parts[1]}-${parts[0]}`);
                if (!isNaN(deadlineDate.getTime())) {
                  deadlinePassed = deadlineDate < today;
                  
                  if (deadlinePassed) {
                    console.log(`BRAVO BiH project "${projectName}" has passed deadline: ${deadline}`);
                    pastDeadlineCount++;
                    
                    if (pastDeadlineCount >= 3) {
                      console.log("Stopping BRAVO BiH scraping after 3 consecutive past deadlines");
                      return allProjects; // Exit scraping
                    }
                    
                    // Skip this project and continue with the next one
                    continue;
                  }
                }
              }
            }
          }
        }
        
        // Reset counter if this project's deadline hasn't passed
        if (!deadlinePassed) {
          pastDeadlineCount = 0;
        }
        
        // Add the project to our list
        allProjects.push({
          title: projectName,
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
  } catch (error) {
    console.error("Error scraping BRAVO BiH projects:", error.message);
  }

  return allProjects;
};

/**
 * Alias for backward compatibility
 */
const scrapeBravoProjects = scrapeBravoBiHProjects;

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
    
    // Combine the results with BRAVO BiH projects first, followed by SALTO
    const allProjects = [...bravoBiHProjects, ...saltoProjects];
    
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
  scrapeBravoProjects, // For backward compatibility
  scrapeAllProjects
};