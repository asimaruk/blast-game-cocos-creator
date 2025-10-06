import { Tile } from "./Tile";

const { ccclass } = cc._decorator;

@ccclass
export class Tiles extends cc.Component {

    private positions: cc.Vec2[][] = [];
    private blockSize = 0;
    private tempPos = cc.v2();
    private nodeLoc = cc.v2();
    private state = Tiles.State.IDLE;
    private runningTweens: cc.Tween[] = [];
    private queuedTweens: cc.Tween[][] = [];

    protected onLoad(): void {
        this.node.on(cc.Node.EventType.TOUCH_END, this.onClick, this);
    }

    resize(columns: number, rows: number) {
        this.blockSize = this.node.width / columns;
        this.positions = new Array<Array<cc.Vec2>>(columns);
        for (let x = 0; x < columns; x++) {
            this.positions[x] = [];
            for (let y = 0; y < rows; y++) {
                this.positions[x].push(cc.v2(
                    -this.node.width * this.node.anchorX + (x + 0.5) * this.blockSize,
                    -this.node.height * this.node.anchorY + (y + 0.5) * this.blockSize,
                ));
            }
        }
    }

    getNodePosition(tileX: number, tileY: number): cc.Vec2 {
        return this.positions[tileX][tileY];
    }

    addTile(tileNode: cc.Node) {
        const scale = this.blockSize / tileNode.width;
        tileNode.setContentSize(this.blockSize, tileNode.height * scale);
        this.node.addChild(tileNode);
    }

    getChildTile(tileX: number, tileY: number): cc.Node | undefined {
        const nodePos = this.getNodePosition(tileX, tileY);
        return this.node.children.filter(child => {
            if (child.getComponent(Tile) === null) {
                return false;
            }
            child.getPosition(this.tempPos);
            if (this.tempPos.subtract(nodePos).len() < this.blockSize / 2) {
                return true;
            }
        }).reverse()[0];
    }

    getAllChildTiles(): cc.Node[] {
        return this.node.children.filter(c => c.getComponent(Tile) !== null);
    }

    queueTweens(...tweens: cc.Tween[]) {
        if (tweens.length === 0) {
            return;
        }
        if (this.runningTweens.length > 0) {
            this.queuedTweens.push(tweens);
            return;
        }
        this.runTweens(tweens);
    } 

    private runTweens(tweens: cc.Tween[]) {
        this.setState(Tiles.State.MOVING);
        this.runningTweens.push(...tweens);
        for (const tween of tweens) {
            tween.call(() => {
                const tweenIdx = this.runningTweens.indexOf(tween);
                this.runningTweens.splice(tweenIdx, 1);
                if (this.runningTweens.length === 0) {
                    const nextTweens = this.queuedTweens.shift();
                    if (nextTweens === undefined) {
                        this.setState(Tiles.State.IDLE);
                    } else {
                        this.runTweens(nextTweens);
                    }
                }
            }).start();
        }
    }

    private onClick(event: cc.Event.EventTouch) {
        if (this.state === Tiles.State.MOVING) {
            return;
        }

        this.node.convertToNodeSpaceAR(event.getTouches()[0].getLocation(), this.nodeLoc);
        this.nodeLoc.x = Math.floor((this.nodeLoc.x + this.node.width * this.node.anchorX) / this.blockSize);
        this.nodeLoc.y = Math.floor((this.nodeLoc.y + this.node.height * this.node.anchorY) / this.blockSize);
        this.node.emit(Tiles.EventType.TILES_CLICK, this.nodeLoc);
    }

    private setState(state: Tiles.State) {
        if (state !== this.state) {
            this.state = state;
        }
    }
}

export namespace Tiles {
    export class EventType {
        static TILES_CLICK = 'tiles_click_event';
    }

    export enum State {
        IDLE,
        MOVING,
    }
}
