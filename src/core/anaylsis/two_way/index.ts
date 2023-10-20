import { BaseAnalyser } from "..";
import { getConfig } from "../../..";

const {logger} = getConfig();

export class TwoWayAnalyser extends BaseAnalyser {
    public async getData() {
        const data = await this.getTwoWayGameEventData();
        logger.info("Analyzable data: ", data);
    }
}
