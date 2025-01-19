const axios = require("axios");
const cheerio = require("cheerio");

let pastDeadlineCount = 0; // To count consecutive past deadlines

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

  try {
    while (currentPageUrl) {
      console.log(`Scraping page: ${currentPageUrl}`);

      const { data } = await axios.get(currentPageUrl);
      const $ = cheerio.load(data);

      // Scrape projects on the current page
      $("div.tool-item-description").each((i, el) => {
        const title = $(el).find("h2.tool-item-name a").text().trim();
        const href = $(el).find("h2.tool-item-name a").attr("href").trim();
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
          console.warn(`Skipping project without a valid deadline.`);
          return;
        }

        const deadline = new Date(deadlineText);

        if (deadline < today) {
          console.log(
            `Skipping project "${title}" due to expired deadline (${deadlineText}).`
          );
          pastDeadlineCount++;
          if (pastDeadlineCount >= 3) {
            console.log(
              "Stopping scraping after 3 consecutive past deadlines."
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

// Export the function
module.exports = {
  scrapeSaltoProjects,
};
