import moment from "moment";

import { DataSource, InsertResult, UpdateResult } from "typeorm";
import { BetProviders } from "../../../../utils/types/common";
import { DbTwoWayGameEvent } from "../../../../utils/types/db";
import { TwoWayGameEventEntity } from "../../entities";
import { addStringQueryConditionals, getConfig, removeUnnecessaryClubTags } from "../../../..";

const {logger} = getConfig();

/**
 * Useful for checking whether a two way game event already exists for a provider.
 * It can then either be created if not exists, updated if the odds have changed, or ignored if no changes.
 * @param dataSource
 * @param betProviderId 
 * @param betProviderName 
 * @returns 
 */
export const getTwoWayGame = async (
    dataSource: DataSource,
    betProviderId: string,
    betProviderName: BetProviders
): Promise<TwoWayGameEventEntity | null> => {
    return await dataSource.createQueryBuilder()
    .select("two_way_game_event")
    .from(TwoWayGameEventEntity, "two_way_game_event")
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
export const getAnalyzableTwoWayGames = async (
    dataSource: DataSource
): Promise<TwoWayGameEventEntity[]> => {
    logger.trace("Fetching analyzable two way games.");
    const currentDate = moment().format();
    logger.trace("current date time: ", currentDate);
    return await dataSource.createQueryBuilder()
    .select("two_way_game_event")
    .from(TwoWayGameEventEntity, "two_way_game_event")
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
export const getMatchingTwoWayGameEventsTrigram = async (
    dataSource: DataSource,
    event: TwoWayGameEventEntity
): Promise<TwoWayGameEventEntity[] | null> => {
    //@ts-ignore
    const currentDate = moment().format();

    const results = await dataSource.createQueryBuilder()
    .select("two_way_game_event")
    .from(TwoWayGameEventEntity, "two_way_game_event")
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

/**
 * Fetch game events that are similar to selected game event from provider.
 * Excludes the same event from provider being picked.
 * Returns null if there are no other matching events found.
 * Adding null here to make it explicit that th no values can be expected.
 * @param dataSource 
 * @param event 
 */
export const getMatchingTwoWayEvents = async (
    dataSource: DataSource,
    event: TwoWayGameEventEntity
): Promise<TwoWayGameEventEntity[] | null> => {
    const currentDate = moment().format();
    const clubANames = removeUnnecessaryClubTags(event.club_a.split(" "));
    const clubBNames = removeUnnecessaryClubTags(event.club_b.split(" "));

    const preQuery = dataSource.createQueryBuilder()
    .select("two_way_game_event")
    .from(TwoWayGameEventEntity, "two_way_game_event")

    let results = await addStringQueryConditionals(
        [
            {columnName: "club_a", values: clubANames},
            {columnName: "club_b", values: clubBNames}
        ],
         preQuery
    )
    .andWhere("estimated_start_time_utc > :currentDate", {currentDate: currentDate})
    .andWhere("bet_provider_name != :betProviderName", {betProviderName: event.bet_provider_name})
    .getMany();

    /**
     * Really bad workaround that will have to fixed sooner rather than later.
     * For some yet to be determined reason, the filters added after `addStringQueryConditionals` do not work.
     * As a result:
     * - Stale games will be collected in the query results.
     * - Odds from the true odds provider will also be collected.
     * 
     * A workaround is to filter these values out via code. Ideally they should be filtered out at the DB stage.
     */
    results = results.filter(result => {
        if (result.estimated_start_time_utc < moment().toDate()) {
            return false;
        } else if (result.bet_provider_name === BetProviders.ORBIT) {
            return false;
        } else {
            return true;
        }
    });

    if (results.length === 0) {
        return null;
    } else {
        return results;
    }
};

export const insertTwoWayGameEvent = async (
    dataSource: DataSource,
    data: DbTwoWayGameEvent
): Promise<InsertResult> => {
    return await dataSource.createQueryBuilder()
    .insert()
    .into(TwoWayGameEventEntity)
    .values({
        bet_provider_id: data.betProviderId,
        bet_provider_name: data.betProviderName,
        club_a: data.clubA,
        club_b: data.clubB,
        odds_a_win: data.oddsAWin,
        odds_b_win: data.oddsBWin,
        game_name: data.gameName,
        league: data.league,
        estimated_start_time_utc: data.estimatedStartTimeUtc,
        meta_data: data.metaData
    })
    .execute();
};

export const updateTwoWayGameEventOdds = async (
    dataSource: DataSource,
    betProviderId: string,
    betProviderName: BetProviders,
    oddsAWin: number,
    oddsBWin: number
): Promise<UpdateResult> => {
    return await dataSource.createQueryBuilder()
    .update(TwoWayGameEventEntity)
    .set({
        odds_a_win: oddsAWin,
        odds_b_win: oddsBWin
    })
    .where("bet_provider_id = :betProviderId", {betProviderId: betProviderId})
    .andWhere("bet_provider_name = :betProviderName", {betProviderName})
    .execute();
};
