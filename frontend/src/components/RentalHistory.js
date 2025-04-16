import React, { useState, useEffect } from 'react';
import axios from 'axios';
// Możesz dodać import stylów, jeśli są potrzebne
// import '../styles/RentalHistory.css';

const RentalHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      try {
        // TODO: Zaktualizuj URL endpointu API dla historii wypożyczeń
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

  if (loading) return <div className="loading">Ładowanie historii...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="rental-history-container">
      <h3>Historia wypożyczeń</h3>
      {history.length === 0 ? (
        <p>Brak zakończonych wypożyczeń.</p>
      ) : (
        <ul>
          {history.map(item => (
            <li key={item._id}>
              {/* Poprawiono dostęp do pól - bezpośrednio z item */}
              Laptop: {item.brand} {item.model} (SN: {item.serialNumber}) -
              Wypożyczający: {item.rentedBy} -
              Data zwrotu: {new Date(item.returnedAt).toLocaleDateString('pl-PL')}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RentalHistory;
