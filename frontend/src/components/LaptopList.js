import React, { useEffect, useState } from 'react';
import axios from 'axios';

const LaptopList = () => {
  const [laptops, setLaptops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios.get(`${process.env.REACT_APP_API_URL}/api/laptops`)
      .then(response => {
        setLaptops(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Błąd ładowania laptopów', error);
        setError('Nie udało się załadować listy laptopów. Spróbuj ponownie później.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="loading">Ładowanie danych...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div>
      <h2>Lista dostępnych laptopów</h2>
      
      {laptops.length === 0 ? (
        <p>Brak laptopów w bazie danych.</p>
      ) : (
        <div className="laptop-list">
          {laptops.map((laptop) => (
            <div className="laptop-card" key={laptop._id || laptop.serialNumber}>
              <h3>{laptop.brand} {laptop.model}</h3>
              <p>Numer seryjny: {laptop.serialNumber}</p>
              
              <div className={`laptop-status ${laptop.isRented ? 'status-rented' : 'status-available'}`}>
                {laptop.isRented ? 'Wypożyczony' : 'Dostępny'}
              </div>
              
              {laptop.isRented && (
                <p>Wypożyczony przez: {laptop.rentedBy}</p>
              )}
              
              <img src={laptop.qrCode} alt="Kod QR" width="150" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LaptopList;
