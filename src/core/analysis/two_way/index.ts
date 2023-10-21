import { BaseAnalyser } from "..";
import { getConfig } from "../../..";
import { TwoWayGameEventEntity } from "../../../datastores/postgres/entities";

const {logger} = getConfig();

export class TwoWayAnalyser extends BaseAnalyser {
    public async getData(): Promise<void> {
        const gameEventsWithEv: {clubAWinEv: Number, clubBWinEv: number, event: TwoWayGameEventEntity}[] = [];

        const getEventDataResult = await this.getTwoWayGameEventData();
        
        if (getEventDataResult.result === "error") {
            logger.error("Error while fetching event data: ", getEventDataResult.value.message);
            return;
        }

        const results = await getEventDataResult.value.map(async event => {
            const getMatchingEventsResult = await this.getMatchingTwoWayGameEvents(event);
            logger.info("Event: ", event);
            logger.info("Matching events: ", getMatchingEventsResult);

            if (getMatchingEventsResult.result === "success" && getMatchingEventsResult.value !== null) {
                getMatchingEventsResult.value.forEach(gameEvent => {
                    const clubAWinTrueProbability = (1 / event.odds_a_win);
                    const clubBWinTrueProbability = (1 / event.odds_b_win);

                    const clubAWinEv = this.getEventEvPercent(clubAWinTrueProbability, gameEvent.odds_a_win);
                    const clubBWinEv = this.getEventEvPercent(clubBWinTrueProbability, gameEvent.odds_b_win);

                    gameEventsWithEv.push({
                        clubAWinEv,
                        clubBWinEv,
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
