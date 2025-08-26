import { Game, UtilityConfig } from 'blast-core';

export const DEFAULT_GAME_CONFIG: Game.Config = {
    width: 10,
    height: 11,
    moves: 30,
    winScore: 500,
    countToSuper: 6,
    colors: ['red', 'green', 'blue', 'purple', 'yellow'],
    superActions: {
        burn_row: [
            { 
                id: 'burn', 
                burns: [
                    [{x: 'e', y: 0}, {x: 'e', y: 0}]
                ]
            }
        ],
        burn_column: [
            { 
                id: 'burn', 
                burns: [
                    [{x: 0, y: 'e'}, {x: 0, y: 'e'}]
                ]
            }
        ],
        burn_around: [
            { 
                id: 'burn', 
                burns: [
                    [{x: -1, y: -1}, {x: 1, y: 1}]
                ]
            }
        ],
        burn_all: [
            { 
                id: 'burn', 
                burns: [
                    [{x: 'e', y: 'e'}, {x: 'e', y: 'e'}]
                ]
            }
        ]
    }
};

export const DEFAULT_SPRITES = {
    red: 'block_red',
    green: 'block_green',
    blue: 'block_blue',
    purple: 'block_purpure',
    yellow: 'block_yellow',
    burn_row: 'block_rockets_horisontal',
    burn_column: 'block_rakets',
    burn_around: 'block_bomb',
    burn_all: 'block_bomb_max',
};

export type Config = {
    readonly game: Game.Config,
    readonly sprites: {[key: string]: string},
}

export namespace Config {
    export function isConfig(obj: unknown): obj is Config {
        if (typeof obj !== 'object' || obj === null) {
            return false;
        }

        return 'game' in obj
            && UtilityConfig.isGameConfig(obj.game)
            && 'sprites' in obj
            && typeof obj.sprites === 'object'
            && obj.sprites !== null
            && Object.values(obj.sprites).every(v => typeof v === 'string');
    }
}
