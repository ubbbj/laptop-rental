import React, { useEffect, useState } from 'react';
import axios from 'axios';

const LaptopList = ({ isAdmin }) => {
  const [laptops, setLaptops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('brand'); // Default sort by brand
  const [expandedSpecsId, setExpandedSpecsId] = useState(null); // Stan dla rozwijanej specyfikacji

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

  // Funkcja do przełączania widoczności specyfikacji
  const toggleSpecs = (id) => {
    setExpandedSpecsId(expandedSpecsId === id ? null : id);
  };

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
              
              <div className="laptop-image">
                {/* Wyświetl pierwsze zdjęcie jako miniaturkę, jeśli istnieje */}
                {laptop.images && laptop.images.length > 0 && (
                  <img src={laptop.images[0]} alt={`${laptop.brand} ${laptop.model}`} width="100" />
                )}
              </div>              <div className="laptop-details">
                <p><strong>Numer seryjny:</strong> {laptop.serialNumber}</p>
                
                {/* Przycisk do rozwijania specyfikacji i opisu */}
                {(laptop.description || (laptop.specs && (laptop.specs.cpu || laptop.specs.ram || laptop.specs.disk))) && (
                  <button
                    onClick={() => toggleSpecs(laptop._id)}
                    className="toggle-specs-button"
                  >
                    {expandedSpecsId === laptop._id ? 'Ukryj szczegóły' : 'Pokaż szczegóły'}
                  </button>
                )}
                
                {/* Warunkowe renderowanie opisu i specyfikacji */}
                {expandedSpecsId === laptop._id && (
                  <div className="laptop-expanded-details">
                    {laptop.description && (
                      <div className="laptop-description">
                        <strong>Opis:</strong> 
                        <p>{laptop.description}</p>
                      </div>
                    )}
                      {laptop.specs && (laptop.specs.cpu || laptop.specs.ram || laptop.specs.disk) && (
                      <div className="laptop-specs expanded">
                        <strong>Specyfikacja:</strong>
                        <ul>
                          {laptop.specs.cpu && <li>CPU: {laptop.specs.cpu}</li>}
                          {laptop.specs.ram && <li>RAM: {laptop.specs.ram}</li>}
                          {laptop.specs.disk && <li>Dysk: {laptop.specs.disk}</li>}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
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
                        {/* Poprawiono użycie ID zamiast serialNumber */}
                        await axios.delete(`${process.env.REACT_APP_API_URL}/api/laptops/${laptop._id}`, {
                          headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`
                          }
                        });
                        // Filtrowanie po _id
                        setLaptops(laptops.filter(l => l._id !== laptop._id));
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