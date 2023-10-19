import { BaseParser } from "..";
import { getConfig } from "../../..";
import { BetProvider } from "../../../bet_providers";
import { OrbitProvider } from "../../../bet_providers/orbit";
import { RedisSingleton } from "../../../datastores/redis";
import { getRedisHtmlParserChannelName, getRedisProcessedEventsChannelName } from "../../../utils/redis";
import { BetTypes, ProcessedThreeWayGameEvent, ProcessedTwoWayGameEvent, RawHtmlForProcessingMessage } from "../../../utils/types/common";
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

    private async processRawHtmlMessage(parsedMessage: RawHtmlForProcessingMessage): Promise<void> {
        let results2;
        let parsedResults: ProcessedTwoWayGameEvent[] | ProcessedThreeWayGameEvent[];
        switch (parsedMessage.betType) {
            case BetTypes.THREE_WAY:
                results2 = processOrbitThreeWayGamesHtml(parsedMessage.rawHtml);
                if (results2.result === "success") {
                    parsedResults = results2.value.map(item => {
                        return {
                            type: BetTypes.TWO_WAY,
                            betProviderId: `${item.clubA}_${item.clubB}_${item.eventDate}`, // TODO: create id creator on specific betProvider class
                            clubA: item.clubA,
                            clubB: item.clubB,
                            oddsAWin: item.oddsAWin,
                            oddsBWin: item.oddsBWin,
                            league: "N/A",
                            estimatedStartTimeUtc: item.estimatedStartTimeUtc,
                            meta: JSON.stringify({})
                        };
                    });
                } else {
                    throw new Error("Failed to process Orbit two way games html");
                }
                break;
            case BetTypes.TWO_WAY:
                // Thinking that the parser should also work for two way games
                results2 = processOrbitThreeWayGamesHtml(parsedMessage.rawHtml);
                if (results2.result === "success") {
                    parsedResults = results2.value.map(item => {
                        return {
                            type: BetTypes.THREE_WAY,
                            betProviderId: `${item.clubA}_${item.clubB}_${item.eventDate}`,
                            clubA: item.clubA,
                            clubB: item.clubB,
                            oddsAWin: item.oddsAWin,
                            oddsBWin: item.oddsBWin,
                            oddsDraw: item.oddsDraw,
                            league: "N/A",
                            estimatedStartTimeUtc: item.estimatedStartTimeUtc,
                            meta: JSON.stringify({})
                        }
                    });
                } else {
                    throw new Error("Failed to process Orbit three way games html");
                }
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

        logger.info("Successfully fetched games", results2.value);
        const getRedisPublisherResult = await RedisSingleton.getPublisher();

        if (getRedisPublisherResult.result === "success") {
            this.publishProcessedGameEvents(
                getRedisPublisherResult.value,
                getRedisProcessedEventsChannelName(this.betProvider, parsedMessage.gameName, parsedMessage.betType),
                {
                    betProviderName: parsedMessage.betProviderName,
                    betType: parsedMessage.betType,
                    gameName: parsedMessage.gameName,
                    data: parsedResults
                }
            );
        } else {
            const message = "Failed to get redis publisher to send processed events: ";
            logger.error(message, {
                betProviderName: parsedMessage.betProviderName,
                betType: parsedMessage.betType,
                fromUrl: parsedMessage.fromUrl,
                gameName: parsedMessage.gameName,
                errorMessage: getRedisPublisherResult.value.message
            });
        }
    }
}
