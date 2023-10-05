import * as puppeteer from 'puppeteer';

import { Result } from '../../../utils/types/result_type';
import { getConfig } from '../../..';
import { SimpleWebPage } from '../../../utils/types/common';

const { logger } = getConfig();

/**
 * Function uses an already initialized browser instance to open a page given the url and returns the page's HTML contents.
 * Function is only meant for use where dynamic actions on the opened page are not required.
 * @param url The webpage which we will be returning HTML for.
 */
export async function getHtmlForPage(browser: puppeteer.Browser, url: string): Promise<Result<SimpleWebPage, Error>> {
    try {
        const page1 = await browser.newPage();
        await page1.goto(url);
        const html = await page1.content();
        await browser.close();
        return {result: "success", value: {html, forUrl: url}};
    } catch (e: any) {
        const message = `An exception occurred while fetching simple web page for url | ${url}`
        logger.error(message);
        return {result: "error", value: new Error(e.message)};
    }
}
