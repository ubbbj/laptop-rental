import React, { useEffect, useState } from 'react';
import axios from 'axios';

const LaptopList = ({ isAdmin }) => {
  const [laptops, setLaptops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('brand'); // Default sort by brand

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

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const handleSort = (e) => {
    setSortBy(e.target.value);
  };

  const filteredLaptops = laptops.filter(laptop => 
    laptop.brand.toLowerCase().includes(searchTerm) || 
    laptop.model.toLowerCase().includes(searchTerm) ||
    laptop.serialNumber.toLowerCase().includes(searchTerm)
  );

  const sortedLaptops = [...filteredLaptops].sort((a, b) => {
    if (sortBy === 'status') {
      return (a.isRented === b.isRented) ? 0 : a.isRented ? 1 : -1;
    }
    if (sortBy === 'brand') {
      return a.brand.localeCompare(b.brand);
    }
    if (sortBy === 'model') {
      return a.model.localeCompare(b.model);
    }
    return 0;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Ładowanie danych...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div>
      <h2>Lista dostępnych laptopów</h2>
      
      <div className="filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Szukaj laptopa..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
        
        <div className="sort-box">
          <label htmlFor="sort">Sortuj według:</label>
          <select id="sort" value={sortBy} onChange={handleSort} className="sort-select">
            <option value="brand">Marki</option>
            <option value="model">Modelu</option>
            <option value="status">Statusu</option>
          </select>
        </div>
      </div>
      
      {sortedLaptops.length === 0 ? (
        <div className="no-results">
          <p>Brak laptopów spełniających kryteria wyszukiwania.</p>
        </div>
      ) : (
        <div className="laptop-list">
          {sortedLaptops.map((laptop) => (
            <div className={`laptop-card ${laptop.isRented ? 'rented' : ''}`} key={laptop._id || laptop.serialNumber}>
              <div className="laptop-header">
                <h3>{laptop.brand} {laptop.model}</h3>
                <div className={`laptop-status ${laptop.isRented ? 'status-rented' : 'status-available'}`}>
                  {laptop.isRented ? 'Wypożyczony' : 'Dostępny'}
                </div>
              </div>
              
              <div className="laptop-details">
                <p><strong>Numer seryjny:</strong> {laptop.serialNumber}</p>
                {laptop.isRented && <p><strong>Data wypożyczenia:</strong> {new Date(laptop.rentedAt).toLocaleDateString()}</p>}
              </div>
              
              <div className="laptop-qr">
                <img src={laptop.qrCode} alt="Kod QR" width="150" />
              </div>
              
              {isAdmin && (
                <button
                  className="delete-button"
                  onClick={async () => {
                    if (window.confirm(`Czy na pewno chcesz usunąć laptop ${laptop.serialNumber}?`)) {
                      try {
                        await axios.delete(`${process.env.REACT_APP_API_URL}/api/laptops/${laptop.serialNumber}`, {
                          headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`
                          }
                        });
                        setLaptops(laptops.filter(l => l.serialNumber !== laptop.serialNumber));
                      } catch (error) {
                        console.error('Błąd usuwania laptopa:', error);
                        alert('Nie udało się usunąć laptopa');
                      }
                    }
                  }}
                >
                  <span role="img" aria-label="delete">🗑️</span> Usuń laptop
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LaptopList;