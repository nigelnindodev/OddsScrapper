//@ts-ignore
import * as cheerio from "cheerio";

import { getConfig } from "../../../..";
import { readFileAsync } from "../../../../utils/file_system";

const {logger} = getConfig();

class OrbitThreeWayTestBed {
    public async run() {
        const htmlDataResult = await readFileAsync("data/test_html/orbit/football.html");
        if (htmlDataResult.result === "success") {
            logger.info("Success fetching html");
            const $ = cheerio.load(htmlDataResult.value);


            /**
             * Bypassing .biab_group-markets-table div and going directly to .rowContainer
             */
            $("div.rowsContainer").each((_,element) => {
                const data = $(element).find("div.biab_group-markets-table-row");

                data.each((_, element_1) => {
                    const teamNames = $(element_1).find("div > div.biab_market-title-team-names");
                    const clubA = $(teamNames).find("p:nth-child(1)").text().trim();
                    const clubB = $(teamNames).find("p:nth-child(2)").text().trim();

                    const numBets = $(element_1).find("div > span.cursor-help").text().trim();

                    const oddsWrapper = $(element_1).find("div.styles_betContent__wrapper__25jEo");

                    //const oddFinder = "div.styles_contents__Kf8LQ > button > span > div > span.styles_betOdds__bxapE";

                    const odds = $(oddsWrapper).find("div.styles_contents__Kf8LQ > button > span > div > span.styles_betOdds__bxapE");

                    // expecting 3 pairs of odds for W,D,L. So 6 in total
                    const oddsArray = [];
                    odds.each((_, element_2) => {
                        oddsArray.push($(element_2).text().trim());
                        logger.trace($(element_2).text().trim());
                    });


                    logger.trace(`${clubA} vs ${clubB}`);
                    logger.trace("numBets: ", numBets);
                    //logger.trace("odd1: ", $(oddsWrapper).find(`${oddFinder}:nth-child(1)`));
                });
            });
        } else {
            const message = "Could not get html data";
            throw new Error(message);
        }
    }

    /**
     * Remove games with missing odds data.
     * @param oddsArray 
     */
    isValid(oddsArray: string[]): boolean {
        let missingOddFound = false;
        oddsArray.forEach(odd => {
            if (odd === ""){
                missingOddFound = true;
            }
        })
        return !missingOddFound;
    }
}

const testBed = new OrbitThreeWayTestBed();
testBed.run();
