import { BetProviders, Games } from "../types/common";
import { BetProvider } from ".";

export class BetikaProvider extends BetProvider {
    constructor() {
        super(BetProviders.BETIKA);
    }

    override getSupportedGames(): Games[] {
        return [
            Games.TENNIS_SINGLES
        ];
    }
}
