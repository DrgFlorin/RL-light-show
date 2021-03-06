const webSocket = require("ws");

export const WsSubscribers: any = {
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