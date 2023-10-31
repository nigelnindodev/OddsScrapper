import { BetProvider } from ".";
import { BetProviders } from "../utils/types/common";

export class BetikaProvider extends BetProvider {
    constructor() {
        super(BetProviders.BETIKA, "src/config/betika.json");
    }
}
