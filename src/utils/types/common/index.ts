export enum BetProviders {
    BETIKA = "BETIKA",
    SPORTPESA = "SPORTPESA"
}

export enum Games {
    FOOTBALL = "Football",
    TENNIS_SINGLES = "Tennis Singles",
    TENNIS_DOUBLES = "Tennis Doubles"
}

export enum BetTypes {
    TWO_WAY = "Two Way", // win or loss
    THREE_WAY = "Three Way" // win, draw or loss
}

export interface BetProviderGameConfig {
    name: Games;
    betType: BetTypes;
    url: string;
}

export interface BetProviderConfig {
    version: string;
    games: BetProviderGameConfig[];
}

export interface SimpleWebPage {
    html: string;
    forUrl: string;
}

/**
 * Puppeteer defined policies for specifying when a page has been opened.
 * Use default LOAD policy if unsure of why you would need other policies.
 */
export enum PuppeteerPageLoadPolicy {
    LOAD = "load", // default policy, when load event is fired
    DOM_CONTENT_LOADED = "domcontentloaded",
    NETWORK_IDLE_0 = "networkidle0",
    NETWORK_IDLE_2 = "networkidle2"
}

export interface RawHtmlForProcessingMessage {
    betProviderName: BetProviders;
    betType: BetTypes;
    fromUrl: string;
    gameName: Games;
    rawHtml: string;
}

/**
 * Corresponds to moment.js timezones
 */
export enum TimeZones {
    UTC = "UTC",
    NAIROBI = "Africa/Nairobi"
}
