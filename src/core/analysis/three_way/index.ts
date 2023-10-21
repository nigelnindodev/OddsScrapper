import { BaseAnalyser } from "..";
import { getConfig } from "../../..";
import { ThreeWayGameEventEntity } from "../../../datastores/postgres/entities";

const {logger} = getConfig();

export class ThreeWayAnalyzer extends BaseAnalyser {
    public async getData() {
        const gameEventsWithEv: {clubAWinEv: number, clubBWinEv: number, drawEv: number, event: ThreeWayGameEventEntity}[] = [];

        const getEventDataResult = await this.getThreeWayGameEventData();

        if (getEventDataResult.result === "error") {
            logger.error("Error while fetching event data: ", getEventDataResult.value.message);
            return;
        }

        const results = await getEventDataResult.value.map(async event => {
            const getMatchingEventsResult = await this.getMatchingThreeWayGameEvents(event);
            logger.info("Event: ", event);
            logger.info("Matching events: ", getMatchingEventsResult);

            if (getMatchingEventsResult.result === "success" && getMatchingEventsResult.value !== null) {
                getMatchingEventsResult.value.forEach(gameEvent => {
                   const clubAWinTrueProbability = (1 / event.odds_a_win);
                   const clubBWinTrueProbability = (1 / event.odds_b_win);
                   const drawTrueProbability = (1 / event.odds_draw);

                   const clubAWinEv = this.getEventEvPercent(clubAWinTrueProbability, gameEvent.odds_a_win);
                   const clubBWinEv = this.getEventEvPercent(clubBWinTrueProbability, gameEvent.odds_b_win);
                   const drawEv = this.getEventEvPercent(drawTrueProbability, gameEvent.odds_draw);

                   gameEventsWithEv.push({
                    clubAWinEv,
                    clubBWinEv,
                    drawEv,
                    event: gameEvent
                   });
                });
            }
        });

        await Promise.all(results);
        gameEventsWithEv.forEach(eventWithEv => {
            logger.info("Game event with EV: ", eventWithEv);
        });
    }    
}
