import { BaseAnalyser } from "..";
import { getConfig } from "../../..";

const {logger} = getConfig();

export class ThreeWayAnalyzer extends BaseAnalyser {
    public async getData() {
        const getEventDataResult = await this.getThreeWayGameEventData();

        if (getEventDataResult.result === "error") {
            logger.error("Error while fetching event data: ", getEventDataResult.value.message);
            return;
        }

        getEventDataResult.value.map(async event => {
            const matchingEvents = await this.getMatchingThreeWayGameEvents(event);
            logger.info("Event: ", event);
            logger.info("Matching events: ", matchingEvents);
        });
    }
}