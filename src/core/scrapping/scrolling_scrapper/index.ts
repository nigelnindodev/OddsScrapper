import { setTimeout, setInterval } from "timers/promises";

import * as puppeteer from 'puppeteer';

import { PuppeteerPageLoadPolicy, SimpleWebPage } from '../../../utils/types/common';
import { Result } from '../../../utils/types/result_type';
import { getConfig } from '../../..';

const {logger} = getConfig();

export async function getHtmlForScrollingPage(
    browser: puppeteer.Browser,
    url: string,
    waitUntilPolicy: PuppeteerPageLoadPolicy,
    scrollingElementSelector: string,
    delayBeforeNextScrollAttemptMillis: number,
    numScrollAttempts: number,
    scrollDelta: number
): Promise<Result<SimpleWebPage, Error>> {
    try {
        const page1 = await browser.newPage();
        await page1.setViewport({width: 1280, height: 720});
        await page1.goto(url, {waitUntil: waitUntilPolicy});
        await setTimeout(15000);
        await getScrollContent(page1, scrollingElementSelector, delayBeforeNextScrollAttemptMillis, numScrollAttempts, scrollDelta);
        const html = await page1.content();
        return {result: "success", value: {html, forUrl: url}};
    } catch (e: any) {
        const message = `An exception occurred while fetching data from scrolling page for url | ${url}`;
        logger.error(message, e.message);
        return {result: "error", value: new Error(e.message)};
    }
}

/**
 * TODO: Move selector code to individual provider, but keep scroll behavior same across the board.
 * @param page 
 */
async function getScrollContent(
    page: puppeteer.Page,
    scrollingElementSelector: string,
    delayBeforeNextScrollAttemptMillis: number,
    numScrollAttempts: number,
    scrollDelta: number): Promise<boolean> {
    logger.trace("Running scroll down function");
    const section = await page.$(scrollingElementSelector); // find containing body of the content. In this case it's a <div class="biab_body contentWrap">
    if (section !== null) {
        logger.info("Found scroll section");
        let counter = 1;

        for await (const value of setInterval(delayBeforeNextScrollAttemptMillis, numScrollAttempts)) {
            if (counter > value) {
                break; // stop scrolling for new data
            } else {
                const boundingBox = await getBoundingBox(section);
                scrollDown(page, boundingBox, scrollDelta);
                counter = counter + 1;
            }
        }
        return true;
    } else {
        logger.error("Failed to find scroll section.");
        return false;
    }
}

/**
 * Get the bounding box for the element to be scrolled.
 * @param elementHandle
 * @returns 
 */
async function getBoundingBox(elementHandle: puppeteer.ElementHandle): Promise<puppeteer.BoundingBox> {
    const boundingBox = await elementHandle.boundingBox();
    if (boundingBox !== null) {
        logger.trace(boundingBox);
        return boundingBox;
    } else {
        throw new Error("Failed to find bounding box for provided element");
    }
}

async function scrollDown(page: puppeteer.Page, boundingBox: puppeteer.BoundingBox, scrollDelta: number): Promise<void> {
    // move mouse to the center of the element to be scrolled
    page.mouse.move(
        boundingBox.x + boundingBox.width / 2,
        boundingBox.y + boundingBox.height / 2
    );

    // use the mouse scroll wheel to to scroll. Change scroll down delta according to your needs.
    await page.mouse.wheel({deltaY: scrollDelta});
}
