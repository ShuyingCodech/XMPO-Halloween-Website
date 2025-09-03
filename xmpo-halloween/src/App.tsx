import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import SeatSelection from "./pages/SeatSelection";
import Payment from "./pages/Payment";
import Confirmation from "./pages/Confirmation";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Success from "./pages/Success";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/seat-selection" element={<SeatSelection />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/confirmation" element={<Confirmation />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/success" element={<Success />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
