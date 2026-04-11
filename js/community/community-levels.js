// ================================================================
//  COMMUNITY LEVELS — Seed Pool
//  These are bundled community / showcase levels displayed in the
//  in-game Community browser. They are not pushed into LEVELS and
//  therefore don't affect the main campaign progression.
//
//  To add a new community level:
//    COMMUNITY_LEVELS.push({
//        name: 'Display Name',
//        author: 'Author',
//        difficulty: 'easy' | 'medium' | 'hard',
//        description: 'one-line hook',
//        ...levelData (same shape as js/levels/levelXX.js entries)
//    });
//
//  Loaded AFTER js/traps.js because entries may use `new ActionTrigger(...)`.
// ================================================================

const COMMUNITY_LEVELS = [];

COMMUNITY_LEVELS.push({
    name: "Community Level 1",
    author: "Kon",
    difficulty: "medium",
    levelType: "normal",
    backgroundTheme: "plainSlate",
    width: 800,
    height: 500,
    player: { x: 50, y: 440 },
    exit: {
        x: 735,
        y: 425,
        w: 30,
        h: 40,
        revealed: false,
    },
    platforms: [
        { x: 0,   y: 0,   w: 10,  h: 500 },
        { x: 790, y: 0,   w: 10,  h: 500 },
        { x: 0,   y: 0,   w: 800, h: 10 },
        { x: 10,  y: 470, w: 390, h: 30 },
        {
            x: 150, y: 380, w: 100, h: 20,
            skin: "default",
            devId: "wall-a",
            actionGroup: "trap-pack-a",
            actionSolid: true,
        },
        {
            x: -15, y: 365, w: 25, h: 105,
            skin: "ceiling",
            actionSolid: true,
            devId: "wall-b",
            actionGroup: "wall-b",
            actionHidden: true,
        },
        { x: 400, y: 470, w: 70,  h: 30, skin: "default", devId: "floor_a" },
        { x: 535, y: 470, w: 255, h: 30 },
        { x: 470, y: 470, w: 65,  h: 30, skin: "default", devId: "floor_b" },
    ],
    spikes: [
        { x: 10, y: 370, w: 20, h: 20, dir: "right", actionGroup: "wall-b", actionHidden: true },
        { x: 10, y: 390, w: 20, h: 20, dir: "right", actionGroup: "wall-b", actionHidden: true },
        { x: 10, y: 410, w: 20, h: 20, dir: "right", actionGroup: "wall-b", actionHidden: true },
        { x: 10, y: 430, w: 20, h: 20, dir: "right", actionGroup: "wall-b", actionHidden: true },
        { x: 10, y: 450, w: 20, h: 20, dir: "right", actionGroup: "wall-b", actionHidden: true },
    ],
    traps: [
        new ActionTrigger(150, 405, 45, 60, [
            { type: "transform", duration: 20, targetId: "wall-a", x: 225, y: 365, w: 25, h: 105 },
            { type: "wait", duration: 40 },
            { type: "move", targetId: "wall-a", x: 145, y: 365, speed: 0.8 },
            { type: "showHide", targetId: "wall-b", visibility: "show", startMode: "parallel" },
            { type: "move", targetId: "wall-b", x: 95, y: 365, speed: 1, startMode: "parallel" },
            { type: "showHide", targetId: "wall-b", visibility: "hide" },
        ]),
        new ActionTrigger(375, 400, 20, 70, [
            { type: "move", targetId: "floor_a", x: 460, y: 470, speed: 4 },
            { type: "showHide", targetId: "floor_a", visibility: "hide" },
        ]),
        new ActionTrigger(460, 400, 20, 70, [
            { type: "showHide", targetId: "floor_b", visibility: "show" },
            { type: "move", targetId: "floor_b", x: 390, y: 470, speed: 4, startMode: "parallel" },
        ]),
    ],
});

COMMUNITY_LEVELS.push({
    name: "Community Level 2",
    author: "Kon",
    difficulty: "medium",
    levelType: "normal",
    backgroundTheme: "plainSlate",
    width: 800,
    height: 500,
    player: { x: 50, y: 440 },
    exit: {
        x: 75,
        y: 55,
        w: 30,
        h: 40,
        revealMode: "area",
        revealed: false,
        world: "main",
        revealArea: { x: 15, y: 20, w: 95, h: 80 },
    },
    platforms: [
        { x: 0,   y: 0,   w: 10,  h: 500 },
        { x: 790, y: 0,   w: 10,  h: 500 },
        { x: 0,   y: 0,   w: 800, h: 10 },
        { x: 10,  y: 470, w: 185, h: 30 },
        { x: 95,  y: 440, w: 100, h: 20, material: "conveyor", conveyorDir: "right", conveyorSpeed: 0.65 },
        { x: 195, y: 390, w: 100, h: 20, material: "conveyor", conveyorDir: "right", conveyorSpeed: 0.75 },
        { x: 295, y: 330, w: 100, h: 20, material: "conveyor", conveyorDir: "right", conveyorSpeed: 0.9 },
        { x: 445, y: 190, w: 80,  h: 20, skin: "default" },
        { x: 195, y: 470, w: 525, h: 30, material: "lava" },
        { x: 720, y: 470, w: 80,  h: 30 },
        { x: 195, y: 440, w: 20,  h: 20, material: "ice" },
        { x: 295, y: 390, w: 20,  h: 20, material: "ice" },
        { x: 395, y: 330, w: 20,  h: 20, material: "ice" },
    ],
    spikes: [],
    traps: [
        Object.assign(new TogglePlatform(425, 280, 115, 20, "A", true), { skin: "default" }),
        new Switch(465, 210, "A", "ceiling", "player", "toggle"),
        new TogglePlatform(585, 335, 80, 20, "B", false),
        new WarpZone(460, 95, 55, 55, 40, 80, false),
        new RevealPlatform(10, 100, 100, 20, { x: -40, y: 20, w: 150, h: 80 }),
        new FakeExit(745, 425, undefined),
    ],
});
