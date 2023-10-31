import { BetProvider } from ".";
import { BetProviders } from "../utils/types/common";

export class SportPesaProvider extends BetProvider {
    constructor() {
        super(BetProviders.SPORTPESA, "src/config/sportpesa.json");
    }
}
