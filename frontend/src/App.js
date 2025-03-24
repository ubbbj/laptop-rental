import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import LaptopList from './components/LaptopList';
import ScanQR from './components/ScanQR';
import './App.css';

const App = () => {
  return (
    <Router>
      <div className="App">
        <nav>
          <div>
            <Link to="/">Lista laptopów</Link>
            <Link to="/scan">Skanuj QR</Link>
          </div>
        </nav>
        <main>
          <Routes>
            <Route path="/" element={<LaptopList />} />
            <Route path="/scan" element={<ScanQR />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
