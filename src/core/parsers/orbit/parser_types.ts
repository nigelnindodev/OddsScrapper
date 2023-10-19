import * as cheerio from "cheerio";
import _ from "lodash";
import momentTz from 'moment-timezone';

import { getConfig } from "../../..";
import { Result } from "../../../utils/types/result_type";
import { TimeZones } from "../../../utils/types/common";

const {logger} = getConfig();

export function processOrbitThreeWayGamesHtml(html: string): Result<any[], Error> {
    const gameEvents: any[] = [];

    const $ = cheerio.load(html);
    const timeRegexMatcher = /\d\d:\d\d/g;
    momentTz.tz.setDefault(TimeZones.UTC); // highly suspect timezones for orbit are in utc because saw games events from previous day
    try {

        $("div.biab_group-markets.biab_market-odds-wrapper.styles_collapse__container__2Gov0").each((_, element) => {
            const startDate = $(element).find("span.styles_title__lw-Ns").text().trim();

            $(element).each((_,element_1) => {
                const data = $(element_1).find("div.biab_group-markets-table-row");
        
                data.each((_, element_2) => {
                    const teamNames = $(element_2).find("div > div.biab_market-title-team-names");
                    const clubA = $(teamNames).find("p:nth-child(1)").text().trim();
                    const clubB = $(teamNames).find("p:nth-child(2)").text().trim();
                    
                    const numBets = Number($(element_2).find("div > span.cursor-help").text().trim());
                    const startTime = $(element_2).find("div.biab_market-inplay-cell.styles_inPlayCell__laf3g").text().trim().replace(" ", "");
                    const parsedTime = startTime.match(timeRegexMatcher);
                    
                    const oddsWrapper = $(element_2).find("div.styles_betContent__wrapper__25jEo");
                    const odds = $(oddsWrapper).find("div.styles_contents__Kf8LQ > button > span > div > span.styles_betOdds__bxapE");
                    const oddsArray: any[] = [];
                    odds.each((_, element_3) => {
                        oddsArray.push($(element_3).text().trim());
                    });
                    
                    gameEvents.push({
                        clubA,
                        clubB,
                        numBets,
                        startDate,
                        parsedTime,
                        oddsArray
                    });
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

        // filter out games where there is insufficient quorum of player stakes
        finalMapping = finalMapping.filter(event => {
            return event.numBets > 9;
        });

        // remove in-play and game events just about to start
        finalMapping = finalMapping.filter(event => {
            return event.parsedTime !== null;
        });

        finalMapping = finalMapping.map(item => {
            return {...item, ...{estimatedStartTimeUtc: momentTz(`${item.startDate} ${item.parsedTime[0]}`, "ddd DD MMM HH:mm").toDate()}};
        });

        logger.trace(finalMapping);

        return {result: "success", value: finalMapping};
    } catch(e: any) {
        logger.error("An error occurred while parsing Orbit three way html data: ", e.message);
        return {result: "error", value: new Error(e.message)};
    }
}
