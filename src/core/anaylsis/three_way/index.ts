import { BaseAnalyser } from "..";
import { getConfig } from "../../..";

const {logger} = getConfig();

export class ThreeWayAnalyzer extends BaseAnalyser {
    public async getData() {
        const data = await this.getThreeWayGameEventData();
        logger.info("Analyzable data: ", data);
    }
}