const {ccclass, property} = cc._decorator;
import { 
    Game, 
    isColorTile, 
    isSuperTile,
    Position,
} from "blast";
import { Tiles } from "./Tiles";
import { Tile } from "./Tile";
import { getTileSprite } from "./utils-atlas";
import { log } from "./utils-log";
import { 
    tweenScaleOut, 
    tweenTileBlast, 
    tweenFadeOut, 
    tweenMove,
    tweenFadeIn, 
} from "./tweens";

@ccclass
export default class GameManager extends cc.Component implements Game.GameListener {

    @property(cc.Label)
    moves: cc.Label | null = null;
    @property(cc.Label)
    score: cc.Label | null = null;
    @property(cc.Label)
    winScore: cc.Label | null = null;
    @property(Tiles)
    tiles: Tiles | null = null;
    @property(cc.Prefab)
    tilePrefab: cc.Prefab | null = null;
    @property(cc.Prefab)
    sparksPrefab: cc.Prefab | null = null;
    @property(cc.SpriteAtlas)
    tilesAtlas: cc.SpriteAtlas | null = null;
    @property(cc.Node)
    winTitle: cc.Node | null = null;
    @property(cc.Node)
    loseTitle: cc.Node | null = null;

    private game: Game | null = null;
    private tilePool = new cc.NodePool(Tile);
    private sparksPool = new cc.NodePool();

    protected onLoad(): void {
        const config = {
            width: 10,
            height: 11,
            moves: 30,
            winScore: 500,
            countToSuper: 6,
        };
        this.game = new Game(config);
        this.game.addGameListener(this);
        this.tiles?.node.on(Tiles.EventType.TILES_CLICK, this.onTilesClick, this);

        this.onRestart(config, true);
    }

    protected onDestroy(): void {
        this.game?.removeGameListener(this);
        this.tiles?.node.off(Tiles.EventType.TILES_CLICK, this.onTilesClick, this);
    }

    public onGameEvent(event: Game.Event) {
        switch (event.id) {
            case "win":
            case "lose":
                this.onGameOver(event);
                break;
            case "blast":
                this.onGameBlastEvent(event);
                break;
            case "fall":
                this.onGameFallEvent(event);
                break;
            case "appear":
                this.onGameAppearEvent(event);
                break;
            case 'burn':
                this.onGameBurnEvent(event);
                break;
            case 'restart':
                this.onGameRestart(event);
                break;
        }
    }

    private restart(config?: Game.Config) {
        this.game?.restart(config);
    }

    private onRestart(config: Game.Config, isFirstTime: boolean = false) {
        if (this.tiles && this.tilesAtlas) {
            this.tiles.resize(config.width, config.height);

            const tweens: cc.Tween[] = [];
            for (let x = 0; x < config.width; x++) {
                for (let y = 0; y < config.height; y++) {
                    const tile = this.game?.getTile(x, y);
                    if (tile === undefined || !(isColorTile(tile) || isSuperTile(tile))) {
                        continue;
                    }
                    const tileNode = this.getTile({ sprite: getTileSprite(this.tilesAtlas, tile) });
                    this.tiles.addTile(tileNode);
                    tileNode.setPosition(this.tiles.getNodePosition(x, y));
                    if (!isFirstTime) {
                        const tween = tweenScaleOut(tileNode);
                        tweens.push(tween);
                    }
                }
            }
            if (!isFirstTime && tweens.length > 0) {
                this.tiles?.queueTweens(...tweens);
            }
        }
        if (this.winScore) {
            this.winScore.string = `${config.winScore}`;
        }
        this.updateScore(0, config.moves);
        if (this.winTitle) {
            if (isFirstTime) {
                this.winTitle.active = false;
            } else if (this.winTitle.active) {
                tweenFadeOut(this.winTitle)
                    .call(() => {
                        if (this.winTitle) {
                            this.winTitle.active = false;
                        }
                    })
                    .start();
            }
        }
        if (this.loseTitle) {
            if (isFirstTime) {
                this.loseTitle.active = false;
            } else if (this.loseTitle.active) {
                tweenFadeOut(this.loseTitle)
                    .call(() => {
                        if (this.loseTitle) {
                            this.loseTitle.active = false;
                        }
                    })
                    .start();
            }
        }
    }

    private onTilesClick(tilePosition: cc.Vec2) {
        log(`Tile pick {${tilePosition.x}; ${tilePosition.y}}`);
        if (this.game === null) {
            return;
        }

        if (this.game.getMovesLeft() > 0) {
            this.game.pick(tilePosition.x, tilePosition.y);
        } else {
            this.restart();
        }
    }

