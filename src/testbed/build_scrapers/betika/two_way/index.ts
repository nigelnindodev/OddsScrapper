import * as cheerio from "cheerio";

import { getConfig } from "../../../..";
import { readFileAsync } from "../../../../utils/file_system";

const {logger} = getConfig();

class BetikaTwoWayTestBed {
    
    public async run() {
        const htmlDataResult = await readFileAsync("data/raw_html/BETIKA/TennisSingles_Copy/1.html");
        if (htmlDataResult.result === "success") {
            logger.info('Success fetching html');
            const $ = cheerio.load(htmlDataResult.value);
            /**
             * This used to be a table. Looks like not i has been switched to a div, which is actually better I think.
             * 
             * Note however that currently the first div matching our query is actually empty (can be found here <div class="game highlights--item odds-title big-screen").
             * TODO: Multiple ways known of handling this, but which one is the best?
             * Used the div:not(.odds-title) selector to remove the unwanted value.
             */
            $("div:not(.odds-title).game.highlights--item").each((_, element) => {
                /**
                 * Let's now switch to using teams-info-vert big-screen to find club names.
                 * Seems much more reliable and not prone to changes like "v. and vs." that
                 * we used before to separate player/club names.
                 */

                //@ts-ignore
                const clubsAndOdds = $(element).find("div.teams-info-vert.big-screen");
                logger.trace("Club A: ", $(clubsAndOdds).find("div.teams-info-vert-left > a > div:nth-child(1)").text().trim());
                logger.trace("Club B: ", $(clubsAndOdds).find("div.teams-info-vert-left > a > div:nth-child(2)").text().trim());
                logger.trace("Odd One: ", Number($(clubsAndOdds).find("button.match-odd.odd1 > div.odds__value").text().trim()));
                logger.trace("Odd Two: ", Number($(clubsAndOdds).find("button.match-odd.odd2 > div.odds__value").text().trim()));
                logger.trace("Tournament: ", $(element).find("div.teams-info-meta.big-screen > div.teams-info-meta-left").text().trim());
                logger.trace("DateTime String: ", $(element).find("div.teams-info-meta.big-screen > div.teams-info-meta-right").text().trim());
                logger.trace("Unique ID: ", $(clubsAndOdds).find("div.teams-info-vert-left > a").attr("href"));
                console.log("\n");
            });
        } else {
            const message = "Could not get html data"
            logger.error(message, htmlDataResult.value.message);
            throw new Error(message);
        }
    }
}

const testBed = new BetikaTwoWayTestBed();
testBed.run();

