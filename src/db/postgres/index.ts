import { DataSource } from "typeorm";

import { Config, getConfig } from "../../index";
import { Result } from "../../utils/result_type/index";

const {logger} = getConfig();

export class PostgresDataSourceSingleton {
    private static dataSource: DataSource
    private constructor() {}

    public static async getInstance(config: Config): Promise<Result<DataSource, Error>> {
        logger.trace("Opening Postgres TypeORM data source");
        if (!PostgresDataSourceSingleton.dataSource) {
            const candidateDataSource = new DataSource({
                type: "postgres",
                host: config.postgresHost,
                port: config.postgresPort,
                username: config.postgresUser,
                password: config.postgresPassword,
                database: config.postgresDatabaseName,
                synchronize: false,
                logging: false, // TODO: maybe create a different logging structure for database logs?
                extra: {
                    sss: true
                },
                entities: [
                    
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
