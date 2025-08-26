import { Game } from "./Game";
import { isTileKind, TileKind } from "./Tile";

type Validator<T> = (value: T) => boolean;

function validateUniq(tiles: TileKind[], uniqueTiles: TileKind[]): boolean {
    for (const t of tiles) {
        if (uniqueTiles.indexOf(t) >= 0) {
            return false;
        }
        uniqueTiles.push(t);
    }
    return true;
}

export class UtilityConfig {

    static isGameConfig(obj: unknown): obj is Game.Config {
        return typeof obj === 'object' 
            && obj !== null 
            && 'width' in obj 
            && typeof obj.width === 'number' 
            && 'height' in obj 
            && typeof obj.height === 'number' 
            && 'moves' in obj 
            && typeof obj.moves === 'number' 
            && 'winScore' in obj 
            && typeof obj.winScore === 'number' 
            && 'countToSuper' in obj 
            && typeof obj.countToSuper === 'number' 
            && 'colors' in obj 
            && Array.isArray(obj.colors)
            && obj.colors.every(c => isTileKind(c))
            && 'superActions' in obj
            && typeof obj.superActions === 'object' 
            && obj.superActions !== null
            && Object.keys(obj.superActions).every(k => isTileKind(k))
            && Object.values(obj.superActions).every(v => Array.isArray(v) && v.every(a => Game.isAction(a)));
    }

    static validateConfig(config: Game.Config): { 
        isValid: boolean,
        errors: string[], 
    } {
        const errors: string[] = [];
        const uniqueTiles: TileKind[] = [];
        const checks: {[key in keyof Game.Config]: Validator<Game.Config[key]>} = {
            width: v => v > 0,
            height: v => v > 0,
            moves: v => v > 0,
            winScore: v => v > 0,
            countToSuper: v => v >= 0,
            colors: v => v.length > 0 && validateUniq(v, uniqueTiles),
            superActions: v => validateUniq(Object.keys(v), uniqueTiles),
        };
        
        for (const key of Object.keys(checks) as (keyof Game.Config)[]) {
            const value = config[key];
            const validator = checks[key] as Validator<typeof value>;
            if (!validator(value)) {
                errors.push(`Invalid value for ${key}: ${value}`);
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    constructor(public readonly config: Game.Config) {
        const validResult = UtilityConfig.validateConfig(config);
        if (!validResult.isValid) {
            throw new Error(validResult.errors.join('; '));
        }
    }

    isColorTile(tile: unknown): tile is TileKind {
        return this.config.colors.findIndex((t) => t === tile) >= 0;
    }

    isSuperTile(tile: unknown): tile is TileKind {
        return Object.keys(this.config.superActions).findIndex((t) => t === tile) >= 0;
    }
}