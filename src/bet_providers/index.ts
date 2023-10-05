import { getConfig } from "..";
import { readFileAsync } from "../utils/file_system";
import { BetProviderConfig, BetProviderGameConfig, BetProviders, Games } from "../utils/types/common";
import { Result } from "../utils/types/result_type";

const {logger} = getConfig();

export abstract class BetProvider {
    public readonly name: BetProviders;
    private readonly configPath: string; // config path from project root

    constructor(name: BetProviders, configPath: string) {
        this.name = name;
        this.configPath = configPath;
    }

    abstract getSupportedGames(): Games[]

    public async getConfig(): Promise<Result<BetProviderConfig, Error>> {
        const readFileResult = await readFileAsync(this.configPath);
        if (readFileResult.result === "success") {
            try {
                const betProviderGameConfig: BetProviderGameConfig[] = [];

                const jsonData = JSON.parse(readFileResult.value);
                const version: string = jsonData["version"];
                const games: any[] = jsonData["games"];

                games.forEach(game => {
                    betProviderGameConfig.push({
                        name: game.name,
                        betType: game.betType,
                        url: game.url
                    });
                });

                logger.trace(`${this.name} config parsed successfully`, betProviderGameConfig);

                return {
                    result: "success",
                    value: {
                        version,
                        games: betProviderGameConfig
                    }
                };
            } catch(e: any) {
                const message = `An error occurred while parsing configuration file for ${this.name} bet provider.`;
                logger.error(message, e.message);
                return {result: "error", value: Error(e.message)};
            }
        } else {
            return readFileResult;
        }
    }
}
