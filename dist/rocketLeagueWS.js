"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WsSubscribers = void 0;
const webSocket = require("ws");
exports.WsSubscribers = {
    __subscribers: {},
    websocket: undefined,
    webSocketConnected: false,
    registerQueue: [],
    init: function (port, debug, debugFilters) {
        port = port || 49322;
        debug = debug || false;
        if (debug) {
            if (debugFilters !== undefined) {
                console.warn("WebSocket Debug Mode enabled with filtering. Only events not in the filter list will be dumped");
            }
            else {
                console.warn("WebSocket Debug Mode enabled without filters applied. All events will be dumped to console");
                console.warn("To use filters, pass in an array of 'channel:event' strings to the second parameter of the init function");
            }
        }
        exports.WsSubscribers.webSocket = new webSocket("ws://localhost:" + port);
        exports.WsSubscribers.webSocket.onmessage = function (event) {
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
                }
                else if (debugFilters && debugFilters.indexOf(jEvent.event) < 0) {
                    console.log(channel, event_event, jEvent);
                }
            }
            exports.WsSubscribers.triggerSubscribers(channel, event_event, jEvent.data);
        };
        exports.WsSubscribers.webSocket.onopen = function () {
            exports.WsSubscribers.triggerSubscribers("ws", "open");
            exports.WsSubscribers.webSocketConnected = true;
            exports.WsSubscribers.registerQueue.forEach((r) => {
                exports.WsSubscribers.send("wsRelay", "register", r);
            });
            exports.WsSubscribers.registerQueue = [];
        };
        exports.WsSubscribers.webSocket.onerror = function () {
            exports.WsSubscribers.triggerSubscribers("ws", "error");
            exports.WsSubscribers.webSocketConnected = false;
        };
        exports.WsSubscribers.webSocket.onclose = function () {
            exports.WsSubscribers.triggerSubscribers("ws", "close");
            exports.WsSubscribers.webSocketConnected = false;
        };
    },
    /**
     * Add callbacks for when certain events are thrown
     * Execution is guaranteed to be in First In First Out order
     * @param channels
     * @param events
     * @param callback
     */
    subscribe: function (channels, events, callback) {
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
        channels.forEach(function (c) {
            events.forEach(function (e) {
                if (!exports.WsSubscribers.__subscribers.hasOwnProperty(c)) {
                    exports.WsSubscribers.__subscribers[c] = {};
                }
                if (!exports.WsSubscribers.__subscribers[c].hasOwnProperty(e)) {
                    exports.WsSubscribers.__subscribers[c][e] = [];
                    if (exports.WsSubscribers.webSocketConnected) {
                        exports.WsSubscribers.send("wsRelay", "register", `${c}:${e}`);
                    }
                    else {
                        exports.WsSubscribers.registerQueue.push(`${c}:${e}`);
                    }
                }
                exports.WsSubscribers.__subscribers[c][e].push(callback);
            });
        });
    },
    clearEventCallbacks: function (channel, event) {
        if (exports.WsSubscribers.__subscribers.hasOwnProperty(channel) && exports.WsSubscribers.__subscribers[channel].hasOwnProperty(event)) {
            exports.WsSubscribers.__subscribers[channel] = {};
        }
    },
    triggerSubscribers: function (channel, event, data) {
        if (exports.WsSubscribers.__subscribers.hasOwnProperty(channel) && exports.WsSubscribers.__subscribers[channel].hasOwnProperty(event)) {
            exports.WsSubscribers.__subscribers[channel][event].forEach(function (callback) {
                if (callback instanceof Function) {
                    callback(data);
                }
            });
        }
    },
    send: function (channel, event, data) {
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
        }
        else {
            let cEvent = channel + ":" + event;
            exports.WsSubscribers.webSocket.send(JSON.stringify({
                'event': cEvent,
                'data': data
            }));
        }
    }
};
//# sourceMappingURL=rocketLeagueWS.js.map