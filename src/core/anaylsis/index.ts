import { getConfig } from "../..";
import { PostgresDataSourceSingleton } from "../../datastores/postgres";
import { ThreeWayGameEventEntity, TwoWayGameEventEntity } from "../../datastores/postgres/entities";
import { getAnalyzableTwoWayGames } from "../../datastores/postgres/queries/two_way_game_event";
import { Result } from "../../utils/types/result_type";
import { getAnalyzableThreeWayGames } from "../../datastores/postgres/queries/three_way_game_event";

const {logger} = getConfig();

export class BaseAnalyser {
    /**
     * Get two way game events that can be analyzed according to betType.
     * Analyzable data is the data where the start event is greater than the current time.
     * 
     * @param betType 
     */
    protected async getTwoWayGameEventData(): Promise<Result<TwoWayGameEventEntity[], Error>> {
        const getPostgresDataSourceResult = await PostgresDataSourceSingleton.getInstance(getConfig());
        if (getPostgresDataSourceResult.result === "error") {
            const message = "Failed to get postgres data source when fetching two way game vents for analysis";
            logger.error(message);
            return getPostgresDataSourceResult;
        } else {
            const data = await getAnalyzableTwoWayGames(getPostgresDataSourceResult.value);
            return {
                result: "success",
                value: data
            };
        }
    }

    protected async getThreeWayGameEventData(): Promise<Result<ThreeWayGameEventEntity[], Error>> {
        const getPostgresDataSourceResult = await PostgresDataSourceSingleton.getInstance(getConfig());
        if (getPostgresDataSourceResult.result === "error") {
            const message = "Failed to get postgres data source when fetching three way game vents for analysis";
            logger.error(message);
            return getPostgresDataSourceResult;
        } else {
            const data = await getAnalyzableThreeWayGames(getPostgresDataSourceResult.value);
            return {
                result: "success",
                value: data
            }
        }
    }
}
