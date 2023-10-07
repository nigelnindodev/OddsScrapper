import { setInterval } from "timers/promises";

import { BaseScrapper } from "..";
import { getConfig } from "../../..";
import { BetProvider } from "../../../bet_providers";
import { BetikaProvider } from "../../../bet_providers/betika";
import { PuppeteerPageLoadPolicy } from "../../../utils/types/common";
import { Result } from "../../../utils/types/result_type";
import { getHtmlForPage } from "../simple_scraper";
import { RedisSingleton } from "../../../datastores/redis";
import { getRedisHtmlParserChannelName } from "../../../utils/redis";

const {logger} = getConfig();

export class BetikaScrapper extends BaseScrapper {
    public override betProvider: BetProvider;
    public override scrapeIntervalDuration: number;

    constructor() {
        super();
        this.betProvider = new BetikaProvider();
        this.scrapeIntervalDuration = 10000;
    }

    public async fetchData(): Promise<Result<boolean, Error>> {
        const getBetProviderConfigResult = await this.betProvider.getConfig();

        if (getBetProviderConfigResult.result === "error") {
            logger.error("failed to load config for provider: ", this.betProvider.name);
            return getBetProviderConfigResult;
        }

        const getRedisPublisherResult = await RedisSingleton.getPublisher();

        if (getRedisPublisherResult.result === "success") {
            const betProviderConfig = getBetProviderConfigResult.value;
            const browserInstance = await this.initializeBrowserInstance();

            const results = betProviderConfig.games.map(async game => {
                let pageNumber = 1;

                //@ts-ignore
                for await (const value of setInterval(this.scrapeIntervalDuration, 0)) {
                    const completedUrl = `${game.url}&page=${pageNumber}`;

                    const metadata = {
                        betProviderName: this.betProvider.name,
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
                            this.publishRawHtmlToRedis(
                                getRedisPublisherResult.value,
                                getRedisHtmlParserChannelName(this.betProvider, game),
                                {
                                    betProviderName: this.betProvider.name,
                                    betType: game.betType,
                                    fromUrl: completedUrl,
                                    gameName: game.name,
                                    rawHtml: getHtmlResult.value.html
                                }
                            );
                            pageNumber = pageNumber + 1; // increment page count to move to the next page
                        }
                    } else {
                        logger.error("An error occurred while fetching html for page", metadata);
                        break; 
                    }
                }
            });

            // wait for promises to complete before closing the browser
            await Promise.all(results);
            await browserInstance.close();

            return {
                result: "success",
                value: true
            };
        } else {
            return getRedisPublisherResult;
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
