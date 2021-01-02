require('better-logging')(console);

// interaces
interface stateInterface {
  users: string[];
  cycleAnimState: boolean;
  rainbowAnimState: boolean;
  SOS_WS_Relay_types: string[];
}
interface welcomeUserInterface {
  remoteAddress: string;
  builtInLed?: any;
}

interface actionsInterface {
  stripOff: (strip: any) => void;

  stripOffAnim: () => void;
  stripColorCyleAnim: (strip: any, fps: number) => void;
  stripDynamicRainbow: (strip: any, fps: number) => void;

  stripColorByHex: (strip: any, data: string) => void;
  onGoal: (strip: any) => void;
  onCountdownBegin: (strip: any, arrayOfColors?: [string, string, string]) => void;
}

// state
let state: stateInterface = {
  users: [],
  cycleAnimState: false,
  rainbowAnimState: false,
  SOS_WS_Relay_types: [
    'Shot on Goal',
    'Goal',
    'Save',
    'Assist',
    'MVP', /* end of the game */
    'Win',
    'Savior', /* every third save */
    'Bicycle Hit',
    'Epic Save',
    'Demolition' /* has a secondary target */
  ]
}

// functions
export const welcomeUser = (data: welcomeUserInterface) => {
  state.users.push(data.remoteAddress);
  console.warn(`[${data.remoteAddress}]: has connected`)

  if (data.builtInLed) { // blink esp8266 built in led
      data.builtInLed.blink();
      setTimeout(() => {
          data.builtInLed.fadeIn();
      }, 1000);
  }
}

function colorWheel( WheelPos: number ) {
  let r; let g; let b;
  WheelPos = 255 - WheelPos;

  if ( WheelPos < 85 ) {
    r = 255 - WheelPos * 3;
    g = 0;
    b = WheelPos * 3;
  } else if (WheelPos < 170) {
    WheelPos -= 85;
    r = 0;
    g = WheelPos * 3;
    b = 255 - WheelPos * 3;
  } else {
    WheelPos -= 170;
    r = WheelPos * 3;
    g = 255 - WheelPos * 3;
    b = 0;
  }
  // returns a string with the rgb value to be used as the parameter
  return 'rgb(' + r +',' + g + ',' + b + ')';
}


// utils
const util: any = {
  log: (type: string, action?: string) => {
    console.info(`[${type}]${': ' + action}`);
  }
}

// actions
export const action: actionsInterface = {

  stripOff: (strip) => {
    strip.off();
  },
  stripOffAnim: () => {
    state.cycleAnimState = false;
    state.rainbowAnimState = false;
    util.log("Action", "Off");
  },
  stripColorCyleAnim: (strip, fps) => {
    if (state.cycleAnimState === false) {
      state.rainbowAnimState = false;
      state.cycleAnimState = true;

      const colors = ['red', 'blue', 'yellow', 'cyan', 'magenta'];
      let current_colors = 0;
      util.log("Animation", "Color Cycle");
      const blinker = setInterval(function() {
        if (++current_colors === colors.length) current_colors = 0;
          if (state.cycleAnimState === true) {
            strip.color(colors[current_colors]); // blanks it out
            strip.show();
          } else {
            clearInterval(blinker);
          }
      }, 1000/fps);
    }
  },
  stripDynamicRainbow: (strip, fps) => {
    if (state.rainbowAnimState === false) {
      state.cycleAnimState = false;
      state.rainbowAnimState = true;
  
      let showColor;
      let cwi = 0; // colour wheel index (current position on colour wheel)
      util.log("Animation", "Rainbow");
      const rainbow = setInterval(function() {
        if (state.rainbowAnimState === true) {
          if (++cwi > 255) {
            cwi = 0;
          }
    
          for (let i = 0; i < strip.length; i++) {
            showColor = colorWheel( ( cwi+i ) & 255 );
            strip.pixel( i ).color( showColor );
          }
          strip.show();
        } else {
          clearInterval(rainbow);
        }
      }, 1000/fps);
    }
  },
  stripColorByHex: (strip, data) => {
    if (state.cycleAnimState === true || state.rainbowAnimState === true) {
      action.stripOffAnim();
      strip.color(data);
      strip.show();
    } else {
      strip.color(data);
      strip.show();
    }
    util.log("Color", data);
  },
  onGoal: (strip) => {
    let startTime = new Date().getTime();
    let colorSwitch = false;
    if (state.cycleAnimState === true || state.rainbowAnimState === true) {
      action.stripOffAnim();
    }
    util.log("Event", "Goal");
    setInterval(function () {
      if (new Date().getTime() - startTime > 3000) {  
        clearInterval(this);
        strip.off();
        action.stripDynamicRainbow(strip, 4);
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
    }, 250)
  },
  onCountdownBegin: (strip, arrayOfColors) => {  
    let startTime = new Date().getTime();
    let colorSwitch = 0;
    arrayOfColors = arrayOfColors || ["#e60000", "#ffff00", "#00e00b"];
    if (state.cycleAnimState === true || state.rainbowAnimState === true) {
      action.stripOffAnim();
    }
    util.log("Event", "Begin Countdown");
    setInterval(function () {
      if (new Date().getTime() - startTime > 3500) {
        clearInterval(this);
        strip.off();
        action.stripDynamicRainbow(strip, 4);
        return;
      }
      strip.color(arrayOfColors[colorSwitch]);
      strip.show();
      colorSwitch += 1;    
    }, 1000);
  }
}

// events for SOS-WS-Relay
export const SOS_WS_Relay_events = (type: string, strip: any ) => {
  switch (type) {
    case 'Goal': action.onGoal(strip);
    default: null
  }
}