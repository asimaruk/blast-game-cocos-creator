const { ccclass } = cc._decorator;

type MutablePartial<T> = {
  -readonly [P in keyof T]?: T[P];
};

 const MIN_HOT_KEY_LENGTH = 2; // Every hot key contains atleast two keys. Otherwise it's just a key

@ccclass
export class KeyboardManager extends cc.Component {

    private pressedKeys: number[] = [];
    private splitedHotKeys: (MutablePartial<typeof KeyboardManager.HotKeys>)[] = [];

    protected onLoad() {
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);

        Object.entries(KeyboardManager.HotKeys).forEach(hotKey => {
            const splitedPos = hotKey[1].length - MIN_HOT_KEY_LENGTH;
            const lenDiff = splitedPos - this.splitedHotKeys.length;
            for (let i = 0; i <= lenDiff; i++) {
                this.splitedHotKeys.push({});
            }
            if (this.isKeyActionKey(hotKey[0])) {
                this.splitedHotKeys[splitedPos][hotKey[0]] = hotKey[1];
            }
        });
    }

    protected onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    private onKeyDown(event: cc.Event.EventKeyboard) {
        this.pressedKeys.push(event.keyCode);
    }

    private onKeyUp(event: cc.Event.EventKeyboard) {
        const pressedIdx = this.pressedKeys.indexOf(event.keyCode);
        if (pressedIdx === -1) {
            return;
        }

        const modifiers = Object.values(KeyboardManager.KeyModifiers);
        const pressedModifiers = this.pressedKeys.filter(k => modifiers.indexOf(k) >= 0);
        const pressedKeys = this.pressedKeys.filter(k => modifiers.indexOf(k) === -1);
        const hotKey = this.detectHotKey(pressedKeys, pressedModifiers);
        const clickEvent: KeyboardManager.ClickEvent = {
            keyCode: event.keyCode,
            modifiers: pressedModifiers,
            hotKey: hotKey,
        };
        this.node.emit(KeyboardManager.EventType.CLICK_EVENT, clickEvent);

        this.pressedKeys.splice(pressedIdx, 1);
    }

    private detectHotKey(
        keys: number[], 
        modifiers: KeyboardManager.KeyModifier[],
    ): KeyboardManager.KeyAction | null {
        const hotKeys = this.splitedHotKeys[keys.length + modifiers.length - MIN_HOT_KEY_LENGTH];
        if (!hotKeys) {
            return null;
        }
        const hotKeyEntries = Object.entries(hotKeys);
        for (let i = 0; i < hotKeyEntries.length; i++) {
            const key = hotKeyEntries[i][0];
            const keyCodes = hotKeyEntries[i][1];
            const hasKeys = keys.every(k => keyCodes.indexOf(k) >= 0);
            const hasModifiers = modifiers.every(m => keyCodes.indexOf(m) >= 0);
            if (hasKeys && hasModifiers && this.isKeyActionKey(key)) {
                return KeyboardManager.KeyActions[key];
            }
        }
        return null;
    } 

    private isKeyActionKey(o: unknown): o is keyof typeof KeyboardManager.KeyActions {
        return typeof o === 'string' && Object.keys(KeyboardManager.KeyActions).indexOf(o) >= 0;
    }
}

export namespace KeyboardManager {
    export const EventType = {
        CLICK_EVENT: "blast_game_key_click_event",
    };

    export const KeyModifiers = {
        CONTROL: cc.macro.KEY.ctrl,
        COMMAND: 91,
    } as const;
    export type KeyModifier = typeof KeyModifiers[keyof typeof KeyModifiers];

    export const KeyActions = {
        UNDO: 'undo',
    } as const;
    export type KeyAction = typeof KeyActions[keyof typeof KeyActions];

    export const HotKeys: {[key in keyof typeof KeyActions]: number[]} = {
        UNDO: [cc.macro.KEY.z, KeyModifiers.CONTROL],
    }

    export type ClickEvent = {
        keyCode: number,
        modifiers: KeyModifier[],
        hotKey: KeyAction | null,
    };
}
