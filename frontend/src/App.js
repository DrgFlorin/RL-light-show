import React, { useState, useEffect } from 'react';
import { SketchPicker } from 'react-color';
import { Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import './app.css';

const ws = new WebSocket('ws://192.168.1.7:81');

function App() {
  

  const [color, setColor] = useState("#fff");

  const handleChangeColor = (color) => {
    setColor(color.hex);
  }

  const sendColor = (color) => {
    ws.send(color);
  }

  useEffect(() => {
    ws.onopen = () => {
      console.log("WS connected!");
    }
  },[])

  return (
    <div className="App">
      <div className="custom-contaier">
        <SketchPicker color={color} onChange={handleChangeColor}/>
        <Button variant="dark" className="btn1" onClick={() => sendColor(color)}>
          Set color
        </Button>
      </div>
    </div>
  );
}

export default App;

