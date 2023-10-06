import { setTimeout } from "timers/promises";

import * as puppeteer from 'puppeteer';
import type {RedisClientType} from "redis";

import { BetProvider } from '../../bet_providers';
import { RawHtmlForProcessingMessage } from "../../utils/types/common";

export abstract class BaseScrapper {
    public abstract betProvider: BetProvider;
    public abstract scrapeIntervalDuration: number; // how long to wait before scrapping the next avialable information

    /**
     * Each provider currently uses it's own chrome browser instance for scrapping.
     * Use this function to get the handle to the browser instance.
     * TODO: Potential for opening multiple browser instances as implemented. Maybe in the future make this a singleton?
     */
    public async initializeBrowserInstance(): Promise<puppeteer.Browser> {
        const browser = await puppeteer.launch({headless: false});

        // Give some time for the browser to fully finish loading.
        await setTimeout(5000); // 5 seconds

        return browser;
    }

    /**
     * Called by sub classes to publish data to redis. Implemented here to ensure sub classes
     * confirm to using the standardized specification.
     */
    protected async publishRawHtmlToRedis(
        redisPublisher: RedisClientType,
        channelName: string,
        data: RawHtmlForProcessingMessage
    ): Promise<void> {
        await redisPublisher.publish(channelName, JSON.stringify(data));
    }
}
