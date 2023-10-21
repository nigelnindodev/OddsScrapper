import * as path from "path";
import "reflect-metadata";
import "dotenv/config";
import {ILogObj, Logger} from "tslog";
import { ObjectLiteral, SelectQueryBuilder } from "typeorm";

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

/**
 * Extends typeorm functionality by allowing combination of "like" and "where ... in" query.
 * @param columnData 
 * @param queryBuilder 
 * @returns 
 */
export function addStringQueryConditionals<T extends ObjectLiteral>(columnData: {columnName: string, values: string[]}[], queryBuilder: SelectQueryBuilder<T>): SelectQueryBuilder<T> {
    if (columnData.length === 0) {
        throw new Error("Cannot add string query conditionals with empty column data");
    }
    columnData.forEach((column,index) => {
        column.values.forEach(value => {
            if (index === 0) {
                queryBuilder.andWhere(`${column.columnName} like :value`, {value: `%${value}%`});
            } else {
                queryBuilder.orWhere(`${column.columnName} like :value`, {value: `%${value}%`});
            }
        });
    });
    return queryBuilder;
};

/**
 * Remove unlikely unique modifiers from club names.
 * An example is 'Some Team FC' should return 'Some Team'
 * @param possibleTags
 */
export function removeUnnecessaryClubTags(possibleTags: string[]): string[] {
    /**
     * Will be updated over time to add explicit modifiers such as "FC" or "/" for doubles tennis matches.
     * For now will use strip out short identifiers (less than 2 chars)
     */
    const identifiers = possibleTags.filter(tag => {
        if (tag.length <= 2) {
            return false;
        } else {
            return true;
        }
    });
    /**
     * If we have stripped out all the identifiers in the fuzzy check,
     * return all original identifiers to be used to get a match.
     */
    if (identifiers.length === 0) {
        return possibleTags;
    } else {
        return identifiers;
    }
}

/**
 * Rounds a number to given decimal places according to the multiplier.
 * For example, a multiplier of 10 returns to 1 decimal place while 100 2 decimal places.
 * @param value 
 * @param multiplier 
 * @returns 
 */
export const roundNumber = (value: number, multiplier: number): number => {
    return Math.round((value + Number.EPSILON) * multiplier) / multiplier ;
};
