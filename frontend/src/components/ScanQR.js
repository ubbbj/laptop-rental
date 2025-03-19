import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from "html5-qrcode";

const ScanQR = () => {
  const [scanResult, setScanResult] = useState('');
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
          const scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 250 });
          
          scanner.render(
            (decodedText) => {
              setScanResult(decodedText);
              scanner.clear();
            },
            (error) => {
              console.warn("Błąd skanowania:", error);
            }
          );
          
          scannerRef.current = scanner;
        } catch (error) {
          console.error("Błąd inicjalizacji skanera:", error);
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

  return (
    <div>
      <h2>Skanuj kod QR</h2>
      {!scanResult ? (
        <div id="qr-reader" style={{ width: "300px" }}></div>
      ) : (
        <p>Wynik: {scanResult}</p>
      )}
    </div>
  );
};

export default ScanQR;