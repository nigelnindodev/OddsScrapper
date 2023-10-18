import { BaseParser } from "..";
import { getConfig } from "../../..";
import { BetProvider } from "../../../bet_providers";
import { OrbitProvider } from "../../../bet_providers/orbit";
import { RedisSingleton } from "../../../datastores/redis";
import { getRedisHtmlParserChannelName } from "../../../utils/redis";
import { BetTypes, RawHtmlForProcessingMessage } from "../../../utils/types/common";
import { Result } from "../../../utils/types/result_type";
import { processOrbitThreeWayGamesHtml } from "./parser_types";

const {logger} = getConfig();

export class OrbitParser extends BaseParser {
    public override betProvider: BetProvider;

    constructor() {
        super();
        this.betProvider = new OrbitProvider();
    }

    // TODO: This function should be moved to the base class
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
            case BetTypes.THREE_WAY:
                results2 = processOrbitThreeWayGamesHtml(parsedMessage.rawHtml);
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

        if (results2.result === "success") {
            logger.info("Successfully fetched games", results2.value);
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
