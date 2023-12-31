import { BaseScrapper } from "..";
import { getConfig } from "../../..";
import { BetProvider } from "../../../bet_providers";
import { OrbitProvider } from "../../../bet_providers/orbit";
import { RedisSingleton } from "../../../datastores/redis";
import { getRedisHtmlParserChannelName } from "../../../utils/redis";
import { BetProviderGameConfig, PuppeteerPageLoadPolicy } from "../../../utils/types/common";
import { Result } from "../../../utils/types/result_type";
import { getHtmlForScrollingPage } from "../scrolling_scrapper";

const {logger} = getConfig();

export class OrbitScrapper extends BaseScrapper {
    public override betProvider: BetProvider;
    public override scrapeIntervalDuration: number;

    constructor() {
        super();
        this.betProvider = new OrbitProvider();
        this.scrapeIntervalDuration = 10000;
    }

    /**
     * Fetch data from Orbit, which actually mirrors BetFair data. Data is fetched per sport, which
     * is available as an infinite scrolling list.
     * @returns 
     */
    public async fetchData(): Promise<Result<boolean, Error>> {
        const getBetProviderConfigResult = await this.betProvider.getConfig();

        if (getBetProviderConfigResult.result === "error") {
            logger.error("Failed to get config for provider: ", this.betProvider);
                return getBetProviderConfigResult;
        }

        const getRedisPublisherResult = await RedisSingleton.getPublisher();

        if (getRedisPublisherResult.result === "success") {
            const betProviderConfig = getBetProviderConfigResult.value;
            const browserInstance = await this.initializeBrowserInstance();

            const results = await this.mapSeries(betProviderConfig.games, async (game) => {
                const metadata = {
                    betProviderName: this.betProvider.name,
                    game: game.name,
                    url: game.url
                };

                logger.info("New request to fetch game events: ", metadata);

                const getHtmlResult = await getHtmlForScrollingPage(
                    browserInstance,
                    game.url,
                    PuppeteerPageLoadPolicy.LOAD,
                    ".biab_body.contentWrap", // scrollingElementSelector
                    2000, // delayBeforeNextScrollAttemptMillis 
                    60, // numScrollAttempts
                    150 // scrollDelta
                );

                if (getHtmlResult.result === "success") {
                    logger.info("Successfully fetched html for url. ", metadata);
                    this.publishRawHtmlToRedis(
                        getRedisPublisherResult.value,
                        getRedisHtmlParserChannelName(this.betProvider, game),
                        {
                            betProviderName: this.betProvider.name,
                            betType: game.betType,
                            fromUrl: game.url,
                            gameName: game.name,
                            rawHtml: getHtmlResult.value.html
                        }
                    );
                } else {
                    logger.error("An error occurred while fetching html for page", metadata);
                }

                return true;
            });

            logger.trace("Data fetch results: ", results);
            await browserInstance.close();

            return {
                result: "success",
                value: true
            };
        } else {
            return getRedisPublisherResult;
        }
    }

    private async mapSeries(iterable: Iterable<BetProviderGameConfig>, fn: (game: BetProviderGameConfig) => Promise<boolean>) {
        const results: boolean[] = [];

        for (const x of iterable) {
            results.push(await fn(x))
        }

        return results;
    }
}