import { BaseGameEventsProcessor } from "..";
import { getConfig } from "../../..";
import { BetProvider } from "../../../bet_providers";
import { BetikaProvider } from "../../../bet_providers/betika";
import { RedisSingleton } from "../../../datastores/redis";
import { getRedisProcessedEventsChannelName } from "../../../utils/redis";
import { ProcessedGameEvents } from "../../../utils/types/common";
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

        const getRedisSubscriberResult = await RedisSingleton.getSubscriber();
        if (getRedisSubscriberResult.result === "success") {
            const betProviderConfig = getBetProviderConfigResult.value;
            const results = betProviderConfig.games.map(async game => {
                await getRedisSubscriberResult.value.subscribe(getRedisProcessedEventsChannelName(this.betProvider, game.name, game.betType), message => {
                    const parsedMessage = JSON.parse(message) as ProcessedGameEvents;
                    logger.trace("redis subscriber message received. ", parsedMessage)
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