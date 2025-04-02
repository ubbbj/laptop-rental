import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation, Navigate } from 'react-router-dom';
import LaptopList from './components/LaptopList';
import ScanQR from './components/ScanQR';
import AddLaptopForm from './components/AddLaptopForm';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import './App.css';

const App = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setIsAdmin(decoded.role === 'admin');
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Error decoding token:', error);
        setIsLoggedIn(false);
      }
    } else {
      setIsAdmin(false);
      setIsLoggedIn(false);
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAdmin(false);
    setIsLoggedIn(false);
    return <Navigate to="/" />;
  };

  return (
    <div className="App">
      <nav>
        <div className="nav-links">
          <Link to="/">Lista laptopów</Link>
          {isAdmin && <Link to="/add">Dodaj laptop</Link>}
          <Link to="/scan">Skanuj QR</Link>
          {isLoggedIn ? (
            <button onClick={handleLogout} className="logout-button">Wyloguj</button>
          ) : (
            <>
              <Link to="/login">Zaloguj</Link>
              <Link to="/register">Zarejestruj</Link>
            </>
          )}
        </div>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<LaptopList />} />
          <Route path="/add" element={<AddLaptopForm />} />
          <Route path="/scan" element={<ScanQR />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
        </Routes>
      </main>
    </div>
  );
};

export default () => (
  <Router>
    <App />
  </Router>
);
