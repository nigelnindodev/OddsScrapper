import { DataSource, InsertResult, UpdateResult } from "typeorm";
import { BetProviders } from "../../../../utils/types/common";
import { TwoWayGameEvent } from "../../../../utils/types/db";
import { TwoWayGameEventEntity } from "../../entities";

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

export const insertTwoWayGameEvent = async (
    dataSource: DataSource,
    data: TwoWayGameEvent
): Promise<InsertResult> => {
    const toDataBase = {
        bet_provider_id: data.betProviderId,
        bet_provider_name: data.betProviderName,
        club_a: data.clubA,
        club_b: data.clubB,
        odds_a_win: data.oddsAWin,
        odds_b_win: data.oddsBWin,
        game_name: data.gameName
    };
    return await dataSource.createQueryBuilder()
    .insert()
    .into(TwoWayGameEventEntity)
    .values(toDataBase)
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
