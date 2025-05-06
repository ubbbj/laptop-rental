import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from "html5-qrcode";
import axios from 'axios';

const ScanQR = () => {
  const [scanResult, setScanResult] = useState('');
  const [laptopInfo, setLaptopInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const [showRentalForm, setShowRentalForm] = useState(false);
  const [rentalData, setRentalData] = useState({
    fullName: '',
    email: '',
    phone: '',
    startDate: '',
    endDate: ''
  });
  const [rentalSuccess, setRentalSuccess] = useState(false);

  useEffect(() => {
    const startScanner = () => {
      const qrElement = document.getElementById("qr-reader");
      if (qrElement && !scannerRef.current) {
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
              if (scannerRef.current) {
                 scannerRef.current.clear().catch(err => console.error("Błąd czyszczenia po skanie:", err));
                 scannerRef.current = null;
              }
            },
            (error) => {
            }
          );
          
          scannerRef.current = scanner;
        } catch (error) {
          console.error("Błąd inicjalizacji skanera:", error);
          setError("Nie udało się zainicjalizować skanera QR. Sprawdź uprawnienia kamery.");
        }
      }
    };

    if (!scanResult) {
       const timeoutId = setTimeout(startScanner, 100);
       return () => clearTimeout(timeoutId);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear()
          .then(() => {
            scannerRef.current = null;
            console.log("Skaner wyczyszczony.");
          })
          .catch(error => {
            console.error("Błąd przy czyszczeniu skanera w cleanup:", error);
            scannerRef.current = null;
          });
      }
    };
  }, [scanResult]);

  const fetchLaptopInfo = async (url) => {
    setLoading(true);
    setError(null);

    const serialNumber = url.split('/').pop();
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/laptops/serial/${serialNumber}`);
      setLaptopInfo(response.data);
    } catch (err) {
      console.error("Błąd pobierania danych laptopa:", err);
      setError("Nie znaleziono informacji o laptopie.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRentalForm = () => {
    setShowRentalForm(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRentalData({
      ...rentalData,
      [name]: value
    });
  };

  const handleRentalSubmit = async (e) => {
    e.preventDefault();
    
    if (!laptopInfo) return;
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/rentals`,
        {
          laptopId: laptopInfo._id,
          ...rentalData
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setRentalSuccess(true);
      setShowRentalForm(false);
      setLaptopInfo({ ...laptopInfo, isRented: true, rentalStatus: 'pending' });
    } catch (err) {
      console.error("Błąd wysyłania wniosku o wypożyczenie:", err);
      setError("Nie udało się wysłać wniosku o wypożyczenie. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  };

  const cancelRentalForm = () => {
    setShowRentalForm(false);
    setRentalData({
      fullName: '',
      email: '',
      phone: '',
      startDate: '',
      endDate: ''
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
                <p>Status: {laptopInfo.isRented ? (laptopInfo.rentalStatus === 'pending' ? 'Oczekuje na potwierdzenie' : 'Wypożyczony') : 'Dostępny'}</p>
                
                {!laptopInfo.isRented && !showRentalForm && (
                  <div className="laptop-actions">
                    <button onClick={handleOpenRentalForm}>Wypożycz teraz</button>
                  </div>
                )}

                {showRentalForm && (
                  <div className="rental-form-container">
                    <h4>Formularz wypożyczenia laptopa</h4>
                    <form onSubmit={handleRentalSubmit}>
                      <div className="form-group">
                        <label htmlFor="startDate">Data rozpoczęcia:</label>
                        <input
                          type="date"
                          id="startDate"
                          name="startDate"
                          value={rentalData.startDate}
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
                          value={rentalData.endDate}
                          onChange={handleInputChange}
                          required
                          min={rentalData.startDate || new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="fullName">Imię i nazwisko:</label>
                        <input
                          type="text"
                          id="fullName"
                          name="fullName"
                          value={rentalData.fullName}
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
                          value={rentalData.email}
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
                          value={rentalData.phone}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                                            
                      <div className="form-actions">
                        <button type="submit" disabled={loading}>
                          {loading ? 'Przetwarzanie...' : 'Wyślij wniosek'}
                        </button>
                        <button type="button" onClick={cancelRentalForm}>
                          Anuluj
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {rentalSuccess && (
                  <div className="success-message">
                    <p>Wniosek o wypożyczenie został wysłany!</p>
                    <p>Administrator wkrótce go rozpatrzy.</p>
                  </div>
                )}
              </div>
            ) : (
              <p>Nie znaleziono informacji o laptopie.</p>
            )}
            
            <button onClick={() => {
              setScanResult('');
              setLaptopInfo(null);
              setShowRentalForm(false);
              setRentalSuccess(false);
              setError(null);
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
