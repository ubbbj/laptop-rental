import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from "html5-qrcode";
import axios from 'axios';

const ScanQR = () => {
  const [scanResult, setScanResult] = useState('');
  const [laptopInfo, setLaptopInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);

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
      const response = await axios.get(`http://localhost:5000/api/laptops/${serialNumber}`);
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
      await axios.put(`http://localhost:5000/api/laptops/${laptopInfo.serialNumber}/rent`);
      setLaptopInfo({ ...laptopInfo, isRented: true });
    } catch (err) {
      console.error("Błąd wypożyczania laptopa:", err);
      setError("Nie udało się wypożyczyć laptopa.");
    }
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
                <p>Status: {laptopInfo.isRented ? 'Wypożyczony' : 'Dostępny'}</p>
                
                {!laptopInfo.isRented && (
                  <button onClick={handleRentLaptop}>Wypożycz laptop</button>
                )}
              </div>
            ) : (
              <p>Nie znaleziono informacji o laptopie.</p>
            )}
            
            <button onClick={() => {
              setScanResult('');
              setLaptopInfo(null);
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
