import { setTimeout } from "timers/promises";

import * as puppeteer from 'puppeteer';

import { BetProvider } from '../../bet_providers';

export abstract class BaseScrapper {
    public abstract betProvider: BetProvider;

    /**
     * Each provider currently uses it's own chrome browser instance for scrapping.
     * Use this function to get the handle to the browser instance.
     * TODO: Potential for opening multiple browser instances as implemented. Maybe in the future make this a singleton?
     */
    public async initializeBrowserInstance(): Promise<puppeteer.Browser> {
        const browser = await puppeteer.launch({headless: false});

        // let's set a 15 second timeout for the browser to properly boot up.
        await setTimeout(10000);

        return browser;
    }
}
