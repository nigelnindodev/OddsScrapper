import { BetProvider } from ".";
import { BetProviders, Games } from "../utils/types/common";

export class OrbitProvider extends BetProvider {
    constructor() {
        super(BetProviders.ORBIT, "src/config/orbit.json");
    }

    override getSupportedGames(): Games[] {
        return [
            Games.FOOTBALL
        ]
    }
}
