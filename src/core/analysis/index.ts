import { getConfig } from "../..";
import { PostgresDataSourceSingleton } from "../../datastores/postgres";
import { GameEventEntityTypes, ThreeWayGameEventEntity, TwoWayGameEventEntity } from "../../datastores/postgres/entities";
import { getAnalyzableTwoWayGames, getMatchingTwoWayGameEventsTrigram } from "../../datastores/postgres/queries/two_way_game_event";
import { Result } from "../../utils/types/result_type";
import { getAnalyzableThreeWayGames } from "../../datastores/postgres/queries/three_way_game_event";

const {logger} = getConfig();

export class BaseAnalyser {
    /**
     * Get two way game events that can be analyzed.
     * Analyzable data is the data where the start event is greater than the current time.
     * 
     * @param betType 
     */
    protected async getTwoWayGameEventData(): Promise<Result<TwoWayGameEventEntity[], Error>> {
        const getPostgresDataSourceResult = await PostgresDataSourceSingleton.getInstance(getConfig());
        if (getPostgresDataSourceResult.result === "error") {
            const message = "Failed to get postgres data source when fetching two way game events for analysis";
            logger.error(message);
            return getPostgresDataSourceResult;
        } else {
            return {
                result: "success",
                value: await getAnalyzableTwoWayGames(getPostgresDataSourceResult.value)
            };
        }
    }

    /**
     * Get three way game events that can be analyzed.
     * Analyzable data is the data where the start event is greater than the current time.
     * 
     * @param betType 
     */
    protected async getThreeWayGameEventData(): Promise<Result<ThreeWayGameEventEntity[], Error>> {
        const getPostgresDataSourceResult = await PostgresDataSourceSingleton.getInstance(getConfig());
        if (getPostgresDataSourceResult.result === "error") {
            const message = "Failed to get postgres data source when fetching three way game events for analysis";
            logger.error(message);
            return getPostgresDataSourceResult;
        } else {
            return {
                result: "success",
                value: await getAnalyzableThreeWayGames(getPostgresDataSourceResult.value)
            }
        }
    }

    protected async getMatchingGameEvents(gameEvent: GameEventEntityTypes): Promise<Result<GameEventEntityTypes[] | null, Error>> {
        const getPostgresDataSourceResult = await PostgresDataSourceSingleton.getInstance(getConfig());
        if (getPostgresDataSourceResult.result === "error") {
            const message = "Failed to get postgres data source when fetching matching game events for analysis";
            logger.error(message);
            return getPostgresDataSourceResult;
        } else {
            return {
                result: "success",
                value: await getMatchingTwoWayGameEventsTrigram(getPostgresDataSourceResult.value, gameEvent)
            };
        }
    }
}
