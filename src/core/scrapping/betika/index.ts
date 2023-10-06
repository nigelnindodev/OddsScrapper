import { setInterval } from "timers/promises";

import { BaseScrapper } from "..";
import { getConfig } from "../../..";
import { BetProvider } from "../../../bet_providers";
import { BetikaProvider } from "../../../bet_providers/betika";
import { PuppeteerPageLoadPolicy } from "../../../utils/types/common";
import { Result } from "../../../utils/types/result_type";
import { getHtmlForPage } from "../simple_scraper";

const {logger} = getConfig();

export class BetikaScrapper extends BaseScrapper {
    override betProvider: BetProvider;

    constructor() {
        super();
        this.betProvider = new BetikaProvider();
    }

    public async fetchData(): Promise<Result<boolean, Error>> {
        const getBetProviderConfigResult = await this.betProvider.getConfig();

        if (getBetProviderConfigResult.result === "success") {
            const betProviderConfig = getBetProviderConfigResult.value;
            const browserInstance = await this.initializeBrowserInstance();

            betProviderConfig.games.forEach(async game => {
                let pageNumber = 1;

                //@ts-ignore
                for await (const value of setInterval(3000, 0)) {
                    const completedUrl = `${game.url}&page=${pageNumber}`;

                    const metadata = {
                        providerName: this.betProvider.name,
                        game: game.name,
                        url: completedUrl
                    };

                    logger.info("New request to fetch game events: ", metadata);

                    const getHtmlResult = await getHtmlForPage(browserInstance, completedUrl, PuppeteerPageLoadPolicy.DOM_CONTENT_LOADED);

                    if (getHtmlResult.result === "success") {
                        logger.info("Successfully fetched html for url", metadata);
                        if (this.pageHasNoGameEvents(getHtmlResult.value.html)) {
                            logger.info("No game events found. Stopping HTML fetch for current game.", metadata);
                            break; 
                        } else {
                            logger.info("Game events found.", metadata);
                            pageNumber = pageNumber + 1; // increment page count to move to the next page
                        }
                    } else {
                        logger.error("An error occurred while fetching html for page", metadata);
                        break; 
                    }
                }
            }); 

            /**
             * We will need a different strategy of closing the browser instance once we are done collecting the info we need.
             * The current problem is since our code is async the close function is called 
             */
            // logger.info("Closing browser instance for fetching provider games.", {providerName: this.betProvider.name});
            //await browserInstance.close();

            return {
                result: "success",
                value: true
            };
        } else {
            return getBetProviderConfigResult;
        }
    }

    /**
     * Current implementation optimistically checks for new game events in subsequent pages from the start point page 1 of events.
     * This functions terminates checking for new game events when the page does not have any more events.
     */
    //@ts-ignore
    private pageHasNoGameEvents(html: string): boolean {
        return html.includes("No matches available for this filter");
    }
}
