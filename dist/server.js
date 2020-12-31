"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
console.log(functions_1.action.meow("haubauciai"));
// start board
const connectToTheBoard = () => {
    console.log("Trying to connect...");
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
            console.log("Strip is ready to use");
            rocketLeagueWS_1.WsSubscribers.init(49322, false);
            rocketLeagueWS_1.WsSubscribers.subscribe("game", "pre_countdown_begin", (data) => {
                console.log(data);
                let startTime = new Date().getTime();
                let colorSwitch = 0;
                let colorArray = ["#e60000", "#ffff00", "#00e00b"];
                setInterval(function () {
                    if (new Date().getTime() - startTime > 3700) {
                        clearInterval(this);
                        strip.off();
                        return;
                    }
                    strip.color(colorArray[colorSwitch]);
                    strip.show();
                    colorSwitch += 1;
                }, 1000);
            });
            rocketLeagueWS_1.WsSubscribers.subscribe("game", "statfeed_event", (data) => {
                console.log(data, ["statfeed_event"]);
                let startTime = new Date().getTime();
                if (data.type === "Goal") {
                    let colorSwitch = false;
                    setInterval(function () {
                        if (new Date().getTime() - startTime > 3000) {
                            clearInterval(this);
                            strip.off();
                            return;
                        }
                        if (colorSwitch) {
                            strip.color("#FF0000");
                            strip.show();
                            colorSwitch = !colorSwitch;
                        }
                        else {
                            strip.color("#0037fb");
                            strip.show();
                            colorSwitch = !colorSwitch;
                        }
                    }, 250);
                }
            });
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
                            strip.off();
                        }
                        if (data[0] === "#") {
                            strip.color(data);
                            strip.show();
                        }
                        if (data === "white") {
                            strip.color("#fff");
                            strip.show();
                        }
                        if (data === "red") {
                            strip.color("#ff1100");
                            strip.show();
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
                    console.log(`a user has closed the connection`);
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