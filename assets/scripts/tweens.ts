export function tweenTileBlast(
    tile: cc.Node, 
    createSparks: () => void,
): cc.Tween {
    return cc.tween(tile).parallel(
        cc.tween().to(
            0.15,
            {
                scale: 1.2,
            },
            {
                easing: cc.easing.quintOut,
            },
        ),
        cc.tween().delay(0.1)
            .call(createSparks)
            .to(
                0.05, 
                {
                    opacity: 0,
                },
            )
    )
}

export function tweenMove(node: cc.Node, to: cc.Vec2): cc.Tween {
    return cc.tween(node).to(
        0.2,
        {
            position: to,
        },
        {
            easing: cc.easing.quintIn,
        },
    );
}

export function tweenScaleOut(node: cc.Node): cc.Tween {
    node.scale = 0;
    return cc.tween(node)
        .to(
            0.05,
            {
                scale: 1,
            }
        );
}

export function tweenFadeOut(node: cc.Node): cc.Tween {
    return cc.tween(node)
        .to(
            0.5, 
            {
                opacity: 0,
            },
        );
}

export function tweenFadeIn(node: cc.Node): cc.Tween {
    node.opacity = 0;
    return cc.tween(node)
        .to(
            0.5, 
            {
                opacity: 255,
            },
        )
}