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
export const action: any = {

  meow: (type: string) => {
    return (type + " i love turtles");
  }
  
}