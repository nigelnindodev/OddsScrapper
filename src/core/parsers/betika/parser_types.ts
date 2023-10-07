import * as cheerio from "cheerio";
import momentTz from 'moment-timezone';

import { Result } from "../../../utils/types/result_type";
import { getConfig } from "../../..";
import { TimeZones } from "../../../utils/types/common";

const {logger} = getConfig();

export function processBetikaTwoWayGamesHtml(html: string): Result<any[], Error>  {
    const gameEvents: any[] = [];
    const $ = cheerio.load(html);

    try {
        $("table.highlights--item").each((_, element) => {
            logger.trace("Found highight item");
            const gameDescription: string = $(element).find(".game").find(".clubs").text();
            const playerNames = (gameDescription.split("v."));

            const moreDetails = $(element).find(".league").find("tbody > tr > td:nth-child(2)").text();
            const gameTimeProviderId = moreDetails.split("- ID").map(val => val.trim());
            // set timezone to provider timezone, ensure we parse timezone correctly
            momentTz.tz.setDefault(TimeZones.NAIROBI);
            const gameTime = momentTz(gameTimeProviderId[0], "DD/MM HH:mm");

            gameEvents.push({
                details: {
                    playerOneWin: {
                        name: playerNames[0] === undefined ? "undefined_home_name" : playerNames[0].trim(),
                        odd: Number($(element).find(".odds .clubone").find("td").find(".odd").text())
                    },
                    playerTwoWin: {
                        name: playerNames[1] === undefined ? "undefined_away_name" : playerNames[1].trim(),
                        odd: Number($(element).find(".odds .clubtwo").find("td").find(".odd").text())
                    },
                    gameDescription: gameDescription,
                    estimatedStartTimeUtc: gameTime.toDate(), // converts to utc with timezone details
                    betProviderGameId: gameTimeProviderId[1]
                    //scrapeId: this.scrapeId,
                    //sport: scrapeConfig.sport,
                    //league: scrapeConfig.league
                }
            });
        });
        return {result: "success", value: gameEvents};
    } catch (e: any) {
        logger.error('An error occurred while parsing Betika two way html: ', e.message);
        return {result: "error", value: new Error(e.message)};
    }
}