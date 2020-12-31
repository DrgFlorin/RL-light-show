"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.action = exports.welcomeUser = void 0;
// state
let state = {
    users: []
};
// functions
const welcomeUser = (data) => {
    state.users.push(data.remoteAddress);
    console.log(`[${data.remoteAddress}]: has connected`);
    if (data.builtInLed) { // blink esp8266 built in led
        data.builtInLed.blink();
        setTimeout(() => {
            data.builtInLed.fadeIn();
        }, 1000);
    }
};
exports.welcomeUser = welcomeUser;
// actions
exports.action = {
    meow: (type) => {
        return (type + " i love turtles");
    }
};
//# sourceMappingURL=functions.js.map