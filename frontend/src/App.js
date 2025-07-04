import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import GameBoard from "./components/GameBoard";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<GameBoard />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;