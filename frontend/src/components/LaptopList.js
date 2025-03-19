import React, { useEffect, useState } from 'react';
import axios from 'axios';

const LaptopList = () => {
  const [laptops, setLaptops] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/laptops')
      .then(response => setLaptops(response.data))
      .catch(error => console.error('Błąd ładowania laptopów', error));
  }, []);

  return (
    <div>
      <h2>Lista laptopów</h2>
      <ul>
        {laptops.map((laptop) => (
          <li key={laptop.serialNumber}>
            <p><strong>{laptop.brand} {laptop.model}</strong></p>
            <img src={laptop.qrCode} alt="QR Code" width="150" />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LaptopList;
