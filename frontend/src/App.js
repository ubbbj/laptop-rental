import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import LaptopList from './components/LaptopList';
import ScanQR from './components/ScanQR';

const App = () => {
  return (
    <Router>
      <nav>
        <Link to="/">Lista laptopów</Link> | <Link to="/scan">Skanuj QR</Link>
      </nav>
      <Routes>
        <Route path="/" element={<LaptopList />} />
        <Route path="/scan" element={<ScanQR />} />
      </Routes>
    </Router>
  );
};

export default App;
