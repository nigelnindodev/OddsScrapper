import { setTimeout } from "timers/promises";

import * as puppeteer from 'puppeteer';

import { Result } from '../../../utils/types/result_type';
import { getConfig } from '../../..';
import { PuppeteerPageLoadPolicy, SimpleWebPage } from '../../../utils/types/common';

const { logger } = getConfig();

/**
 * Function uses an already initialized browser instance to open a page given the url and returns the page's HTML contents.
 * Function is only meant for use where dynamic actions on the opened page are not required.
 * @param browser Instance of a Puppeteer browser.
 * @param url The webpage which we will be returning HTML for.
 * @param openingAction Optional function to run initially once the page is opened. Could be for example used for logging in or closing modals as examples.
 */
export async function getHtmlForPage(
    browser: puppeteer.Browser,
    url: string,
    waitUntilPolicy: PuppeteerPageLoadPolicy,
    //@ts-ignore
    openingAction?: (page: puppeteer.Page) => Promise<Result<boolean, Error>>
    ): Promise<Result<SimpleWebPage, Error>> {
    try {
        const page1 = await browser.newPage();
        await page1.goto(url, {waitUntil: waitUntilPolicy});
        await setTimeout(15000); // wait for some time before fetching content
        const html = await page1.content();
        await page1.close();
        return {result: "success", value: {html, forUrl: url}};
    } catch (e: any) {
        const message = `An exception occurred while fetching simple web page for url | ${url}`;
        logger.error(message, e.message);
        return {result: "error", value: new Error(e.message)};
    }
}
