import {DataSource} from "typeorm";
import { ThreeWayGameEvent, TwoWayGameEvent } from "../../../utils/types/db";
import { ThreeWayGameEventEntity, TwoWayGameEventEntity } from "../entities";

export const insertTwoWayGameEvent = async (
    dataSource: DataSource,
    data: TwoWayGameEvent
) => {
    const toDataBase = {
        bet_provider_id: data.betProviderId,
        bet_provider_name: data.betProviderName,
        club_a: data.clubA,
        club_b: data.clubB,
        odds_a_win: data.oddsAWin,
        odds_b_win: data.oddsBWin,
        game_name: data.gameName
    };
    await dataSource.createQueryBuilder()
    .insert()
    .into(TwoWayGameEventEntity)
    .values(toDataBase)
    .execute();
};

export const insertThreeWayGameEvent = async (
    dataSource: DataSource,
    data: ThreeWayGameEvent
) => {
    const toDataBase = {
        bet_provider_id: data.betProviderId,
        bet_provider_name: data.betProviderName,
        club_a: data.clubA,
        club_b: data.clubB,
        odds_a_win: data.oddsAWin,
        odds_b_win: data.oddsBWin,
        game_name: data.gameName
    }
    await dataSource.createQueryBuilder()
    .insert()
    .into(ThreeWayGameEventEntity)
    .values(toDataBase)
    .execute();
};