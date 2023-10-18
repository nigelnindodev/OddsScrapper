import * as cheerio from "cheerio";
import _ from "lodash";

import { getConfig } from "../../..";
import { Result } from "../../../utils/types/result_type";

const {logger} = getConfig();

export function processOrbitThreeWayGamesHtml(html: string): Result<any[], Error> {
    const gameEvents: any[] = [];

    const $ = cheerio.load(html);
    try {

        $("div.rowsContainer").each((_,element) => {
            const data = $(element).find("div.biab_group-markets-table-row");
    
            data.each((_, element_1) => {
                const teamNames = $(element_1).find("div > div.biab_market-title-team-names");
                const clubA = $(teamNames).find("p:nth-child(1)").text().trim();
                const clubB = $(teamNames).find("p:nth-child(2)").text().trim();
                
                const numBets = Number($(element_1).find("div > span.cursor-help").text().trim());
                
                const oddsWrapper = $(element_1).find("div.styles_betContent__wrapper__25jEo");
                const odds = $(oddsWrapper).find("div.styles_contents__Kf8LQ > button > span > div > span.styles_betOdds__bxapE");
                const oddsArray: any[] = [];
                odds.each((_, element_2) => {
                    oddsArray.push($(element_2).text().trim());
                });
                
                gameEvents.push({
                    clubA,
                    clubB,
                    numBets,
                    oddsArray
                });
            });
        });

        const validationAdded = gameEvents.map(event => {
            let valid = true;
            //@ts-ignore
            event.oddsArray.forEach(potentialOdd => {
                if (potentialOdd === "") {
                    valid = false;
                }
            });
            return {...event, ...{valid: valid}};
        });

        // Remove game vents without 6 complete odds
        const filteredEvents = _.filter(validationAdded, {valid: true});

        let finalMapping = filteredEvents.map(event => {
            //@ts-ignore
            const oddsToNumber = event.oddsArray.map(item => {
                return Number(item);
            })
            return {...event, ...{oddsArray: oddsToNumber}};
        });

        finalMapping = finalMapping.filter(event => {
            return event.numBets > 9;
        });

        logger.trace(finalMapping);

        return {result: "success", value: finalMapping};
    } catch(e: any) {
        logger.error("An error occurred while parsing Orbit three way html data: ", e.message);
        return {result: "error", value: new Error(e.message)};
    }
}
