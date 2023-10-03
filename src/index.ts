import * as path from "path";

import "dotenv/config";
import {ILogObj, Logger} from "tslog";

/**
 * Instantiate on logger so that we don't have to create a new logger every time getConfig is called.
 */
const logger: Logger<ILogObj> = new Logger({type: "pretty", name: "mainLogger"});

export interface Config {
    logger: Logger<ILogObj>,
    nodeEnv: string,
    postgresUser: string;
    postgresPassword: string;
    postgresHost: string;
    postgresPort: number;
    postgresDatabaseName: string;
    srcRoot: string;
}

export function getConfig(): Config {
    return {
        logger: logger,
        nodeEnv: process.env.NODE_ENV || "local",
        srcRoot: path.resolve(__dirname),
        postgresUser: process.env.POSTGRES_USER || "",
        postgresPassword: process.env.POSTGRES_PASSWORD || "",
        postgresHost: process.env.POSTGRES_HOST || "",
        postgresPort: Number(process.env.POSTGRES_PORT) || 5432,
        postgresDatabaseName: process.env.POSTGRES_DATABASE_NAME || ""
    };
}