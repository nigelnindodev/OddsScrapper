import { BetProviders, Games } from "../types/common";
import { BetProvider } from ".";

export class BetikaProvider extends BetProvider {
    constructor() {
        super(BetProviders.BETIKA, "src/config/betika.json");
    }

    override getSupportedGames(): Games[] {
        return [
            Games.TENNIS_SINGLES
        ];
    }
}
