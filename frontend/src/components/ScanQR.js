import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from "html5-qrcode";

const ScanQR = () => {
  const [scanResult, setScanResult] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 250 });

    scanner.render(
      (decodedText) => {
        setScanResult(decodedText);
        scanner.clear(); // Zatrzymaj skanowanie po wykryciu kodu QR
      },
      (error) => {
        console.warn("Błąd skanowania:", error);
      }
    );

    scannerRef.current = scanner;

    return () => scanner.clear();
  }, []);

  return (
    <div>
      <h2>Skanuj kod QR</h2>
      {!scanResult ? <div id="qr-reader" style={{ width: "300px" }}></div> : <p>Wynik: {scanResult}</p>}
    </div>
  );
};

export default ScanQR;
