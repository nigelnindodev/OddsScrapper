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
                // first lets test out the result of fetching only one page.
                const completedUrl = `${game.url}&page=1`;
                const getHmlResult = await getHtmlForPage(browserInstance, completedUrl, PuppeteerPageLoadPolicy.DOM_CONTENT_LOADED);

                const metadata = {
                    providerName: this.betProvider.name,
                    game: game.name,
                    url: completedUrl
                };

                if (getHmlResult.result === "success") {
                    logger.info("Successfully fetched html for url", metadata);
                    logger.trace(getHmlResult.value);
                } else {
                    logger.error("An error occurred while fetching html for page", metadata);
                }
            });

            return {
                result: "success",
                value: true
            };
        } else {
            return getBetProviderConfigResult;
        }
    }
}
