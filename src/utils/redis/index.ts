import { BetProvider } from "../../bet_providers";
import { BetProviderGameConfig } from "../types/common";

/**
 * Generate the Redis pub/sub channel name for publishing raw HTML, and subscribers will parse the HTML into game events.
 * Instance of BetProvider and BetProviderGameConfig are passe din to ensure we have a valid provider and configuration when generating the name.
 * @param betProvider 
 * @param gameConfig 
 * @returns Channel name based on bet provider, game name and bet type. An example generated value is BETIKA_TennisSingles_TwoWay
 */
export function getRedisHtmlParserChannelName(betProvider: BetProvider, gameConfig: BetProviderGameConfig): string {
    return `${betProvider.name}_${gameConfig.name.replace(" ", "")}_${gameConfig.betType.replace(" ", "")}`;
}

export function getRedisEventsChannelName(betProvider: BetProvider, gameConfig: BetProviderGameConfig): string {
    return `event:${betProvider.name}_${gameConfig.name.replace(" ", "")}_${gameConfig.betType.replace(" ", "")}`;
}
