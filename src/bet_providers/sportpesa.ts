import { BetProvider } from ".";
import { BetProviders, Games } from "../utils/types/common";

export class SportPesaProvider extends BetProvider {
    constructor() {
        super(BetProviders.SPORTPESA, "src/config/sportpesa.json");
    }

    override getSupportedGames(): Games[] {
        return [
            Games.FOOTBALL
        ];
    }
}
