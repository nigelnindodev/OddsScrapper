import { BaseGameEventsProcessor } from "..";
import { BetProvider } from "../../../bet_providers";
import { OrbitProvider } from "../../../bet_providers/orbit";

export class OrbitGameEventsProcessor extends BaseGameEventsProcessor {
    public override betProvider: BetProvider;

    constructor() {
        super();
        this.betProvider = new OrbitProvider();
    }
}
