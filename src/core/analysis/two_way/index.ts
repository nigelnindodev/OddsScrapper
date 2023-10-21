import { BaseAnalyser } from "..";
import { getConfig } from "../../..";

const {logger} = getConfig();

export class TwoWayAnalyser extends BaseAnalyser {
    public async getData(): Promise<void> {
        const getEventDataResult = await this.getTwoWayGameEventData();
        
        if (getEventDataResult.result === "error") {
            logger.error("Error while fetching event data: ", getEventDataResult.value.message);
            return;
        }

        getEventDataResult.value.map(async event => {
            const matchingEvents = await this.getMatchingGameEvents(event);
            logger.info("Event: ", event);
            logger.info("Matching events: ", matchingEvents);
        });
    }
}
