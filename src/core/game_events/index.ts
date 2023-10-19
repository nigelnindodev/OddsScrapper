import { getConfig } from "../..";
import { BetProvider } from "../../bet_providers";
import { PostgresDataSourceSingleton } from "../../datastores/postgres";
import { getThreeWayGame, insertThreeWayGameEvent } from "../../datastores/postgres/queries/three_way_game_event";
import { getTwoWayGame, insertTwoWayGameEvent } from "../../datastores/postgres/queries/two_way_game_event";
import { RedisSingleton } from "../../datastores/redis";
import { getRedisProcessedEventsChannelName } from "../../utils/redis";
import { BetTypes, ProcessedGameEvents } from "../../utils/types/common";
import { Result } from "../../utils/types/result_type";

const {logger} = getConfig();

export abstract class BaseGameEventsProcessor {
    public abstract betProvider: BetProvider
    /**
     * Listener for new game events for all providers. Can use the same implementation, since the data is already
     * normalized in the `parsers` stage.
     * Inserts the game events into the respective game event table.
     * TODO:
     * - Do not double insert if event already exists (should already be blocked by database constraints)
     * - Update on updated odds
     * - Store outdated odds in a historical database
     * @returns 
     */
    public async initGameEventsListener(): Promise<Result<boolean, Error>> {
        const getBetProviderConfigResult = await this.betProvider.getConfig();
        if (getBetProviderConfigResult.result === "error") {
            logger.error("Event processor failed to load config for provider: ", this.betProvider.name);
            return getBetProviderConfigResult;
        }

        const getPostgresDbResult = await PostgresDataSourceSingleton.getInstance(getConfig());
        if (getPostgresDbResult.result === "error") {
            logger.error(`Events processor failed to get postgres connection for provider ${this.betProvider.name} error: `, getPostgresDbResult.value.message);
            return getPostgresDbResult;
        }

        const getRedisSubscriberResult = await RedisSingleton.getSubscriber();
        if (getRedisSubscriberResult.result === "error") {
            logger.error("Events processor failed to connect to redis subscriber for provider: ", this.betProvider.name);
            return getRedisSubscriberResult;
        }

        const results = getBetProviderConfigResult.value.games.map(async game => {
            await getRedisSubscriberResult.value.subscribe(getRedisProcessedEventsChannelName(this.betProvider, game.name, game.betType), async message => {
                logger.trace("Listening for redis messages on channel: ", getRedisProcessedEventsChannelName(this.betProvider, game.name, game.betType));
                const parsedMessage = JSON.parse(message) as ProcessedGameEvents;

                const innerResults = parsedMessage.data.map(async item => {
                    switch (item.type) {
                        case BetTypes.TWO_WAY:
                            const twoWayGame = await getTwoWayGame(getPostgresDbResult.value, item.betProviderId, parsedMessage.betProviderName);
                            if (twoWayGame === null) {
                                await insertTwoWayGameEvent(getPostgresDbResult.value, {
                                    betProviderName: parsedMessage.betProviderName,
                                    betProviderId: item.betProviderId,
                                    clubA: item.clubA,
                                    clubB: item.clubB,
                                    oddsAWin: item.oddsAWin,
                                    oddsBWin: item.oddsBWin,
                                    gameName: parsedMessage.gameName,
                                    league: item.league,
                                    estimatedStartTimeUtc: item.estimatedStartTimeUtc,
                                    metaData: item.meta
                                });
                            } else {
                                logger.trace("Two way game already exists: ", twoWayGame);
                            }
                            break;
                        case BetTypes.THREE_WAY:
                            const threeWayGame = await getThreeWayGame(getPostgresDbResult.value, item.betProviderId, parsedMessage.betProviderName);
                            if (threeWayGame === null) {
                                await insertThreeWayGameEvent(getPostgresDbResult.value, {
                                    betProviderName: parsedMessage.betProviderName,
                                    betProviderId: item.betProviderId,
                                    clubA: item.clubA,
                                    clubB: item.clubB,
                                    oddsAWin: item.oddsAWin,
                                    oddsBWin: item.oddsBWin,
                                    oddsDraw: item.oddsDraw,
                                    gameName: parsedMessage.gameName,
                                    league: item.league,
                                    estimatedStartTimeUtc: item.estimatedStartTimeUtc,
                                    metaData: item.meta
                                });
                            } else {
                                logger.trace("Three way game already exists: ", threeWayGame);
                            }
                            break;
                        default:
                            const message = `Unknown bet type encountered when saving processed game events to database.`;
                            logger.error(message, item);
                            throw new Error(message);
                    }
                });
                await Promise.all(innerResults);
            });
        });
        await Promise.all(results);
        return {result: "success", value: true};
    }
}
