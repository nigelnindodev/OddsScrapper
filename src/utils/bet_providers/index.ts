import { BetProviders, Games } from "../types/common";

export abstract class BetProvider {
    protected readonly name: BetProviders;

    abstract getSupportedGames(): Games[]

    constructor(name: BetProviders) {
        this.name = name;
    }
}
