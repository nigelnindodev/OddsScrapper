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
        $("div:not(.odds-title).game.highlights--item").each((_, element) => {
            momentTz.tz.setDefault(TimeZones.NAIROBI);
            const clubsAndOdds = $(element).find("div.teams-info-vert.big-screen");
            gameEvents.push({
                clubA: $(clubsAndOdds).find("div.teams-info-vert-left > a > div:nth-child(1)").text().trim(),
                clubB: $(clubsAndOdds).find("div.teams-info-vert-left > a > div:nth-child(2)").text().trim(),
                estimatedStartTimeUtc: momentTz(
                    $(element).find("div.teams-info-meta.big-screen > div.teams-info-meta-right").text().trim(),
                    "DD/MM HH:mm").toDate(),
                league: $(element).find("div.teams-info-meta.big-screen > div.teams-info-meta-left").text().trim(),
                oddsAWin: Number($(clubsAndOdds).find("button.match-odd.odd1 > div.odds__value").text().trim()),
                oddsBWin: Number($(clubsAndOdds).find("button.match-odd.odd2 > div.odds__value").text().trim()),
                link: $(clubsAndOdds).find("div.teams-info-vert-left > a").attr("href"),
            });
        });
        return {result: "success", value: gameEvents};
    } catch (e: any) {
        logger.error('An error occurred while parsing Betika two way html data: ', e.message);
        return {result: "error", value: new Error(e.message)};
    }
}

export function processBetikaThreeWayGamesHtml(html: string): Result<any[], Error>  {
    const gameEvents: any[] = [];
    const $ = cheerio.load(html);
    try {
        $("div:not(.odds-title).game.highlights--item").each((_, element) => {
            momentTz.tz.setDefault(TimeZones.NAIROBI);
            const clubsAndOdds = $(element).find("div.teams-info-vert.big-screen");
            gameEvents.push({
                clubA: $(clubsAndOdds).find("div.teams-info-vert-left > a > div:nth-child(1)").text().trim(),
                clubB: $(clubsAndOdds).find("div.teams-info-vert-left > a > div:nth-child(2)").text().trim(),
                estimatedStartTimeUtc: momentTz(
                    $(element).find("div.teams-info-meta.big-screen > div.teams-info-meta-right").text().trim(),
                    "DD/MM HH:mm").toDate(),
                league: $(element).find("div.teams-info-meta.big-screen > div.teams-info-meta-left").text().trim(),
                oddsAWin: Number($(clubsAndOdds).find("button.match-odd.odd1 > div.odds__value").text().trim()),
                oddsDraw: Number($(clubsAndOdds).find("button.match-odd.odd2 > div.odds__value").text().trim()),
                oddsBWin: Number($(clubsAndOdds).find("button.match-odd.odd3 > div.odds__value").text().trim()),
                link: $(clubsAndOdds).find("div.teams-info-vert-left > a").attr("href"),
            });
        });
        return {result: "success", value: gameEvents};
    } catch (e: any) {
        logger.error('An error occurred while parsing Betika two way html data: ', e.message);
        return {result: "error", value: new Error(e.message)};
    }
}
