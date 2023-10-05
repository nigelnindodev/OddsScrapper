import * as puppeteer from 'puppeteer';
import { BetProvider } from '../../bet_providers';

export abstract class BaseScrapper {
    abstract getBetProvider(): BetProvider;
    /**
     * Each provider currently uses it's own chrome browser instance for scrapping.
     * Use this function to get the handle to the browser instance.
     * TODO: Potential for opening multiple browser instances as implemented. Maybe in the future make this a singleton?
     */
    public async initializeBrowserInstance(): Promise<puppeteer.Browser> {
        return await puppeteer.launch({headless: "new"});
    }
}
