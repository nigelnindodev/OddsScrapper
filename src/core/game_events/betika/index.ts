import { BaseGameEventsProcessor } from "..";
import { getConfig } from "../../..";
import { BetProvider } from "../../../bet_providers";
import { BetikaProvider } from "../../../bet_providers/betika";
import { PostgresDataSourceSingleton } from "../../../datastores/postgres";
import { insertThreeWayGameEvent } from "../../../datastores/postgres/queries/three_way_game_event";
import { insertTwoWayGameEvent } from "../../../datastores/postgres/queries/two_way_game_event";
import { RedisSingleton } from "../../../datastores/redis";
import { getRedisProcessedEventsChannelName } from "../../../utils/redis";
import { BetTypes, ProcessedGameEvents } from "../../../utils/types/common";
import { DbThreeWayGameEvent, DbTwoWayGameEvent } from "../../../utils/types/db";
import { Result } from "../../../utils/types/result_type";

const {logger} = getConfig();

export class BetikaGameEventsProcessor extends BaseGameEventsProcessor {
    public override betProvider: BetProvider;

    constructor() {
        super();
        this.betProvider = new BetikaProvider();
    }

    public async subscribeToChannels(): Promise<Result<boolean, Error>> {
        const getBetProviderConfigResult = await this.betProvider.getConfig();
        if (getBetProviderConfigResult.result === "error") {
            logger.error("Events processor failed to load config for provider: ", this.betProvider.name);
            return getBetProviderConfigResult;
        }

        const getPostgresDbResult = await PostgresDataSourceSingleton.getInstance(getConfig());
        if (getPostgresDbResult.result === "error") {
            logger.error(`Events processor failed to get postgres connection for provider ${this.betProvider.name} with error: `,getPostgresDbResult.value.message);
            return getPostgresDbResult;
        }

        const getRedisSubscriberResult = await RedisSingleton.getSubscriber();
        if (getRedisSubscriberResult.result === "success") {
            const betProviderConfig = getBetProviderConfigResult.value;
            const results = betProviderConfig.games.map(async game => {
                await getRedisSubscriberResult.value.subscribe(getRedisProcessedEventsChannelName(this.betProvider, game.name, game.betType), async message => {
                    const parsedMessage = JSON.parse(message) as ProcessedGameEvents;

                    
                    /**
                     * TODO: Payload is really similar to DbTwoWayGameEvent / DbThreeWayGameEvent. Is there any way we can combine them?
                     * We are already using discriminated unions to correctly type case different game types.
                     */
                    const innerResults = parsedMessage.data.map(async item => {
                        /**
                         * TODO: Check if games exists before attempting insert. (We shouldn't get double inserts as now as well due to unique constraints on the database)
                         */
                        switch (item.type) {
                            case BetTypes.TWO_WAY:
                                const twoWayEventToDB: DbTwoWayGameEvent = {
                                    betProviderName: parsedMessage.betProviderName,
                                    betProviderId: item.betProviderId,
                                    clubA: item.clubA,
                                    clubB: item.clubB,
                                    oddsAWin: item.oddsAWin,
                                    oddsBWin: item.oddsBWin,
                                    gameName: parsedMessage.gameName,
                                    league: item.league,
                                    metaData: item.meta
                                }
                                await insertTwoWayGameEvent(getPostgresDbResult.value, twoWayEventToDB);
                                break;
                            case BetTypes.THREE_WAY:
                                const threeWayEventToDb: DbThreeWayGameEvent = {
                                    betProviderName: parsedMessage.betProviderName,
                                    betProviderId: item.betProviderId,
                                    clubA: item.clubA,
                                    clubB: item.clubB,
                                    oddsAWin: item.oddsAWin,
                                    oddsBWin: item.oddsBWin,
                                    oddsDraw: item.oddsDraw,
                                    gameName: parsedMessage.gameName,
                                    league: item.league,
                                    metaData: item.meta
                                }
                                await insertThreeWayGameEvent(getPostgresDbResult.value, threeWayEventToDb);
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
        } else {
            logger.error("Events processor failed to connect to redis subscriber for provider: ", this.betProvider.name);
            return getRedisSubscriberResult;
        }
    }
}