import { expect } from '@jest/globals';
import { Game } from "../src";

type SyncExpectationResult = { pass: boolean, message: () => string };
type ExpectationResult =
  | SyncExpectationResult
  | Promise<SyncExpectationResult>;

declare module 'expect' {
    interface Matchers<R> {
        toEqualWithTileRules(expected: (Game.TileKind | ((t: Game.TileKind) => boolean))[]): R;
    }
}

expect.extend({
    toEqualWithTileRules(
        received: Game.TileKind[], 
        expected: Game.TileKind | ((t: Game.TileKind) => boolean)[]
    ): ExpectationResult {
        if (received.length !== expected.length) {
            return {
                pass: false,
                message: () => `Arrays have different lengths. Expected ${expected.length}, got ${received.length}`
            };
        }
        for (let i = 0; i < expected.length; i++) {
            const exp = expected[i];
            const rec = received[i];
            if ((typeof exp === 'function')) {
                if (rec && !exp(rec)) {
                    return {
                        pass: false,
                        message: () => `At index ${i}, expected rule didn't match for ${rec}`
                    };
                }
            } else if (rec !== exp) {
                return {
                    pass: false,
                    message: () => `At index ${i}, expected ${exp}, got ${rec}`
                };
            }
        }
        return {
            pass: true,
            message: () => `Arrays match ignoring 'skip' values`,
        };
    }
});