    private onGameBlastEvent(event: Extract<Game.Event, { id: 'blast' }>) {
        log('Game: blast', event);
        this.updateScore(event.score, event.movesLeft);
        this.blastTiles(event.positions);
    }

    private onGameFallEvent(event: Extract<Game.Event, { id: 'fall'}>) {
        log('Game: fall', event);
        const tweens: cc.Tween[] = [];
        for (const fall of event.falls) {
            const tileNode = this.tiles?.getChildTile(fall[0].x, fall[0].y);
            if (!tileNode) {
                throw new Error(`Can not find tile for {${fall[0].x}; ${fall[0].y}}`);
            }
            const fallTo = this.tiles?.getNodePosition(fall[1].x, fall[1].y);
            if (!fallTo) {
                throw new Error(`Unknown position for {${fall[1].x}; ${fall[1].y}}`);
            }
            const tween = tweenMove(tileNode, fallTo);
            tweens.push(tween);
        }
        this.tiles?.queueTweens(...tweens);
    }

    private onGameAppearEvent(event: Extract<Game.Event, { id: 'appear'}>) {
        log('Game: appear', event);
        if (!this.tilesAtlas || !this.tiles) {
            return;
        }
        const tweens: cc.Tween[] = [];
        for (const aptile of event.tiles) {
            const tileNode = this.getTile({ sprite: getTileSprite(this.tilesAtlas, aptile.tile) });
            this.tiles.addTile(tileNode);
            const nodePos = this.tiles.getNodePosition(aptile.x, aptile.y);
            tileNode.setPosition(nodePos);
            const tween = tweenScaleOut(tileNode);
            tweens.push(tween);
        }
        this.tiles.queueTweens(...tweens);
    }

    private onGameBurnEvent(event: Extract<Game.Event, { id: 'burn' }>) {
        log('Game: burn', event);
        this.updateScore(event.score, event.movesLeft);
        this.blastTiles(event.burnPositions.concat(event.superTiles));
    }

    private onGameOver(event: Extract<Game.Event, { id: 'win' | 'lose' }>) {
        log(`Game: ${event.id}`, event);
        const tweens: cc.Tween[] = [];
        this.tiles?.node.children.forEach(tileNode => {
            if (tileNode.getComponent(Tile) === null) {
                return;
            }
            const tween = tweenFadeOut(tileNode)
                .call(() => {
                    this.tilePool.put(tileNode);
                });
            tweens.push(tween);
        });
        this.tiles?.queueTweens(...tweens);
        const titleNode = event.id === 'win' ? this.winTitle : this.loseTitle;
        if (titleNode) {
            titleNode.active = true;
            tweenFadeIn(titleNode).start();
        }
    }

    private onGameRestart(event: Extract<Game.Event, { id: 'restart' }>) {
        this.onRestart(event.config);
    }

    private getTile(tileConfig: Tile.TileOptions): cc.Node {
        return this.tilePool.get(tileConfig) || this.createTile(tileConfig);
    }

    private createTile(tileConfig: Tile.TileOptions): cc.Node {
        if (this.tilePrefab === null) {
            throw new Error('Tile prefab is not set');
        }
        const n = cc.instantiate(this.tilePrefab);
        n.getComponent(Tile)?.setOptions(tileConfig);
        return n;
    }

    private getSparks(): cc.ParticleSystem {
        if (this.sparksPrefab === null) {
            throw new Error('Sparks prefab is not set');
        }
        const sparks = this.sparksPool.get() || cc.instantiate(this.sparksPrefab);
        const particles = sparks.getComponent(cc.ParticleSystem);
        if (!particles) {
            throw new Error('No ParticleSystem component');
        }
        particles.resetSystem();
        
        return particles;
    }

    private updateScore(score: number, moves: number) {
        if (this.score) {
            this.score.string = `${score}`;
        }
        if (this.moves) {
            this.moves.string = `${moves}`;
        }
    }

    private blastTiles(tilelPositions: Position[]) {
        const blastTiles = tilelPositions.map(p => this.tiles?.getChildTile(p.x, p.y)).filter(t => t !== undefined);
        const tweens: cc.Tween[] = [];
        for (const t of blastTiles) {
            const tween = tweenTileBlast(
                t, 
                () => {
                    const sparks = this.getSparks();
                    this.tiles?.node.addChild(sparks.node);
                    sparks.node.setPosition(t.position);
                    sparks.scheduleOnce(
                        () => {
                            this.tiles?.node.removeChild(sparks.node);
                            this.sparksPool.put(sparks.node);
                        },
                        sparks.duration + sparks.life + sparks.lifeVar,
                    );
                }
            )
            .call(() => {
                this.tilePool.put(t);
            });
            tweens.push(tween);
        }
        this.tiles?.queueTweens(...tweens);
    }
}
