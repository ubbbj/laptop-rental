import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import { BrowserRouter as Router, Route, Routes, Link, useLocation, Navigate } from 'react-router-dom';
import LaptopList from './components/LaptopList';
import ScanQR from './components/ScanQR';
import AddLaptopForm from './components/AddLaptopForm';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import RentalManagement from './components/RentalManagement';
// Removed duplicate import
import { jwtDecode } from 'jwt-decode';
import './App.css';

const App = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const location = useLocation();
  const [theme, setTheme] = useState(() => {
    // Get theme from localStorage or default to 'light'
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setIsAdmin(decoded.role === 'admin');
        setIsLoggedIn(true);
        setUsername(decoded.email || 'Użytkownik');
      } catch (error) {
        console.error('Error decoding token:', error);
        setIsLoggedIn(false);
      }
    } else {
      setIsAdmin(false);
      setIsLoggedIn(false);
    }
  }, [location]); // Keep this useEffect for auth check

  // Effect to apply theme class to body and save to localStorage
  useEffect(() => {
    document.body.classList.remove('light-mode', 'dark-mode'); // Remove previous classes
    document.body.classList.add(`${theme}-mode`);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

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
          <Link to="/">
            <span role="img" aria-label="laptops">💻</span> Lista laptopów
          </Link>
            {isAdmin && 
            <Link to="/add">
              <span role="img" aria-label="add">➕</span> Dodaj laptop
            </Link>
          }
          
          {isAdmin && 
            <Link to="/rentals">
              <span role="img" aria-label="rentals">💻</span> Wypożyczenia
            </Link>
          }
          
          <Link to="/scan">
            <span role="img" aria-label="scan">🔍</span> Skanuj QR
          </Link>
          
          {isLoggedIn ? (
            <>
              <span style={{color: 'white', marginLeft: 'auto', padding: '15px 10px'}}>
                {isAdmin ? (
                  <>
                    <span role="img" aria-label="admin">🛡️</span> Admin
                  </>
                ) : (
                  <>
                    <span role="img" aria-label="user">👤</span> Użytkownik
                  </>
                )}
              </span>
              <button onClick={handleLogout} className="logout-button">
                <span role="img" aria-label="logout">🚪</span> Wyloguj
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{marginLeft: 'auto'}}>
                <span role="img" aria-label="login">🔑</span> Zaloguj
              </Link>
              <Link to="/register">
                <span role="img" aria-label="register">📝</span> Zarejestruj
              </Link>
            </>
          )}
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="theme-toggle-button"
            style={{ marginLeft: isLoggedIn ? '10px' : 'auto', marginRight: '10px', padding: '10px 15px', background: 'rgba(255, 255, 255, 0.2)', border: 'none', color: 'white', borderRadius: '5px', cursor: 'pointer' }}
            aria-label={`Przełącz na tryb ${theme === 'light' ? 'ciemny' : 'jasny'}`}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<LaptopList isAdmin={isAdmin} />} />
          <Route path="/add" element={isAdmin ? <AddLaptopForm /> : <Navigate to="/" />} />
          <Route path="/scan" element={<ScanQR />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/rentals" element={isAdmin ? <RentalManagement /> : <Navigate to="/" />} />
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