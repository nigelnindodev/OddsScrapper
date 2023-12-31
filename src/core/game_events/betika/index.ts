import { BaseGameEventsProcessor } from "..";
import { BetProvider } from "../../../bet_providers";
import { BetikaProvider } from "../../../bet_providers/betika";

export class BetikaGameEventsProcessor extends BaseGameEventsProcessor {
    public override betProvider: BetProvider;

    constructor() {
        super();
        this.betProvider = new BetikaProvider();
    }
}