import { BaseParser } from "..";
import { getConfig } from "../../..";
import { BetProvider } from "../../../bet_providers";
import { BetikaProvider } from "../../../bet_providers/betika";
import { RedisSingleton } from "../../../datastores/redis";
import { getRedisHtmlParserChannelName } from "../../../utils/redis";
import { BetTypes, RawHtmlForProcessingMessage } from "../../../utils/types/common";
import { Result } from "../../../utils/types/result_type";
import { processBetikaThreeWayGamesHtml, processBetikaTwoWayGamesHtml } from "./parser_types";

const {logger} = getConfig();

export class BetikaParser extends BaseParser {
    public override betProvider: BetProvider;

    constructor() {
        super();
        this.betProvider = new BetikaProvider();
    }

    public async subscribeToChannels(): Promise<Result<boolean, Error>> {
        const getBetProviderConfigResult = await this.betProvider.getConfig();
        if (getBetProviderConfigResult.result === "error") {
            logger.error("HTML parse failed to load config for provider: ", this.betProvider.name);
            return getBetProviderConfigResult;
        }

        const getRedisSubscriberResult = await RedisSingleton.getSubscriber();
        if (getRedisSubscriberResult.result === "success") {
            const betProviderConfig = getBetProviderConfigResult.value;

            const results = betProviderConfig.games.map(async game => {
                /**
                 * Maybe in the future make this more resilient and add better error handling?
                 * - Catch subscription failures
                 * - Instead of just returning true, return object containing info about channel name, and whether successfully subscribed or not.
                 */
                await getRedisSubscriberResult.value.subscribe(getRedisHtmlParserChannelName(this.betProvider, game), message => {
                    const parsedMessage = JSON.parse(message) as RawHtmlForProcessingMessage;
                    logger.trace("Redis subscriber message received.", {
                        betProviderName: parsedMessage.betProviderName,
                        betType: parsedMessage.betType,
                        fromUrl: parsedMessage.fromUrl,
                        gameName: parsedMessage.gameName
                    });
                    this.processRawHtmlMessage(parsedMessage);
                });
                
                return true;
            });

            await Promise.all(results);
            return {result: "success", value: true};
        } else {
            logger.error("HTML parser failed to connect to redis subscriber for bet provider: ", this.betProvider.name);
            return getRedisSubscriberResult;
        }
    }

    private processRawHtmlMessage(parsedMessage: RawHtmlForProcessingMessage): void {
        let results2;
        switch (parsedMessage.betType) {
            case BetTypes.TWO_WAY:
                results2 = processBetikaTwoWayGamesHtml(parsedMessage.rawHtml);
                break;
            case BetTypes.THREE_WAY:
                results2 = processBetikaThreeWayGamesHtml(parsedMessage.rawHtml);
                break;
            default:
                const message = "Unknown bet type provided";
                logger.error(message, {
                    betProviderName: parsedMessage.betProviderName,
                    betType: parsedMessage.betType,
                    fromUrl: parsedMessage.fromUrl,
                    gameName: parsedMessage.gameName
                });
                throw new Error(`Unknown bet type provided for provider: ${this.betProvider.name}`);
        }

        if (results2.result == "success") {
            logger.info("Successfully fetched games: ", results2.value);
        } else {
            logger.error("Failed to parse html into games: ", {
                betProviderName: parsedMessage.betProviderName,
                betType: parsedMessage.betType,
                fromUrl: parsedMessage.fromUrl,
                gameName: parsedMessage.gameName,
                errorMessage: results2.value.message
            });
        }
    }
}