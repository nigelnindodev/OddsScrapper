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
    name: BetProviders;
    betType: BetTypes;
    url: string;
}

export interface BetProviderConfig {
    version: string;
    games: BetProviderGameConfig[];
}
