import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const AddLaptopForm = () => {
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    serialNumber: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserRole(decoded.role);
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, [token]);

  const validate = () => {
    const newErrors = {};
    if (!formData.brand.trim()) newErrors.brand = 'Marka jest wymagana';
    if (!formData.model.trim()) newErrors.model = 'Model jest wymagany';
    if (!formData.serialNumber.trim()) newErrors.serialNumber = 'Numer seryjny jest wymagany';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    if (!validate()) return;
    
    try {
      setLoading(true);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/laptops`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setSuccess(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (error) {
      console.error('Add laptop error:', error);
      if (error.response?.status === 403) {
        setErrors({ api: 'Brak uprawnień. Włącz JavaScript i odśwież stronę.' });
      } else {
        setErrors({ api: 'Wystąpił błąd podczas dodawania laptopa' });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="login-required">
        <p>Aby dodać laptopa, musisz być zalogowany jako administrator.</p>
        <button onClick={() => navigate('/login')}>Zaloguj się</button>
      </div>
    );
  }

  if (userRole !== 'admin') {
    return (
      <div className="admin-required">
        <p>Tylko administrator może dodawać laptopy.</p>
      </div>
    );
  }

  return (
    <div className="add-laptop-form">
      <h2>Dodaj nowy laptop</h2>
      
      {errors.api && <div className="error-message">{errors.api}</div>}
      
      {success && (
        <div className="success-message">
          Pomyślnie dodano laptopa! Zaraz zostaniesz przekierowany...
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="brand">Marka:</label>
          <input
            type="text"
            id="brand"
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            className={errors.brand ? 'input-error' : ''}
          />
          {errors.brand && <span className="error-text">{errors.brand}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="model">Model:</label>
          <input
            type="text"
            id="model"
            name="model"
            value={formData.model}
            onChange={handleChange}
            className={errors.model ? 'input-error' : ''}
          />
          {errors.model && <span className="error-text">{errors.model}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="serialNumber">Numer seryjny:</label>
          <input
            type="text"
            id="serialNumber"
            name="serialNumber"
            value={formData.serialNumber}
            onChange={handleChange}
            className={errors.serialNumber ? 'input-error' : ''}
          />
          {errors.serialNumber && <span className="error-text">{errors.serialNumber}</span>}
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="submit-button"
        >
          {loading ? 'Dodawanie...' : 'Dodaj laptop'}
        </button>
      </form>
    </div>
  );
};

export default AddLaptopForm;