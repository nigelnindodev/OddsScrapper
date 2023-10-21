import { DataSource } from "typeorm";

import { Config, getConfig } from "../../index";
import { Result } from "../../utils/types/result_type/index";
import { ThreeWayGameEventEntity, TwoWayGameEventEntity } from "./entities";

const {logger} = getConfig();

export class PostgresDataSourceSingleton {
    private static dataSource: DataSource
    private constructor() {}

    public static async getInstance(config: Config): Promise<Result<DataSource, Error>> {
        if (!PostgresDataSourceSingleton.dataSource) {
            logger.info("Creating postgres data source");
            const candidateDataSource = new DataSource({
                type: "postgres",
                host: config.postgresHost,
                port: config.postgresPort,
                username: config.postgresUser,
                password: config.postgresPassword,
                database: config.postgresDatabaseName,
                synchronize: true,
                logging: false, // TODO: maybe create a different logging structure for database logs?
                extra: {
                    sss: true
                },
                entities: [
                    TwoWayGameEventEntity,
                    ThreeWayGameEventEntity
                ]
            });

            try {
                const result: DataSource = await candidateDataSource.initialize();
                if (result.isInitialized) {
                    logger.info("[POSTGRES]: Postgres data source connected successfully");
                    PostgresDataSourceSingleton.dataSource = result;
                    return {result: "success", value: PostgresDataSourceSingleton.dataSource};
                } else {
                    const message = `[POSTGRES]: Postgres not initialized`;
                    logger.error(message, result);
                    return {result: "error", value: Error(message)};
                }
            } catch(e: any) {
                const message = `[POSTGRES]: An exception occurred while initializing data source`;
                config.logger.error(message, e.message);
                return {result: "error", value: Error(message)};
            }
        } else {
            // data source already initialized. return it.
            return {result: "success", value: PostgresDataSourceSingleton.dataSource};
        }
    }
}
