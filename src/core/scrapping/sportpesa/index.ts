import { BaseScrapper } from "..";
import { BetProvider } from "../../../bet_providers";
import { SportPesaProvider } from "../../../bet_providers/sportpesa";

export class SportPesaScrapper extends BaseScrapper {
    public override betProvider: BetProvider;
    public override scrapeIntervalDuration: number;
    
    constructor() {
        super();
        this.betProvider = new SportPesaProvider();
        this.scrapeIntervalDuration = 10000;
    }
}