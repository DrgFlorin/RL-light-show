"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOS_WS_Relay_events = exports.action = exports.welcomeUser = void 0;
// state
let state = {
    users: [],
    SOS_WS_Relay_types: [
        'Shot on Goal',
        'Goal',
        'Save',
        'Assist',
        'MVP',
        'Win',
        'Savior',
        'Bicycle Hit',
        'Epic Save',
        'Demolition' /* has a secondary target */
    ]
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
    },
    onGoal: (strip) => {
        let startTime = new Date().getTime();
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
    },
    onCountdownBegin: (strip, arrayOfColors) => {
        let startTime = new Date().getTime();
        let colorSwitch = 0;
        arrayOfColors = arrayOfColors || ["#e60000", "#ffff00", "#00e00b"];
        setInterval(function () {
            if (new Date().getTime() - startTime > 3500) {
                clearInterval(this);
                strip.off();
                return;
            }
            strip.color(arrayOfColors[colorSwitch]);
            strip.show();
            colorSwitch += 1;
        }, 1000);
    }
};
const SOS_WS_Relay_events = (type, strip) => {
    switch (type) {
        case 'Goal': exports.action.onGoal(strip);
    }
};
exports.SOS_WS_Relay_events = SOS_WS_Relay_events;
//# sourceMappingURL=functions.js.map