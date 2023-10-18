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
