import { BetProvider } from ".";
import { BetProviders } from "../utils/types/common";

export class OrbitProvider extends BetProvider {
    constructor() {
        super(BetProviders.ORBIT, "src/config/orbit.json");
    }
}
