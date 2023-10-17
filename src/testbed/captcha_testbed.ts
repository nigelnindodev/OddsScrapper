import { setTimeout } from "timers/promises";

import * as puppeteer from 'puppeteer';
//const puppeteer = require('puppeteer-extra');

//const stealthPlugin = require('puppeteer-extra-plugin-stealth');
//puppeteer.use(stealthPlugin());


class CaptchaTestBed {
    private url: string;

    constructor() {
        this.url = "https://app.zenrows.com/register";
    }

    public async run() {
        try {
            const browser = await puppeteer.launch({headless: false});
            const page = await browser.newPage();
            await page.goto(this.url);
            await setTimeout(30000);
            const html = await page.content();
            console.log("Page content:")
            console.log(html);
        } catch (e: any) {
            console.error(e.message);
        }
    }
}

const captchaTestBed = new CaptchaTestBed();
captchaTestBed.run();