# Rocket League Light Show

Is a script to interract with [SOS-WS-Relay](https://gitlab.com/bakkesplugins/sos/sos-ws-relay) which interracts with [SOS-Plugin](https://gitlab.com/bakkesplugins/sos/sos-plugin) and [BakkesMod](https://www.bakkesmod.com/)

## Installation

You need node version 12 + and BakkesMod installed

After you download the repo, install the node_modules

```
npm install
```

Download the SOS-WS-Relay and install it aswell with the same command as above

## Usage

BakkesMod needs to run as administrator.
After that you can start the SOS-WS-Relay with:

```
npm run relay
```

And now you can start the Rocket League Light Show ^^ using:

```
npm start
```

## Compile Typescript
```
tsc -w  or tsc --watch
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## Events
```
statfeed_event:
  main_target: {
    id: string,
    name: string
  },
  secondary_target: {
    id: string,
    name: string
  }
  types: [
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
```