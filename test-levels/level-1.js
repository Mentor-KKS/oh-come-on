// Generated from Community Editor on 2026-04-06
LEVELS.push({
    name: "Level_1",
    player: {
        x: 50,
        y: 440
    },
    exit: {
        x: 745,
        y: 340,
        w: 30,
        h: 40,
        showAboveY: 0,
        showBelowX: 0,
        revealArea: {
            x: 690,
            y: 320,
            w: 70,
            h: 60
        }
    },
    platforms: [
        {
            x: 0,
            y: 0,
            w: 10,
            h: 500
        },
        {
            x: 790,
            y: 0,
            w: 10,
            h: 500
        },
        {
            x: 0,
            y: 0,
            w: 800,
            h: 10
        },
        {
            x: 10,
            y: 470,
            w: 780,
            h: 30
        }
    ],
    spikes: [
        {
            x: 260,
            y: 450,
            w: 20,
            h: 20,
            dir: "up"
        },
        {
            x: 240,
            y: 450,
            w: 20,
            h: 20,
            dir: "up"
        }
    ],
    traps: [
        new DarknessOverlay(40),
        new InvertTriggerLine(330),
        new InvertTriggerLine(480),
        new WindZone(380, 400, 80, 70, -4.5, 0),
        new HiddenPlatform(370, 385, 80, 20, {
    x: 350,
    y: 270,
    w: 200,
    h: 100
}),
        new FakeSpikes([
    {
        x: 215,
        y: 450,
        w: 20,
        h: 20,
        dir: "up"
    }
]),
        Object.assign(new ShootingSpike(770, 365, "left", 685, 3, null, null, true), {
    triggerMode: "area",
    triggerArea: {
        x: 370,
        y: 365,
        w: 40,
        h: 30
    }
}),
        new HiddenPlatform(10, 385, 40, 20, {
    x: -25,
    y: 295,
    w: 200,
    h: 100
}),
        new HiddenPlatform(90, 325, 75, 25, {
    x: 75,
    y: 310,
    w: 200,
    h: 100
}),
        new HiddenPlatform(195, 275, 75, 25, {
    x: 50,
    y: 270,
    w: 200,
    h: 100
}),
        new FakeExit(730, 110, 500),
        new FallingCeiling(600, 10, 60, 30, 630, false),
        Object.assign(new FallingCeiling(525, 10, 60, 30, 535, false), {
    triggerMode: "area",
    triggerArea: {
        x: 490,
        y: 115,
        w: 80,
        h: 60
    }
}),
        new MovingPlatform(305, 225, 80, 20, 495, 180, 0.5, undefined),
        new TrollShaker(580, 180, 130, 20)
    ],
});
