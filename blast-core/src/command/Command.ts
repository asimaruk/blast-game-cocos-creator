import { Game } from "../Game";

export interface Command {
    do(game: Game): Command.Result;
    undo(game: Game): Command.Result;
}

export namespace Command {
    export const DEFAULT_MOVES_DIFF = 1;
    type CommonResult = {
        scoreDiff?: number;
        movesDiff?: number;
    };
    export type BlastResult = {
        type: 'blasts',
        blasts: Game.Position[],
        position: Game.Position,
    }
    export type BurnsResult = {
        type: 'burns';
        burns: Game.TilePosition[],
        position: Game.Position,
    };
    export type MovesResult = {
        type: 'moves';
        moves: Array<[Game.Position, Game.Position]>,
    };
    export type RefillsResult = {
        type: 'refills';
        refills: Game.TilePosition[],
    };
    export type AppearResult = {
        type: 'appear';
        appear: Game.TilePosition,
    };
    export type AppearsResult = {
        type: 'appears';
        appears: Game.TilePosition[],
    };
    export type DisappearsResult = {
        type: 'disappears';
        disappears: Game.Position[],
    };
    type SpecificResult = BurnsResult
                        | MovesResult
                        | RefillsResult
                        | AppearResult
                        | AppearsResult
                        | DisappearsResult
                        | BlastResult
                        ;
    export type Result = CommonResult & SpecificResult;
}