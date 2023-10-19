import { BaseParser } from "..";
import { getConfig } from "../../..";
import { BetProvider } from "../../../bet_providers";
import { OrbitProvider } from "../../../bet_providers/orbit";
import { RedisSingleton } from "../../../datastores/redis";
import { getRedisHtmlParserChannelName, getRedisProcessedEventsChannelName } from "../../../utils/redis";
import { BetTypes, ProcessedThreeWayGameEvent, ProcessedTwoWayGameEvent, RawHtmlForProcessingMessage } from "../../../utils/types/common";
import { Result } from "../../../utils/types/result_type";
import { processOrbitGamesHtml } from "./parser_types";

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

            betProviderConfig.games.forEach(async game => {
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

            return {result: "success", value: true};
        } else {
            logger.error("HTML parser failed to connect to redis subscriber for bet provider: ", this.betProvider.name);
            return getRedisSubscriberResult;
        }
    }

    private async processRawHtmlMessage(parsedMessage: RawHtmlForProcessingMessage): Promise<void> {
        let results2;
        let parsedResults: Array<ProcessedTwoWayGameEvent|null> | Array<ProcessedThreeWayGameEvent|null>;
        switch (parsedMessage.betType) {
            case BetTypes.TWO_WAY:
                results2 = processOrbitGamesHtml(parsedMessage.rawHtml);
                if (results2.result === "success") {
                    parsedResults = results2.value.map(item => {
                        if (item.oddsArray.length !== 4) {
                            logger.warn("Skipping two way game event as odds do not total to 4: ", item);
                            return null;
                        }
                        return {
                            type: BetTypes.TWO_WAY,
                            betProviderId: `${item.clubA}_${item.clubB}_${item.eventDate}`, // TODO: create id creator on specific betProvider class
                            clubA: item.clubA,
                            clubB: item.clubB,
                            oddsAWin: (item.oddsArray[0] + item.oddsArray[1]) / 2,
                            oddsBWin: (item.oddsArray[2] + item.oddsArray[3]) / 2,
                            league: "N/A",
                            estimatedStartTimeUtc: item.estimatedStartTimeUtc,
                            meta: JSON.stringify({
                                oddsArray: item.oddsArray,
                                numBets: item.numBets
                            })
                        };
                    });
                } else {
                    throw new Error("Failed to process Orbit two way games html");
                }
                break;
            case BetTypes.THREE_WAY:
                // Thinking that the parser should also work for two way games
                results2 = processOrbitGamesHtml(parsedMessage.rawHtml);
                if (results2.result === "success") {
                    parsedResults = results2.value.map(item => {
                        if (item.oddsArray.length !== 6) {
                            logger.warn("Skipping three way game event as odds do not total to 6: ", item);
                            return null;
                        }
                        return {
                            type: BetTypes.THREE_WAY,
                            betProviderId: `${item.clubA}_${item.clubB}_${item.eventDate}`,
                            clubA: item.clubA,
                            clubB: item.clubB,
                            oddsAWin: (item.oddsArray[0] + item.oddsArray[1]) / 2,
                            oddsBWin:(item.oddsArray[4] + item.oddsArray[5]) / 2,
                            oddsDraw: (item.oddsArray[2] + item.oddsArray[3]) / 2,
                            league: "N/A",
                            estimatedStartTimeUtc: item.estimatedStartTimeUtc,
                            meta: JSON.stringify({
                                oddsArray: item.oddsArray,
                                numBets: item.numBets
                            })
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

        // https://stackoverflow.com/a/43130250/22694455
        const finalResults: ProcessedTwoWayGameEvent[] | ProcessedThreeWayGameEvent[] = parsedResults.filter(result => {
            return result !== null;
        }) as ProcessedTwoWayGameEvent[] | ProcessedThreeWayGameEvent[];


        if (getRedisPublisherResult.result === "success") {
            this.publishProcessedGameEvents(
                getRedisPublisherResult.value,
                getRedisProcessedEventsChannelName(this.betProvider, parsedMessage.gameName, parsedMessage.betType),
                {
                    betProviderName: parsedMessage.betProviderName,
                    betType: parsedMessage.betType,
                    gameName: parsedMessage.gameName,
                    data: finalResults
                }
            );
            logger.trace("Published messages to redis on channel: ", getRedisProcessedEventsChannelName(this.betProvider, parsedMessage.gameName, parsedMessage.betType));
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
