"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('better-logging')(console);
// functions
const functions_1 = require("./functions");
// imports
const rocketLeagueWS_1 = require("./rocketLeagueWS");
const webSocket = require("ws");
let five = require("johnny-five");
const johnny_five_1 = require("johnny-five");
const { Led } = require("johnny-five");
let pixel = require("node-pixel"); // to use rgb ring
const { EtherPortClient } = require('etherport-client'); // to use esp8266 through wifi
const wss = new webSocket.Server({
    port: 81
});
/*
// connection details for the board esp8266
const board = new five.Board({
    port: new EtherPortClient({
        host: '192.168.1.150', // esp ip
        port: 3030
    }),
    repl: false
});
*/
// connect to arduino through serial port
const board = new johnny_five_1.Board({
    port: "COM5",
    repl: false
});
/*
                    esp9266 pinout

                     Wifi Antenna
                 +-----------------+
           --    |                 |    16
           --    |                 |    5
           --    |                 |    4
           10    |                 |    0
            9    |     ESP82666    |    2
           --    |     NODEMCU     |    3.3 V
           --    |                 |    GND
           --    |                 |    14
           --    |                 |    12
          GND    |                 |    13
        3.3 V    |                 |    15
           --    |                 |    RX - 03
           --    |                 |    TX - 01
        3.3 V    |                 |    GND
           --    |                 |    3.3 V
                 |                 |
                 +-----------------+
                      USB PORT


transistor: 2N 2222A
viewing from the flat side: emitter, base, Collector
*/
// start board
const connectToTheBoard = () => {
    console.info('Trying to connect...');
    board.on('ready', () => {
        // I2C display 2x16
        let I2C_Display = new five.LCD({
            controller: "PCF8574T"
        });
        const strip = new pixel.Strip({
            board: board,
            controller: "FIRMATA",
            strips: [{ pin: 6, length: 16 },],
            gamma: 2.8,
        });
        strip.on("ready", function () {
            console.info("Strip is ready to use");
            rocketLeagueWS_1.WsSubscribers.init(49322, false);
            rocketLeagueWS_1.WsSubscribers.subscribe("game", "pre_countdown_begin", (data) => {
                functions_1.action.onCountdownBegin(strip);
            });
            rocketLeagueWS_1.WsSubscribers.subscribe("game", "statfeed_event", (data) => {
                console.debug(data, ["statfeed_event"]);
                functions_1.SOS_WS_Relay_events(data.type, strip);
            });
            // rainbow anim on start
            functions_1.action.stripDynamicRainbow(strip, 5);
            wss.on('connection', function (ws, req) {
                functions_1.welcomeUser({
                    remoteAddress: req.socket.remoteAddress,
                });
                ws.on('message', function (data) {
                    new Promise((resolve, reject) => {
                        // what to do before anything else
                        resolve();
                    })
                        .then(() => {
                        if (data.slice(0, 6) === "text1=" && data.length < 16) {
                            I2C_Display.cursor(0, 0).print(data.slice(6));
                        }
                        if (data.slice(0, 6) === "text2=" && data.length < 16) {
                            I2C_Display.cursor(1, 0).print(data.slice(6));
                        }
                        if (data === "off") {
                            functions_1.action.stripOff(strip);
                            functions_1.action.stripOffAnim();
                        }
                        if (data[0] === "#") {
                            functions_1.action.stripColorByHex(strip, data);
                        }
                        if (data === "white") {
                            strip.color("#fff");
                            strip.show();
                        }
                        if (data === "red") {
                            strip.color("#ff1100");
                            strip.show();
                        }
                        if (data === "cycle") {
                            functions_1.action.stripColorCyleAnim(strip, 2.5);
                        }
                        if (data === "rainbow") {
                            functions_1.action.stripDynamicRainbow(strip, 10);
                        }
                    })
                        .catch((err) => {
                        console.error(err.message);
                    });
                    // .then(() => {
                    //     console.log('Do this, no matter what happened before');
                    // });
                });
                ws.on('close', () => {
                    console.warn(`a user has closed the connection`);
                });
            });
        });
        board.on("exit", () => {
            strip.off();
        });
    });
};
connectToTheBoard();
//# sourceMappingURL=server.js.map