import { Command } from "./command/Command";
import { TileField } from "./TileField";
import { UtilityConfig } from "./UtilityConfig";
import { RenameProperties } from "./utils";

export interface Game {
    getTile(x: number, y: number): Game.TileKind | undefined;
    pickTile(x: number, y: number): void;
    moveTile(x0: number, y0: number, x1: number, x2: number): void;
    blastTile(x: number, y: number): void;
    setTile(x: number, y: number, tile: Game.TileKind): void;
    restart(cfg?: Game.Config): void;
    addGameListener(listener: Game.GameListener): void;
    removeGameListener(listener: Game.GameListener): void;
    getMovesLeft(): number;
    setMovesLeft(value: number): void;
    getScore(): number;
    setScore(value: number): void;
    isGameOver(): boolean;
    getConfig(): UtilityConfig;
    getTileField(): TileField;
    undo(): void;
}

export namespace Game {

    export const EMPTY_TILE = 'empty';

    export type TileKind = string;
    export type Position = {
        x: number,
        y: number,
    };
    export type TilePosition = { tile: TileKind } & Position;
    export type RangePosition = {
        x: number | 'e',
        y: number | 'e',
    };
    type WinEvent = {
        id: 'win',
    };
    type LoseEvent = {
        id: 'lose',
    };
    type BlastEvent = RenameProperties<Command.BlastResult, { type: 'id' }>;
    type MoveEvent = RenameProperties<Command.MovesResult, { type: 'id' }>;
    type RefillEvent = RenameProperties<Command.RefillsResult, { type: 'id' }>;
    type AppearEvent = RenameProperties<Command.AppearResult, { type: 'id' }>;
    type AppearsEvent = RenameProperties<Command.AppearsResult, { type: 'id' }>;
    type BurnEvent = RenameProperties<Command.BurnsResult, { type: 'id' }>;
    type DisappearEvent = RenameProperties<Command.DisappearsResult, { type: 'id' }>;
    type Restart = {
        id: 'restart',
        config: Game.Config,
    };
    export type Event = WinEvent 
                      | LoseEvent 
                      | BlastEvent 
                      | MoveEvent 
                      | RefillEvent 
                      | AppearEvent
                      | AppearsEvent
                      | BurnEvent
                      | DisappearEvent
                      | Restart
                      ;
    export type BurnAction = {
        id: 'burn',
        burns: (Position | [RangePosition, RangePosition])[],
    };
    export type Action = BurnAction
                       ;
    export type Config = {
        readonly width: number,
        readonly height: number,
        readonly moves: number,
        readonly winScore: number,
        readonly countToSuper: number,
        readonly colors: TileKind[],
        readonly superActions: {[key: TileKind]: Action[]},
    };

    export interface GameListener {
        onGameEvent(event: Event): void;
    }

    export function isPosition(obj: unknown): obj is Position {
        if (typeof obj !== 'object' || obj === null) {
            return false;
        }

        return 'x' in obj
            && typeof obj.x === 'number'
            && 'y' in obj
            && typeof obj.y === 'number';
    }

    export function isTilePosition(obj: unknown): obj is Position {
        if (typeof obj !== 'object' || obj === null) {
            return false;
        }

        return isPosition(obj)
            && 'tile' in obj
            && isTileKind(obj.tile);
    }

    export function isRangePosition(obj: unknown): obj is Position {
        if (typeof obj !== 'object' || obj === null) {
            return false;
        }

        return 'x' in obj
            && (typeof obj.x === 'number' || obj.x === 'e')
            && 'y' in obj
            && (typeof obj.y === 'number' || obj.y === 'e');
    }

    function isBurnAction(obj: unknown): obj is BurnAction {
        if (typeof obj !== 'object' || obj === null) {
            return false;
        }

        return 'id' in obj
            && obj.id === 'burn'
            && 'burns' in obj
            && Array.isArray(obj.burns)
            && obj.burns.every(b => {
                return isPosition(b)
                    || Array.isArray(b)
                    && b.length === 2
                    && isRangePosition(b[0])
                    && isRangePosition(b[1]); 
            });
    }

    export function isAction(obj: unknown): obj is Action {
        return isBurnAction(obj);
    }

    export function isTileKind(obj: unknown): obj is TileKind {
        return typeof obj === 'string'
            && obj !== EMPTY_TILE;
    }

    export function isTileEmpty(obj: unknown): obj is typeof EMPTY_TILE {
        return obj === EMPTY_TILE;
    }
}