import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
// Możesz dodać import stylów, np. import '../styles/LaptopRentalForm.css';

const LaptopRentalForm = () => {
  const { serialNumber } = useParams();
  const navigate = useNavigate();
  const [laptop, setLaptop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    startDate: '',
    endDate: '',
  });
  const [submitStatus, setSubmitStatus] = useState({ success: false, message: '' });

  useEffect(() => {
    const fetchLaptop = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/laptops/serial/${serialNumber}`);
        setLaptop(response.data);
        if (response.data.isRented) {
          setError('Ten laptop jest już wypożyczony lub oczekuje na potwierdzenie.');
        }
      } catch (err) {
        console.error('Błąd pobierania danych laptopa:', err);
        setError(err.response?.data?.error || 'Nie udało się pobrać danych laptopa. Sprawdź numer seryjny.');
      } finally {
        setLoading(false);
      }
    };

    fetchLaptop();
  }, [serialNumber]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitStatus({ success: false, message: '' });

    if (!laptop || laptop.isRented) {
      setError('Nie można wypożyczyć tego laptopa.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Musisz być zalogowany, aby wypożyczyć laptop.');
      // Opcjonalnie: przekieruj do logowania
      // navigate('/login');
      return;
    }

    try {
      const rentalData = {
        ...formData,
        laptopId: laptop._id, // Przekazujemy ID laptopa
      };
      
      await axios.post(`${process.env.REACT_APP_API_URL}/api/rentals`, rentalData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSubmitStatus({ success: true, message: 'Wniosek o wypożyczenie został złożony pomyślnie! Oczekuj na potwierdzenie administratora.' });
      // Opcjonalnie wyczyść formularz lub przekieruj
      // setFormData({ fullName: '', email: '', phone: '', startDate: '', endDate: '' });
      // navigate('/'); 
    } catch (err) {
      console.error('Błąd składania wniosku:', err);
      setError(err.response?.data?.message || 'Wystąpił błąd podczas składania wniosku.');
    }
  };

  if (loading) return <div className="loading">Ładowanie danych laptopa...</div>;
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="laptop-rental-form-container"> {/* Dodaj odpowiednią klasę dla stylów */}
      <h2>Formularz wypożyczenia laptopa</h2>
      
      {error && <div className="error-message" style={{ marginBottom: '15px' }}>{error}</div>}
      
      {laptop && !laptop.isRented && (
        <>
          <div className="laptop-details-summary"> {/* Dodaj klasę dla stylów */}
            <h3>Wybrany laptop:</h3>
            <p><strong>Marka:</strong> {laptop.brand}</p>
            <p><strong>Model:</strong> {laptop.model}</p>
            <p><strong>Nr seryjny:</strong> {laptop.serialNumber}</p>
            {laptop.description && <p><strong>Opis:</strong> {laptop.description}</p>}
            {/* Możesz dodać więcej szczegółów, np. specyfikację */}
          </div>

          {!submitStatus.success ? (
            <form onSubmit={handleSubmit}>
              <h3>Wprowadź swoje dane:</h3>
              <div className="form-group"> {/* Dodaj klasy dla stylów */}
                <label htmlFor="fullName">Imię i nazwisko:</label>
                <input type="text" id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="email">Adres e-mail:</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Numer telefonu:</label>
                <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="startDate">Data rozpoczęcia:</label>
                {/* Add min attribute to prevent past dates */}
                <input type="date" id="startDate" name="startDate" value={formData.startDate} onChange={handleChange} required min={today} />
              </div>
              <div className="form-group">
                <label htmlFor="endDate">Data zakończenia:</label>
                {/* Add min attribute, ensuring it's at least the start date or today */}
                <input type="date" id="endDate" name="endDate" value={formData.endDate} onChange={handleChange} required min={formData.startDate || today} />
              </div>
              <button type="submit" disabled={loading || !!error}>Złóż wniosek o wypożyczenie</button>
            </form>
          ) : (
            <div className="success-message">{submitStatus.message}</div>
          )}
        </>
      )}
      
      {/* Komunikat jeśli laptop nie został znaleziony lub jest już wypożyczony (obsłużone w error) */}
      {/* Można dodać przycisk powrotu */}
      <button onClick={() => navigate(-1)} style={{ marginTop: '20px' }}>Powrót</button>

    </div>
  );
};

export default LaptopRentalForm;
