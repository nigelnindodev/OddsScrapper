import { RedisClientType } from "redis";
import { BetProvider } from "../../bet_providers";
import { ProcessedGameEvents } from "../../utils/types/common";

export abstract class BaseParser {
    public abstract betProvider: BetProvider;

    protected async publishProcessedGameEvents(
        redisPublisher: RedisClientType,
        channelName: string,
        data: ProcessedGameEvents
    ) {
        await redisPublisher.publish(channelName, JSON.stringify(data));
    }
}
