import {createClient} from "redis";
import type {RedisClientType} from "redis";

import { getConfig } from "../../index";
import { Result } from "../../utils/types/result_type/index";

const {logger} = getConfig();

/**
 * Not that all connections currently assume localhost connection.
 * May need to be changed later to also add support for remote redis connections.
 */
export class RedisSingleton {
    private static subscriber: RedisClientType;
    private static publisher: RedisClientType;
    private constructor() {}

    public static async getSubscriber(): Promise<Result<RedisClientType,Error>> {
        try {
            if (!RedisSingleton.subscriber) {
                RedisSingleton.subscriber = createClient();
                await RedisSingleton.subscriber.connect();
                logger.info("[REDIS]: Successfully connected to redis subscriber");
                return {result: "success", value: RedisSingleton.subscriber};
            } else {
                logger.info("[REDIS]: returning existing subscriber");
                return {result: "success", value: RedisSingleton.subscriber};
            }
        } catch(e: any) {
            const message = "[REDIS]: An exception occurred while connecting to redis subscriber";
            logger.error(message, e.message);
            return {result: "error", value: Error(message)};
        }
    }

    public static async getPublisher(): Promise<Result<RedisClientType, Error>> {
        try {
            if (!RedisSingleton.publisher) {
                RedisSingleton.publisher = createClient();
                await RedisSingleton.publisher.connect();
                logger.info("[REDIS]: Successfully connected to redis publisher");
                return {result: "success", value: RedisSingleton.publisher};
            } else {
                logger.info("[REDIS]: returning existing publisher");
                return {result: "success", value: RedisSingleton.publisher};
            }
        } catch(e: any) {
            const message = "[REDIS]: An exception occurred while connecting to redis publisher";
            logger.error(message, e.message);
            return {result: "error", value: Error(message)};
        }
    }
}
