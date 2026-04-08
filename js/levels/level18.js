// Level 18 — "Trap Door"

LEVELS.push({
    name: "Trap Door",
    levelType: "normal",
    backgroundTheme: "plainSlate",
    width: 800,
    height: 2400,
    cameraAnchorY: 0.9,
    player: {
        x: 40,
        y: 450
    },
    exit: {
        x: 745,
        y: 435,
        w: 30,
        h: 40,
        revealed: false
    },
    platforms: [
        {
            x: 0,
            y: 0,
            w: 10,
            h: 2400
        },
        {
            x: 790,
            y: 0,
            w: 10,
            h: 2400
        },
        {
            x: 0,
            y: 0,
            w: 800,
            h: 10
        },
        {
            x: 0,
            y: 2370,
            w: 800,
            h: 30,
            locked: true
        },
        {
            x: 0,
            y: 480,
            w: 650,
            h: 20
        },
        {
            x: 340,
            y: 580,
            w: 460,
            h: 20
        },
        {
            x: 0,
            y: 970,
            w: 800,
            h: 20
        },
        {
            x: 0,
            y: 1460,
            w: 415,
            h: 20,
            locked: true
        },
        {
            x: 5,
            y: 1155,
            w: 70,
            h: 20
        },
        {
            x: 75,
            y: 1155,
            w: 330,
            h: 20,
            material: "ice"
        },
        {
            x: 490,
            y: 1330,
            w: 295,
            h: 20,
            material: "lava"
        },
        {
            x: 490,
            y: 1295,
            w: 125,
            h: 20
        },
        {
            x: 730,
            y: 1130,
            w: 70,
            h: 20
        },
        {
            x: 730,
            y: 1045,
            w: 70,
            h: 20
        },
        {
            x: 15,
            y: 1330,
            w: 355,
            h: 20,
            material: "lava"
        },
        {
            x: 470,
            y: 1460,
            w: 330,
            h: 20,
            locked: false
        },
        {
            x: 0,
            y: 1950,
            w: 800,
            h: 20,
            skin: "default"
        },
        {
            x: 0,
            y: 1860,
            w: 150,
            h: 20,
            skin: "default"
        },
        {
            x: 655,
            y: 1860,
            w: 145,
            h: 20,
            skin: "default"
        },
        {
            x: 15,
            y: 2350,
            w: 130,
            h: 20,
            material: "lava"
        },
        {
            x: 150,
            y: 2350,
            w: 125,
            h: 20,
            material: "lava",
            locked: false
        },
        {
            x: 725,
            y: 480,
            w: 75,
            h: 20,
            skin: "default"
        },
        {
            x: 650,
            y: 480,
            w: 75,
            h: 20,
            oneWay: true,
            oneWayDir: "down",
            skin: "default"
        }
    ],
    spikes: [
        {
            x: 345,
            y: 1135,
            w: 20,
            h: 20,
            dir: "up"
        },
        {
            x: 320,
            y: 1135,
            w: 20,
            h: 20,
            dir: "up"
        },
        {
            x: 395,
            y: 1440,
            w: 20,
            h: 20,
            dir: "up"
        },
        {
            x: 470,
            y: 1440,
            w: 20,
            h: 20,
            dir: "up"
        },
        {
            x: 290,
            y: 2350,
            w: 20,
            h: 20,
            dir: "up"
        },
        {
            x: 320,
            y: 2350,
            w: 20,
            h: 20,
            dir: "up"
        },
        {
            x: 350,
            y: 2350,
            w: 20,
            h: 20,
            dir: "up"
        },
        {
            x: 380,
            y: 2350,
            w: 20,
            h: 20,
            dir: "up"
        },
        {
            x: 410,
            y: 2350,
            w: 20,
            h: 20,
            dir: "up"
        },
        {
            x: 440,
            y: 2350,
            w: 20,
            h: 20,
            dir: "up"
        },
        {
            x: 470,
            y: 2350,
            w: 20,
            h: 20,
            dir: "up"
        },
        {
            x: 500,
            y: 2350,
            w: 20,
            h: 20,
            dir: "up"
        },
        {
            x: 530,
            y: 2350,
            w: 20,
            h: 20,
            dir: "up"
        }
    ],
    traps: [
        new WarpZone(195, 385, 90, 90, 290, 945, true),
        new CameraRoom(0, 0),
        new CameraRoom(0, 490),
        new WarpZone(25, 875, 90, 90, 385, 550, false),
        Object.assign(new MovingExit([
            {
                x: 745,
                y: 535
            },
            {
                x: 380,
                y: 925
            },
            {
                x: 15,
                y: 785
            }
        ]), {
            triggerDist: 40
        }),
        new FakeExit(745, 925, undefined),
        new CameraRoom(0, 980),
        new WarpZone(65, 720, 30, 105, 160, 1130, false),
        new RevealPlatform(10, 830, 200, 20, {
            x: 15,
            y: 770,
            w: 195,
            h: 80
        }),
        Object.assign(new WarpDoor(20, 1110, 290, 945, false), {
            skin: "exit"
        }),
        Object.assign(new MovingPlatform(405, 1155, 80, 20, 615, 1295, 0.5, undefined), {
            skin: "default"
        }),
        new FakeFloor(695, 1295, 105, 20),
        new FakeSpikes([
            {
                x: 445,
                y: 1440,
                w: 20,
                h: 20,
                dir: "up"
            }
        ]),
        new FakeSpikes([
            {
                x: 420,
                y: 1440,
                w: 20,
                h: 20,
                dir: "up"
            }
        ]),
        new FakeExit(230, 1250, undefined),
        new TogglePlatform(225, 1295, 180, 20, "A", false),
        new Switch(780, 1000, "A", "left", "player", "toggle"),
        new HiddenPlatform(545, 1145, 120, 20),
        new FakeFloor(730, 1220, 70, 20),
        Object.assign(new ShootingSpike(10, 1275, "right", -90, 4, null, null, false), {
            triggerMode: "area",
            triggerArea: {
                x: 285,
                y: 1240,
                w: 80,
                h: 55
            },
            maxRange: 395
        }),
        Object.assign(new WarpDoor(20, 1415, 160, 1130, false), {
            skin: "exit"
        }),
        new FakeFloor(415, 1460, 55, 20),
        new WarpZone(400, 1485, 90, 90, 385, 1920, false),
        new CameraRoom(0, 1470),
        Object.assign(new WarpDoor(25, 1905, 140, 2105, true), {
            skin: "exit"
        }),
        Object.assign(new WarpDoor(25, 1815, 665, 2095, false), {
            skin: "exit"
        }),
        Object.assign(new WarpDoor(745, 1815, 490, 450, false), {
            skin: "exit"
        }),
        Object.assign(new WarpDoor(745, 1905, 390, 2090, false), {
            skin: "exit"
        }),
        Object.assign(new FallingCeiling(555, 1975, 110, 30, 585, false), {
            triggerMode: "y",
            triggerY: 2350,
            stopY: 500
        }),
        Object.assign(new FallingCeiling(675, 1975, 110, 30, 685, false), {
            triggerMode: "y",
            triggerY: 2350,
            stopY: 2500
        }),
        new CameraTrigger(25, 2005, 755, 130, true, 0.5, 0.5)
    ],
});
