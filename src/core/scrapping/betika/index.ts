import { BaseScrapper } from "..";
import { BetProvider } from "../../../bet_providers";
import { BetikaProvider } from "../../../bet_providers/betika";

export class BetikaScrapper extends BaseScrapper {
    override getBetProvider(): BetProvider {
        return new BetikaProvider();
    }
}
