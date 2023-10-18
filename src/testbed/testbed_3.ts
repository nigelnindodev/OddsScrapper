import { BetikaGameEventsProcessor } from "../core/game_events/betika";

const gameEventsProcessor = new BetikaGameEventsProcessor();
gameEventsProcessor.subscribeToChannels();