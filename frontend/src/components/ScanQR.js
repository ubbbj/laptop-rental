import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from "html5-qrcode";
import axios from 'axios';

const ScanQR = () => {
  const [scanResult, setScanResult] = useState('');
  const [laptopInfo, setLaptopInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [reservationData, setReservationData] = useState({
    startDate: '',
    endDate: '',
    fullName: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [reservationSuccess, setReservationSuccess] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const qrElement = document.getElementById("qr-reader");
      if (!qrElement) {
        console.error("Element #qr-reader nie istnieje w DOM");
        return;
      }

      if (!scannerRef.current) {
        try {
          const scanner = new Html5QrcodeScanner("qr-reader", { 
            fps: 10, 
            qrbox: 250,
            rememberLastUsedCamera: true,
          });
          
          scanner.render(
            (decodedText) => {
              setScanResult(decodedText);
              fetchLaptopInfo(decodedText);
              scanner.clear();
            },
            (error) => {
              console.warn("Błąd skanowania:", error);
            }
          );
          
          scannerRef.current = scanner;
        } catch (error) {
          console.error("Błąd inicjalizacji skanera:", error);
          setError("Nie udało się zainicjalizować skanera QR. Sprawdź uprawnienia kamery.");
        }
      }
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (error) {
          console.error("Błąd przy czyszczeniu skanera:", error);
        }
      }
    };
  }, []);

  const fetchLaptopInfo = async (url) => {
    setLoading(true);
    setError(null);

    const serialNumber = url.split('/').pop();
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/laptops/${serialNumber}`);
      setLaptopInfo(response.data);
    } catch (err) {
      console.error("Błąd pobierania danych laptopa:", err);
      setError("Nie znaleziono informacji o laptopie.");
    } finally {
      setLoading(false);
    }
  };

  const handleRentLaptop = async () => {
    if (!laptopInfo) return;

    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/laptops/${laptopInfo.serialNumber}/rent`);
      setLaptopInfo({ ...laptopInfo, isRented: true });
    } catch (err) {
      console.error("Błąd wypożyczania laptopa:", err);
      setError("Nie udało się wypożyczyć laptopa.");
    }
  };

  const handleReserveLaptop = () => {
    setShowReservationForm(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReservationData({
      ...reservationData,
      [name]: value
    });
  };

  const handleReservationSubmit = async (e) => {
    e.preventDefault();
    
    if (!laptopInfo) return;
    setLoading(true);
    setError(null);

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/laptops/${laptopInfo.serialNumber}/reserve`, {
        ...reservationData,
        laptopId: laptopInfo._id
      });
      
      setReservationSuccess(true);
      setShowReservationForm(false);
      setLaptopInfo({ ...laptopInfo, isReserved: true });
    } catch (err) {
      console.error("Błąd rezerwacji laptopa:", err);
      setError("Nie udało się zarezerwować laptopa. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  };

  const cancelReservation = () => {
    setShowReservationForm(false);
    setReservationData({
      startDate: '',
      endDate: '',
      fullName: '',
      email: '',
      phone: '',
      notes: ''
    });
  };

  return (
    <div>
      <h2>Skanuj kod QR laptopa</h2>
      
      <div className="qr-scanner-container">
        {!scanResult ? (
          <>
            <p>Umieść kod QR w polu widzenia kamery, aby zeskanować.</p>
            <div id="qr-reader" style={{ width: "100%" }}></div>
            {error && <div className="error-message">{error}</div>}
          </>
        ) : (
          <div className="scan-result">
            <h3>Zeskanowano kod QR</h3>
            <p>URL: {scanResult}</p>
            
            {loading ? (
              <p>Ładowanie informacji o laptopie...</p>
            ) : laptopInfo ? (
              <div className="laptop-info">
                <h4>{laptopInfo.brand} {laptopInfo.model}</h4>
                <p>Numer seryjny: {laptopInfo.serialNumber}</p>
                <p>Status: {laptopInfo.isRented ? 'Wypożyczony' : (laptopInfo.isReserved ? 'Zarezerwowany' : 'Dostępny')}</p>
                
                {!laptopInfo.isRented && !laptopInfo.isReserved && !showReservationForm && (
                  <div className="laptop-actions">
                    <button onClick={handleRentLaptop}>Wypożycz teraz</button>
                    <button onClick={handleReserveLaptop}>Zarezerwuj laptop</button>
                  </div>
                )}

                {showReservationForm && (
                  <div className="reservation-form-container">
                    <h4>Formularz rezerwacji laptopa</h4>
                    <form onSubmit={handleReservationSubmit}>
                      <div className="form-group">
                        <label htmlFor="startDate">Data rozpoczęcia:</label>
                        <input
                          type="date"
                          id="startDate"
                          name="startDate"
                          value={reservationData.startDate}
                          onChange={handleInputChange}
                          required
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="endDate">Data zakończenia:</label>
                        <input
                          type="date"
                          id="endDate"
                          name="endDate"
                          value={reservationData.endDate}
                          onChange={handleInputChange}
                          required
                          min={reservationData.startDate || new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="fullName">Imię i nazwisko:</label>
                        <input
                          type="text"
                          id="fullName"
                          name="fullName"
                          value={reservationData.fullName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="email">Email:</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={reservationData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="phone">Telefon:</label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={reservationData.phone}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="notes">Dodatkowe uwagi:</label>
                        <textarea
                          id="notes"
                          name="notes"
                          value={reservationData.notes}
                          onChange={handleInputChange}
                          rows="3"
                        ></textarea>
                      </div>
                      
                      <div className="form-actions">
                        <button type="submit" disabled={loading}>
                          {loading ? 'Przetwarzanie...' : 'Zarezerwuj'}
                        </button>
                        <button type="button" onClick={cancelReservation}>
                          Anuluj
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {reservationSuccess && (
                  <div className="success-message">
                    <p>Laptop został pomyślnie zarezerwowany!</p>
                    <p>Wkrótce otrzymasz potwierdzenie na podany adres email.</p>
                  </div>
                )}
              </div>
            ) : (
              <p>Nie znaleziono informacji o laptopie.</p>
            )}
            
            <button onClick={() => {
              setScanResult('');
              setLaptopInfo(null);
              setShowReservationForm(false);
              setReservationSuccess(false);
              if (scannerRef.current) {
                try {
                  scannerRef.current.render(
                    (decodedText) => {
                      setScanResult(decodedText);
                      fetchLaptopInfo(decodedText);
                      scannerRef.current.clear();
                    },
                    (error) => {
                      console.warn("Błąd skanowania:", error);
                    }
                  );
                } catch (error) {
                  console.error("Błąd przy ponownym uruchamianiu skanera:", error);
                }
              }
            }}>
              Skanuj ponownie
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanQR;
