import moment from "moment";

import { DataSource, InsertResult, UpdateResult } from "typeorm";
import { BetProviders } from "../../../../utils/types/common";
import { DbThreeWayGameEvent } from "../../../../utils/types/db";
import { ThreeWayGameEventEntity } from "../../entities";
import { getConfig } from "../../../..";

const {logger} = getConfig();

/**
 * Useful for checking whether a three way game event already exists for a provider.
 * It can then either be created if not exists, updated if the odds have changed, or ignored if no changes.
 * @param dataSource
 * @param betProviderId 
 * @param betProviderName 
 * @returns 
 */
export const getThreeWayGame = async (
    dataSource: DataSource,
    betProviderId: string,
    betProviderName: BetProviders
): Promise<ThreeWayGameEventEntity | null> => {
    return await dataSource.createQueryBuilder()
    .select("three_way_game_event")
    .from(ThreeWayGameEventEntity, "three_way_game_event")
    .where("bet_provider_id = :betProviderId", {betProviderId: betProviderId})
    .andWhere("bet_provider_name = :betProviderName", {betProviderName})
    .getOne();
};

/**
 * Fetches games where have true probabilities. Current fetched from Orbit bet provider.
 * Plans to add Pinnacle sports later.
 * @param dataSource 
 * @returns 
 */
export const getAnalyzableThreeWayGames = async (
    dataSource: DataSource
): Promise<ThreeWayGameEventEntity[]> => {
    const currentDate = moment().format();
    return await dataSource.createQueryBuilder()
    .select("three_way_game_event")
    .from(ThreeWayGameEventEntity, "three_way_game_event")
    .where("estimated_start_time_utc > :currentDate", {currentDate: currentDate})
    .where("bet_provider_name = :betProviderName", {betProviderName: BetProviders.ORBIT})
    .getMany();
};

/**
 * Fetch game events that are similar to selected game event from provider.
 * Excludes the same event from provider being picked.
 * Returns null if there are no other matching events found.
 * Adding null here to make it explicit that th no values can be expected.
 * @param dataSource 
 * @param event 
 * @returns 
 */
export const getMatchingThreeWayGameEventsTrigram = async (
    dataSource: DataSource,
    event: ThreeWayGameEventEntity
): Promise<ThreeWayGameEventEntity[] | null> => {
    //@ts-ignore
    const currentDate = moment().format();

    const results = await dataSource.createQueryBuilder()
    .select("three_way_game_event")
    .from(ThreeWayGameEventEntity, "three_way_game_event")
    //.where("estimated_start_time_utc > :currentDate", {currentDate: currentDate}) TODO: Add before final commit
    .where("bet_provider_name != :betProviderName", {betProviderName: event.bet_provider_name})
    .andWhere("similarity(club_a, :clubAName) > 0.2", {clubAName: event.club_a})
    .andWhere("similarity(club_b, :clubBName) > 0.2", {clubBName: event.club_b})
    .getMany();

    logger.trace("clubA: ", event.club_a);
    logger.trace("clubB: ", event.club_b);

    if (results.length === 0) {
        return null;
    } else {
        return results;
    }
};

export const insertThreeWayGameEvent = async (
    dataSource: DataSource,
    data: DbThreeWayGameEvent
): Promise<InsertResult> => {
    logger.trace("Inserting into database: ", data);
    return await dataSource.createQueryBuilder()
    .insert()
    .into(ThreeWayGameEventEntity)
    .values({
        bet_provider_id: data.betProviderId,
        bet_provider_name: data.betProviderName,
        club_a: data.clubA,
        club_b: data.clubB,
        odds_a_win: data.oddsAWin,
        odds_b_win: data.oddsBWin,
        odds_draw: data.oddsDraw,
        game_name: data.gameName,
        league: data.league,
        estimated_start_time_utc: data.estimatedStartTimeUtc,
        meta_data: data.metaData
    })
    .execute();
};

export const updateThreeWayGameEventOdds = async (
    dataSource: DataSource,
    betProviderId: string,
    betProviderName: BetProviders,
    oddsAWin: number,
    oddsBWin: number,
    oddsDraw: number
): Promise<UpdateResult> => {
    return await dataSource.createQueryBuilder()
    .update(ThreeWayGameEventEntity)
    .set({
        odds_a_win: oddsAWin,
        odds_b_win: oddsBWin,
        odds_draw: oddsDraw
    })
    .where("bet_provider_id = :betProviderId", {betProviderId: betProviderId})
    .andWhere("bet_provider_name = :betProviderName", {betProviderName})
    .execute();
};
