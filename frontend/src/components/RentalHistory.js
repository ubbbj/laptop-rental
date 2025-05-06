import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/RentalManagement.css';

const RentalHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/rentals/history`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setHistory(response.data);
      } catch (err) {
        console.error('Błąd pobierania historii wypożyczeń:', err);
        setError('Nie udało się pobrać historii wypożyczeń.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const toggleDetails = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'brak danych';
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <div className="loading">Ładowanie historii wypożyczeń...</div>;
  
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="rental-history-container">
      <h3>Historia wypożyczeń</h3>
      
      {history.length === 0 ? (
        <p className="no-rentals">Brak zakończonych wypożyczeń w historii.</p>
      ) : (
        <ul className="rental-list">
          {history.map(item => (
            <li key={item._id} className={`rental-item ${expandedId === item._id ? 'expanded' : ''}`}>
              <div className="rental-header" onClick={() => toggleDetails(item._id)}>
                <div className="rental-summary">
                  <h3>{item.brand} {item.model}</h3>
                  <p>SN: {item.serialNumber}</p>
                </div>
                <div className="rental-status">
                  <span className="badge badge-history">Zwrócony</span>
                </div>
              </div>
              
              {expandedId === item._id && (
                <div className="rental-details">
                  <div className="rental-dates">
                    <p><strong>Wypożyczono:</strong> {formatDate(item.rentedAt)}</p>
                    <p><strong>Zwrócono:</strong> {formatDate(item.returnedAt)}</p>
                    <p><strong>Wypożyczający:</strong> {item.rentedBy}</p>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RentalHistory;
