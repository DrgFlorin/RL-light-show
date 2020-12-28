import { Board } from "johnny-five";

// imports
let five = require("johnny-five");
let pixel = require("node-pixel");
const { Led } = require("johnny-five");

const { EtherPortClient } = require('etherport-client');

const webSocket = require("ws");
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

// connect to arduino cable
const board = new Board({
    port: "COM5",
    repl: false
});

let strip: any = null;

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

// interaces
interface stateInterface {
    users: string[];
}
interface welcomeUserInterface {
    remoteAddress: string;
    builtInLed?: any;
}

// state
let state: stateInterface = {
    users: []
}

// functions
const welcomeUser = (data: welcomeUserInterface) => {
    state.users.push(data.remoteAddress);
    console.log(`[${data.remoteAddress}]: has connected`)

    if (data.builtInLed) {
        data.builtInLed.blink();
        setTimeout(() => {
            data.builtInLed.fadeIn();
        }, 1000);
    }
    
}

// start board
board.on('ready', () => {

    strip = new pixel.Strip({
        board: board,
        controller: "FIRMATA",
        strips: [ {pin: 6, length: 16}, ],
        gamma: 2.8,
    });
    
    strip.on("ready", function () {
        console.log("Strip is ready to use");
        wss.on('connection', function (ws: any, req: any) {
            welcomeUser({
                remoteAddress: req.connection.remoteAddress,
                // builtInLed: builtInLeds[0]
            });
    
            
    
            ws.on('message', function (data: string) {
    
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
                if (data === "anim") {
                    strip.pixel(0).color('#074');
                    strip.pixel(6).color('#ff1100');
                    strip.shift(1, pixel.FORWARD, true);
                    strip.show();
                }
    
            });
            
            ws.on('close', () => {
                console.log(`a user has closed the connection`);
            })
            
        })
    });
    
})