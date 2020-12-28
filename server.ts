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

// connect to rocket league ws-relay.js using websockets
const WsSubscribers: any = {
    __subscribers: {},
    websocket: undefined,
    webSocketConnected: false,
    registerQueue: [],
    init: function(port: number, debug: any, debugFilters: any) {
        port = port || 49322;
        debug = debug || false;
        if (debug) {
            if (debugFilters !== undefined) {
                console.warn("WebSocket Debug Mode enabled with filtering. Only events not in the filter list will be dumped");
            } else {
                console.warn("WebSocket Debug Mode enabled without filters applied. All events will be dumped to console");
                console.warn("To use filters, pass in an array of 'channel:event' strings to the second parameter of the init function");
            }
        }
        WsSubscribers.webSocket = new webSocket("ws://localhost:" + port);
        WsSubscribers.webSocket.onmessage = function (event: any) {
            let jEvent = JSON.parse(event.data);
            if (!jEvent.hasOwnProperty('event')) {
                return;
            }
            let eventSplit = jEvent.event.split(':');
            let channel = eventSplit[0];
            let event_event = eventSplit[1];
            if (debug) {
                if (!debugFilters) {
                    console.log(channel, event_event, jEvent);
                } else if (debugFilters && debugFilters.indexOf(jEvent.event) < 0) {
                    console.log(channel, event_event, jEvent);
                }
            }
            WsSubscribers.triggerSubscribers(channel, event_event, jEvent.data);
        };
        WsSubscribers.webSocket.onopen = function () {
            WsSubscribers.triggerSubscribers("ws", "open");
            WsSubscribers.webSocketConnected = true;
            WsSubscribers.registerQueue.forEach((r: any) => {
                WsSubscribers.send("wsRelay", "register", r);
            });
            WsSubscribers.registerQueue = [];
        };
        WsSubscribers.webSocket.onerror = function () {
            WsSubscribers.triggerSubscribers("ws", "error");
            WsSubscribers.webSocketConnected = false;
        };
        WsSubscribers.webSocket.onclose = function () {
            WsSubscribers.triggerSubscribers("ws", "close");
            WsSubscribers.webSocketConnected = false;
        };
    },
    /**
     * Add callbacks for when certain events are thrown
     * Execution is guaranteed to be in First In First Out order
     * @param channels
     * @param events
     * @param callback
     */
    subscribe: function(channels: any, events: any, callback: any) {
        if (typeof channels === "string") {
            let channel = channels;
            channels = [];
            channels.push(channel);
        }
        if (typeof events === "string") {
            let event = events;
            events = [];
            events.push(event);
        }
        channels.forEach(function(c: any) {
            events.forEach(function (e: any) {
                if (!WsSubscribers.__subscribers.hasOwnProperty(c)) {
                    WsSubscribers.__subscribers[c] = {};
                }
                if (!WsSubscribers.__subscribers[c].hasOwnProperty(e)) {
                    WsSubscribers.__subscribers[c][e] = [];
                    if (WsSubscribers.webSocketConnected) {
                        WsSubscribers.send("wsRelay", "register", `${c}:${e}`);
                    } else {
                        WsSubscribers.registerQueue.push(`${c}:${e}`);
                    }
                }
                WsSubscribers.__subscribers[c][e].push(callback);
            });
        })
    },
    clearEventCallbacks: function (channel: any, event: any) {
        if (WsSubscribers.__subscribers.hasOwnProperty(channel) && WsSubscribers.__subscribers[channel].hasOwnProperty(event)) {
            WsSubscribers.__subscribers[channel] = {};
        }
    },
    triggerSubscribers: function (channel: any, event: any, data: any) {
        if (WsSubscribers.__subscribers.hasOwnProperty(channel) && WsSubscribers.__subscribers[channel].hasOwnProperty(event)) {
            WsSubscribers.__subscribers[channel][event].forEach(function(callback: any) {
                if (callback instanceof Function) {
                    callback(data);
                }
            });
        }
    },
    send: function (channel: any, event: any, data: any) {
        if (typeof channel !== 'string') {
            console.error("Channel must be a string");
            return;
        }
        if (typeof event !== 'string') {
            console.error("Event must be a string");
            return;
        }
        if (channel === 'local') {
            this.triggerSubscribers(channel, event, data);
        } else {
            let cEvent = channel + ":" + event;
            WsSubscribers.webSocket.send(JSON.stringify({
                'event': cEvent,
                'data': data
            }));
        }
    }
};

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

        WsSubscribers.init(49322, false);
        WsSubscribers.subscribe("game", "statfeed_event", (data: any) => {
            let startTime = new Date().getTime();
            if (data.main_target.name === "ClearOFF" && data.type === "Goal") {
                let colorSwitch = false;
                setInterval(function(){
                    if(new Date().getTime() - startTime > 3000){
                        clearInterval(this);
                        strip.off();
                        return;
                    }
                    if (colorSwitch) {
                        strip.color("#FF0000");
                        strip.show();
                        colorSwitch = !colorSwitch
                    } else {
                        strip.color("#0037fb");
                        strip.show();
                        colorSwitch = !colorSwitch
                    }
                }, 250);
                
            }
        })

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