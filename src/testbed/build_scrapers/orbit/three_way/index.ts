//@ts-ignore
import * as cheerio from "cheerio";

import { getConfig } from "../../../..";
import { readFileAsync } from "../../../../utils/file_system";

const {logger} = getConfig();

class OrbitThreeWayTestBed {
    public async run() {
        const timeRegexMatcher = /\d\d:\d\d/g;
        const htmlDataResult = await readFileAsync("data/test_html/orbit/tennis.html");
        if (htmlDataResult.result === "success") {
            logger.info("Success fetching html");
            const $ = cheerio.load(htmlDataResult.value);

            $("div.biab_group-markets.biab_market-odds-wrapper.styles_collapse__container__2Gov0").each((_,element) => {
                const startDate = $(element).find("span.styles_title__lw-Ns").text().trim();

                /**
                 * Bypassing .biab_group-markets-table div and going directly to .rowContainer
                 */
                $(element).each((_,element_1) => {
                    const data = $(element_1).find("div.biab_group-markets-table-row");

                    data.each((_, element_2) => {
                        const teamNames = $(element_2).find("div > div.biab_market-title-team-names");
                        const clubA = $(teamNames).find("p:nth-child(1)").text().trim();
                        const clubB = $(teamNames).find("p:nth-child(2)").text().trim();

                        const numBets = $(element_2).find("div > span.cursor-help").text().trim();

                        const startTime = $(element_2).find("div.biab_market-inplay-cell.styles_inPlayCell__laf3g").text().trim().replace(" ", "");

                        const oddsWrapper = $(element_2).find("div.styles_betContent__wrapper__25jEo");

                        //const oddFinder = "div.styles_contents__Kf8LQ > button > span > div > span.styles_betOdds__bxapE";

                        const odds = $(oddsWrapper).find("div.styles_contents__Kf8LQ > button > span > div > span.styles_betOdds__bxapE");

                        // expecting 3 pairs of odds for W,D,L. So 6 in total
                        const oddsArray = [];
                        odds.each((_, element_3) => {
                            oddsArray.push($(element_3).text().trim());
                            logger.trace($(element_3).text().trim());
                        });

                        const parsedTime = startTime.match(timeRegexMatcher);

                        logger.trace(`${clubA} vs ${clubB}`);
                        logger.trace("numBets: ", numBets);
                        logger.trace("startDate: ", startDate);
                        logger.trace("startTime: ", parsedTime);
                        //logger.trace("odd1: ", $(oddsWrapper).find(`${oddFinder}:nth-child(1)`));
                    });
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
