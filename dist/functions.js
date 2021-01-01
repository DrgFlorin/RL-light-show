"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOS_WS_Relay_events = exports.action = exports.welcomeUser = void 0;
require('better-logging')(console);
// state
let state = {
    users: [],
    cycleAnimState: false,
    rainbowAnimState: false,
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
    console.warn(`[${data.remoteAddress}]: has connected`);
    if (data.builtInLed) { // blink esp8266 built in led
        data.builtInLed.blink();
        setTimeout(() => {
            data.builtInLed.fadeIn();
        }, 1000);
    }
};
exports.welcomeUser = welcomeUser;
function colorWheel(WheelPos) {
    let r;
    let g;
    let b;
    WheelPos = 255 - WheelPos;
    if (WheelPos < 85) {
        r = 255 - WheelPos * 3;
        g = 0;
        b = WheelPos * 3;
    }
    else if (WheelPos < 170) {
        WheelPos -= 85;
        r = 0;
        g = WheelPos * 3;
        b = 255 - WheelPos * 3;
    }
    else {
        WheelPos -= 170;
        r = WheelPos * 3;
        g = 255 - WheelPos * 3;
        b = 0;
    }
    // returns a string with the rgb value to be used as the parameter
    return 'rgb(' + r + ',' + g + ',' + b + ')';
}
// actions
exports.action = {
    stripOff: (strip) => {
        strip.off();
    },
    stripOffAnim: () => {
        state.cycleAnimState = false;
        state.rainbowAnimState = false;
    },
    stripColorCyleAnim: (strip, fps) => {
        state.rainbowAnimState = false;
        state.cycleAnimState = true;
        const colors = ['red', 'blue', 'yellow', 'cyan', 'magenta'];
        let current_colors = 0;
        const blinker = setInterval(function () {
            if (++current_colors === colors.length)
                current_colors = 0;
            if (state.cycleAnimState === true) {
                strip.color(colors[current_colors]); // blanks it out
                strip.show();
            }
            else {
                clearInterval(blinker);
            }
        }, 1000 / fps);
    },
    stripDynamicRainbow: (strip, fps) => {
        state.cycleAnimState = false;
        state.rainbowAnimState = true;
        let showColor;
        let cwi = 0; // colour wheel index (current position on colour wheel)
        const rainbow = setInterval(function () {
            if (state.rainbowAnimState === true) {
                if (++cwi > 255) {
                    cwi = 0;
                }
                for (let i = 0; i < strip.length; i++) {
                    showColor = colorWheel((cwi + i) & 255);
                    strip.pixel(i).color(showColor);
                }
                strip.show();
            }
            else {
                clearInterval(rainbow);
            }
        }, 1000 / fps);
    },
    stripColorByHex: (strip, data) => {
        if (state.cycleAnimState === true || state.rainbowAnimState === true) {
            exports.action.stripOffAnim();
            strip.color(data);
            strip.show();
        }
        else {
            strip.color(data);
            strip.show();
        }
    },
    onGoal: (strip) => {
        let startTime = new Date().getTime();
        let colorSwitch = false;
        if (state.cycleAnimState === true || state.rainbowAnimState === true) {
            exports.action.stripOffAnim();
        }
        setInterval(function () {
            if (new Date().getTime() - startTime > 3000) {
                clearInterval(this);
                strip.off();
                exports.action.stripDynamicRainbow(strip, 10);
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
        if (state.cycleAnimState === true || state.rainbowAnimState === true) {
            exports.action.stripOffAnim();
        }
        setInterval(function () {
            if (new Date().getTime() - startTime > 3500) {
                clearInterval(this);
                strip.off();
                exports.action.stripDynamicRainbow(strip, 10);
                return;
            }
            strip.color(arrayOfColors[colorSwitch]);
            strip.show();
            colorSwitch += 1;
        }, 1000);
    }
};
// events for SOS-WS-Relay
const SOS_WS_Relay_events = (type, strip) => {
    switch (type) {
        case 'Goal': exports.action.onGoal(strip);
        default: null;
    }
};
exports.SOS_WS_Relay_events = SOS_WS_Relay_events;
//# sourceMappingURL=functions.js.map