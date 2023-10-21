import { getConfig } from "../..";
import { PostgresDataSourceSingleton } from "../../datastores/postgres";
import { ThreeWayGameEventEntity, TwoWayGameEventEntity } from "../../datastores/postgres/entities";
import { getAnalyzableTwoWayGames, getMatchingTwoWayGameEventsTrigram } from "../../datastores/postgres/queries/two_way_game_event";
import { Result } from "../../utils/types/result_type";
import { getAnalyzableThreeWayGames, getMatchingThreeWayGameEventsTrigram } from "../../datastores/postgres/queries/three_way_game_event";

const {logger} = getConfig();

export class BaseAnalyser {

    private getWinnings(stake: number, oddsForEvent: number): number {
        const totalWithdrawableOnWin = stake * oddsForEvent;
        return totalWithdrawableOnWin - stake;
    }

    /**
     * Gets the expected value of staking on an event.
     * Positive and higher results are better;
     * @param probabilityOfEvent "True" Probability between 0 and 1.
     * @param oddsForEvent Odds by the bet provider for the event.
     */
    protected getEventEvPercent(probabilityOfEvent: number, oddsForEvent: number): number {
        const theoreticalStake = 10;
        const evAsNumber = (this.getWinnings(theoreticalStake, oddsForEvent) * probabilityOfEvent) - (theoreticalStake * (1-probabilityOfEvent));
        return evAsNumber; // TODO: Return as a percentage
    }
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

    protected async getMatchingTwoWayGameEvents(gameEvent: TwoWayGameEventEntity): Promise<Result<TwoWayGameEventEntity[] | null, Error>> {
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

    protected async getMatchingThreeWayGameEvents(gameEvent: ThreeWayGameEventEntity): Promise<Result<ThreeWayGameEventEntity[] | null, Error>> {
        const getPostgresDataSourceResult = await PostgresDataSourceSingleton.getInstance(getConfig());
        if (getPostgresDataSourceResult.result === "error") {
            const message = "Failed to get postgres data source when fetching matching game events for analysis";
            logger.error(message);
            return getPostgresDataSourceResult;
        } else {
            return {
                result: "success",
                value: await getMatchingThreeWayGameEventsTrigram(getPostgresDataSourceResult.value, gameEvent)
            };
        }
    }
}
