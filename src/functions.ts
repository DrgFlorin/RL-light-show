// interaces
interface stateInterface {
  users: string[];
  SOS_WS_Relay_types: string[];
}
interface welcomeUserInterface {
  remoteAddress: string;
  builtInLed?: any;
}

interface actionsInterface {
  meow: (type: string) => void;
  onGoal: (strip: any) => void;
  onCountdownBegin: (strip: any, arrayOfColors?: [string, string, string]) => void;
}

// state
let state: stateInterface = {
  users: [],
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
  console.log(`[${data.remoteAddress}]: has connected`)

  if (data.builtInLed) { // blink esp8266 built in led
      data.builtInLed.blink();
      setTimeout(() => {
          data.builtInLed.fadeIn();
      }, 1000);
  }
}


// actions
export const action: actionsInterface = {

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
}

// events for SOS-WS-Relay
export const SOS_WS_Relay_events = (type: string, strip: any ) => {
  switch (type) {
    case 'Goal': action.onGoal(strip);
    default: null
  }
}