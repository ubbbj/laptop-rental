import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL;

  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'Hasło musi mieć minimum 6 znaków';
    }
    if (!/\d/.test(password)) {
      return 'Hasło musi zawierać przynajmniej 1 cyfrę';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return 'Hasło musi zawierać przynajmniej 1 znak specjalny';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const passwordValidation = validatePassword(password);
    if (passwordValidation) {
      setError(passwordValidation);
      return;
    }

    if (password !== confirmPassword) {
      setError('Hasła nie są zgodne.');
      return;
    }

    if (!apiUrl) {
      setError('Błąd konfiguracji: Brak adresu URL API.');
      console.error('REACT_APP_API_URL is not defined in .env');
      return;
    }

    try {
      const response = await axios.post(`${apiUrl}/api/auth/register`, {
        email,
        password,
      });

      if (response.status === 201) {
        setSuccessMessage('Rejestracja udana! Zostaniesz przekierowany do logowania...');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Wystąpił błąd podczas rejestracji. Spróbuj ponownie.');
        console.error('Registration error:', err);
      }
    }
  };

  return (
    <div className="form-container">
      <h2>Rejestracja</h2>
      <form onSubmit={handleSubmit}>
        {error && <p className="error-message">{error}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Hasło (min. 6 znaków, 1 cyfra, 1 znak specjalny):</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Potwierdź hasło:</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>
        <button type="submit" className="submit-button">Zarejestruj się</button>
      </form>
    </div>
  );
}

export default RegisterForm;