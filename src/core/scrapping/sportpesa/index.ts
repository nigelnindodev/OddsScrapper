import { BaseScrapper } from "..";
import { BetProvider } from "../../../bet_providers";
import { SportPesaProvider } from "../../../bet_providers/sportpesa";

export class SportPesaScrapper extends BaseScrapper {
    override betProvider: BetProvider;
    
    constructor() {
        super();
        this.betProvider = new SportPesaProvider();
    }
}