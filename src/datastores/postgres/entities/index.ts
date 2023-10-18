import { Entity, Column, PrimaryGeneratedColumn, Index} from "typeorm";

/**
 * Table representing game events where there is no possibility of a draw.
 * A good example is tennis.
 */
@Entity({name: "two_way_game_event"})
export class TwoWayGameEventEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Index("two_way_game_event_provider_id_idx")
    @Column("string", {length: 100, nullable: false})
    bet_provider_id: string

    @Column("varchar", {length: 100, nullable: false})
    club_a: string

    @Column("varchar", {length: 100, nullable: false})
    club_b: string

    @Column("decimal", {nullable: false})
    odds_a_win: number

    @Column("decimal", {nullable: false})
    odds_b_win: number

    @Column("varchar", {length: 100, nullable: false})
    bet_provider_name: string

    @Column("varchar", {length: 100, nullable: false})
    game_name: string

    @Index("two_way_game_event_created_at_idx")
    @Column("timestamptz", {nullable: false, default: () => "CURRENT_TIMESTAMP"})
    created_at_utc: Date

    @Column("timestamptz", {nullable: false, default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP"})
    updated_at_utc: Date
}

/**
 * Table representing game events where the is possibility of a draw. A great
 * example is football.
 */
@Entity({name: "three_way_game_event"})
export class ThreeWayGameEventEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Index("three_way_game_event_provider_id_idx")
    @Column("string", {length: 100, nullable: false})
    bet_provider_id: string

    @Column("varchar", {length: 100, nullable: false})
    club_a: string

    @Column("varchar", {length: 100, nullable: false})
    club_b: string

    @Column("decimal", {nullable: false})
    odds_a_win: number

    @Column("decimal", {nullable: false})
    odds_b_win: number

    @Column("decimal", {nullable: false})
    odds_draw: number

    @Column("varchar", {length: 100, nullable: false})
    bet_provider: string

    @Column("varchar", {length: 100, nullable: false})
    game_name: string

    @Index("three_way_game_event_created_at_idx")
    @Column("timestamptz", {nullable: false, default: () => "CURRENT_TIMESTAMP"})
    created_at_utc: Date

    @Column("timestamptz", {nullable: false, default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP"})
    updated_at_utc: Date
}