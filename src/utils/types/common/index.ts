export enum BetProviders {
    BETIKA = "BETIKA",
    SPORTPESA = "SPORTPESA",
    ORBIT = "ORBIT"
}

export enum Games {
    BASKETBALL = "BasketBall",
    FOOTBALL = "Football",
    TENNIS_SINGLES = "Tennis",
    CRICKET = "Cricket"
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

export interface ProcessedHtmlMessage {
    value: any[]
}

export interface BaseProcessedGameEvent {
    betProviderId: string;
    clubA: string,
    clubB: string,
    estimatedStartTimeUtc: Date,
    league: string
    meta: any // Store any additional metadata about a specific provider you would want here
}

export interface ProcessedTwoWayGameEvent extends BaseProcessedGameEvent {
    type: BetTypes.TWO_WAY;
    oddsAWin: number;
    oddsBWin: number;
}

export interface ProcessedThreeWayGameEvent extends BaseProcessedGameEvent {
    type: BetTypes.THREE_WAY;
    oddsAWin: number;
    oddsBWin: number;
    oddsDraw: number;
}

export interface ProcessedGameEvents {
    betProviderName: BetProviders;
    betType: BetTypes;
    gameName: Games;
    data: ProcessedTwoWayGameEvent[] | ProcessedThreeWayGameEvent[];
} 

/**
 * Corresponds to moment.js timezones
 */
export enum TimeZones {
    UTC = "UTC",
    NAIROBI = "Africa/Nairobi"
}

// TODO: Work on adding this in the future
export enum GameStatus {

}
