import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/RentalManagement.css';

const RentalManagement = () => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, past
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchRentals();
  }, []);

  const fetchRentals = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    
    try {
      // Pobieramy laptopy, które są oznaczone jako wypożyczone (isRented=true)
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/rentals`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setRentals(response.data);
    } catch (err) {
      console.error('Błąd pobierania wypożyczeń:', err);
      let errorMessage = 'Nie udało się pobrać listy wypożyczeń.';
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Brak autoryzacji. Zaloguj się ponownie jako administrator.';
        } else if (err.response.status === 403) {
          errorMessage = 'Brak uprawnień. Ta funkcja jest dostępna tylko dla administratorów.';
        } else if (err.response.status === 404) {
          errorMessage = 'Nie znaleziono zasobu. Upewnij się, że serwer jest uruchomiony.';
        }
      } else if (err.request) {
        errorMessage = 'Brak odpowiedzi od serwera. Sprawdź, czy serwer jest uruchomiony.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEndRental = async (id) => {
    if (!window.confirm('Czy na pewno chcesz zakończyć to wypożyczenie?')) return;

    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/rentals/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      fetchRentals();
    } catch (err) {
      console.error('Błąd kończenia wypożyczenia:', err);
      setError('Nie udało się zakończyć wypożyczenia.');
    }
  };

  const handleConfirmRental = async (id) => {
    if (!window.confirm('Czy na pewno chcesz potwierdzić to wypożyczenie?')) return;
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/rentals/${id}/confirm`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      fetchRentals();
    } catch (err) {
      console.error('Błąd potwierdzania wypożyczenia:', err);
      setError('Nie udało się potwierdzić wypożyczenia.');
    }
  };

  const handleRejectRental = async (id) => {
    if (!window.confirm('Czy na pewno chcesz odrzucić ten wniosek o wypożyczenie?')) return;
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/rentals/${id}/reject`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      fetchRentals();
    } catch (err) {
      console.error('Błąd odrzucania wypożyczenia:', err);
      setError('Nie udało się odrzucić wniosku.');
    }
  };

  // Filtrowanie wypożyczeń
  const filteredRentals = () => {
    if (filter === 'all') return rentals;
    // Zmieniono filtr 'pending', aby obejmował także status null (traktowane jako oczekujące)
    if (filter === 'pending') {
      return rentals.filter(rental => rental.isRented && rental.rentalStatus !== 'confirmed');
    }
    if (filter === 'confirmed') {
      return rentals.filter(rental => rental.isRented && rental.rentalStatus === 'confirmed');
    }
    // Filtr 'past' może wymagać osobnego endpointu lub pobierania z historii
    return rentals;
  };

  // Uproszczono logikę getStatusBadge
  const getStatusBadge = (rental) => {
    if (rental.isRented && rental.rentalStatus === 'confirmed') {
      return <span className="badge badge-confirmed">Potwierdzone</span>;
    } else if (rental.isRented) {
      // Jeśli isRented=true i status nie jest 'confirmed', traktuj jako oczekujące
      // (Obejmuje 'pending', null, lub inne nieprawidłowe wartości)
      if (rental.rentalStatus !== 'pending') {
         // Wyświetl ostrzeżenie tylko jeśli status nie jest 'pending' (a oczekiwaliśmy go)
         console.warn(`Laptop ${rental._id} ma isRented=true, ale status inny niż 'pending'/'confirmed': ${rental.rentalStatus}`);
      }
      return <span className="badge badge-pending">Oczekujące</span>; // Usunięto (?) dla spójności
    } else {
       // Ten przypadek nie powinien wystąpić przy obecnym pobieraniu danych (GET /api/rentals zwraca tylko isRented=true)
       return <span className="badge badge-unknown">Nieznany</span>;
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL');
  };

  if (loading) return <div className="loading">Ładowanie wypożyczeń...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="rental-management">
      <h2>Zarządzanie wypożyczeniami</h2>
      
      <div className="filter-controls">
        <button 
          className={filter === 'all' ? 'active' : ''} 
          onClick={() => setFilter('all')}
        >
          Wszystkie
        </button>
        <button
          className={filter === 'pending' ? 'active' : ''}
          onClick={() => setFilter('pending')}
        >
          Oczekujące
        </button>
        <button
          className={filter === 'confirmed' ? 'active' : ''}
          onClick={() => setFilter('confirmed')}
        >
          Potwierdzone
        </button>
        {/* Można dodać filtr 'Zakończone' jeśli będzie endpoint do historii */}
      </div>
      
      {filteredRentals().length === 0 ? (
        <p className="no-rentals">Brak wypożyczeń do wyświetlenia.</p>
      ) : (
        <div className="rentals-list">
          {filteredRentals().map(rental => (
            <div key={rental._id} className="rental-card">
              <div className="rental-header" onClick={() => toggleExpand(rental._id)}>
                <div className="rental-summary">
                  <h3>{rental.brand} {rental.model}</h3>
                  <p>Nr seryjny: {rental.serialNumber || 'Brak'}</p>
                  {/* Dodano serialNumber */}
                  {/* Usunięto dane wnioskującego z nagłówka */}
                </div>
                <div className="rental-status">
                  {getStatusBadge(rental)}
                </div>
              </div>
              
              {expandedId === rental._id && (
                <div className="rental-details">
                  {/* Wyświetlanie danych klienta */}
                  {rental.rentalDetails && (
                    <div className="client-info">
                      <h4>Dane klienta</h4>
                      <p><strong>Imię i nazwisko:</strong> {rental.rentalDetails.fullName}</p>
                      <p><strong>Email:</strong> {rental.rentalDetails.email}</p>
                      <p><strong>Telefon:</strong> {rental.rentalDetails.phone}</p>
                      {/* Dodano wyświetlanie dat */}
                      <p><strong>Okres:</strong> {formatDate(rental.rentalDetails.startDate)} - {formatDate(rental.rentalDetails.endDate)}</p>
                      <p><strong>Data wniosku:</strong> {formatDate(rental.rentalDetails.rentedAt)}</p>
                    </div>
                  )}
                  
                  <div className="rental-actions">
                    {/* Przyciski dla statusu 'pending' */}
                    {/* Zmieniono warunek: pokaż przyciski, jeśli wypożyczenie jest aktywne i niepotwierdzone */}
                    {rental.isRented && rental.rentalStatus !== 'confirmed' && (
                      <>
                        <button
                          className="btn-confirm"
                          onClick={() => handleConfirmRental(rental._id)}
                        >
                          Potwierdź
                        </button>
                        <button
                          className="btn-reject" // Dodano klasę dla odrzucenia
                          onClick={() => handleRejectRental(rental._id)}
                        >
                          Odrzuć
                        </button>
                      </>
                    )}
                    {/* Przycisk dla statusu 'confirmed' */}
                    {rental.isRented && rental.rentalStatus === 'confirmed' && (
                      <button
                        className="btn-end"
                        onClick={() => handleEndRental(rental._id)}
                      >
                        Zakończ wypożyczenie
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RentalManagement;