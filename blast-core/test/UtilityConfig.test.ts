import { describe, it, expect } from "@jest/globals";
import { Game } from "../src";
import { UtilityConfig } from "../src/UtilityConfig";

describe('UtilityConfig', () => {
    it('No moves throws', () => {
        const config: Game.Config = {
            width: 4,
            height: 4,
            moves: 0,
            winScore: 999,
            countToSuper: 6,
            colors: ['red'],
            superActions: {},
        };
        expect(() => new UtilityConfig(config)).toThrow('Invalid value for moves: 0');
    });

    it('Empty colors throws', () => {
        const config: Game.Config = {
            width: 4,
            height: 4,
            moves: 30,
            winScore: 999,
            countToSuper: 6,
            colors: [],
            superActions: {},
        };
        expect(() => new UtilityConfig(config)).toThrow('Invalid value for colors: ');
    });

    it('Duplicate colors throws', () => {
        const config: Game.Config = {
            width: 4,
            height: 4,
            moves: 30,
            winScore: 999,
            countToSuper: 6,
            colors: ['red', 'green', 'green', 'blue'],
            superActions: {},
        };
        expect(() => new UtilityConfig(config)).toThrow('Invalid value for colors: red,green,green,blue');
    });

    it('Zero width and height throws', () => {
        const config: Game.Config = {
            width: 0,
            height: 0,
            moves: 30,
            winScore: 999,
            countToSuper: 6,
            colors: ['red', 'green', 'blue'],
            superActions: {},
        };
        expect(() => new UtilityConfig(config)).toThrow('Invalid value for width: 0; Invalid value for height: 0');
    });

    it('isGameConfig', () => {
        const config = {
            "width": 10,
            "height": 11,
            "moves": 10,
            "winScore": 500,
            "countToSuper": 6,
            "colors": ["red", "green", "blue", "purple", "yellow"],
            "superActions": {
                "burn_row": [
                    { 
                        "id": "burn", 
                        "burns": [
                            [{"x": "e", "y": 0}, {"x": "e", "y": 0}]
                        ]
                    }
                ],
                "burn_column": [
                    { 
                        "id": "burn", 
                        "burns": [
                            [{"x": 0, "y": "e"}, {"x": 0, "y": "e"}]
                        ]
                    }
                ],
                "burn_around": [
                    { 
                        "id": "burn", 
                        "burns": [
                            [{"x": -1, "y": -1}, {"x": 1, "y": 1}]
                        ]
                    }
                ],
                "burn_all": [
                    { 
                        "id": "burn", 
                        "burns": [
                            [{"x": "e", "y": "e"}, {"x": "e", "y": "e"}]
                        ]
                    }
                ]
            }
        };
        expect(UtilityConfig.isGameConfig(config)).toBeTruthy();
    });
});