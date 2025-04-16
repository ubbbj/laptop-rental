import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom'; // Import useParams
import { jwtDecode } from 'jwt-decode';

const AddLaptopForm = () => {
  const { id } = useParams(); // Get ID from URL params
  const isEditMode = Boolean(id); // Check if in edit mode
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    serialNumber: '',
    description: '', // Dodano opis
    specs: { // Dodano specyfikację
      cpu: '',
      ram: '',
      disk: ''
    },
    images: '' // Dodano pole na URL-e zdjęć (jako string)
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();
  const [initialLoading, setInitialLoading] = useState(isEditMode); // Loading state for fetching data in edit mode

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserRole(decoded.role);
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }

    // Fetch laptop data if in edit mode
    if (isEditMode) {
      setInitialLoading(true);
      axios.get(`${process.env.REACT_APP_API_URL}/api/laptops/${id}`) // Use GET by ID
        .then(response => {
          const laptopData = response.data;
          setFormData({
            brand: laptopData.brand || '',
            model: laptopData.model || '',
            serialNumber: laptopData.serialNumber || '',
            description: laptopData.description || '',
            specs: {
              cpu: laptopData.specs?.cpu || '',
              ram: laptopData.specs?.ram || '',
              disk: laptopData.specs?.disk || ''
            },
            images: laptopData.images?.join('\n') || '' // Convert array back to string for textarea
          });
          setInitialLoading(false);
        })
        .catch(error => {
          console.error('Error fetching laptop data:', error);
          setErrors({ api: 'Nie udało się załadować danych laptopa do edycji.' });
          setInitialLoading(false);
        });
    }
  }, [token, isEditMode, id]); // Add dependencies

  const validate = () => {
    const newErrors = {};
    if (!formData.brand.trim()) newErrors.brand = 'Marka jest wymagana';
    if (!formData.model.trim()) newErrors.model = 'Model jest wymagany';
    if (!formData.serialNumber.trim()) newErrors.serialNumber = 'Numer seryjny jest wymagany';
    // Można dodać walidację dla nowych pól, np.
    // if (!formData.description.trim()) newErrors.description = 'Opis jest wymagany';
    // if (!formData.specs.cpu.trim()) newErrors.cpu = 'CPU jest wymagane';
    // ... itd.
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Obsługa zagnieżdżonych pól specs
    if (name.startsWith('specs.')) {
      const specField = name.split('.')[1];
      setFormData(prevData => ({
        ...prevData,
        specs: {
          ...prevData.specs,
          [specField]: value
        }
      }));
    } else {
      setFormData(prevData => ({
        ...prevData,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    if (!validate()) return;
    
    try {
      setLoading(true);
      // Przygotowanie danych do wysłania (przetworzenie images)
      const imagesArray = formData.images.split(/[\n,]+/).map(url => url.trim()).filter(url => url);
      const dataToSend = {
        ...formData,
        images: imagesArray
      };

      let response;
      if (isEditMode) {
        // Send PUT request for editing
        response = await axios.put(
          `${process.env.REACT_APP_API_URL}/api/laptops/${id}`,
          dataToSend,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } else {
        // Send POST request for adding
        response = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/laptops`,
          dataToSend,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }
       
      setSuccess(true);
      // Navigate back to the list after a delay
      setTimeout(() => navigate('/'), 1500);
    } catch (error) {
      console.error('Add laptop error:', error);
      if (error.response?.status === 403) {
        setErrors({ api: 'Brak uprawnień. Włącz JavaScript i odśwież stronę.' });
      } else {
        setErrors({ api: `Wystąpił błąd podczas ${isEditMode ? 'aktualizacji' : 'dodawania'} laptopa` });
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Show loading indicator while fetching data in edit mode
  if (initialLoading) {
    return <div className="loading-container"><div className="loading"><div className="loading-spinner"></div><p>Ładowanie danych do edycji...</p></div></div>;
  }

  if (!token) {
    return (
      <div className="login-required">
        <p>Aby dodać laptopa, musisz być zalogowany jako administrator.</p>
        <button onClick={() => navigate('/login')}>Zaloguj się</button>
      </div>
    );
  }

  if (userRole !== 'admin') {
    return (
      <div className="admin-required">
        <p>Tylko administrator może dodawać laptopy.</p>
      </div>
    );
  }

  return (
    <div className="add-laptop-form">
      <h2>{isEditMode ? 'Edytuj laptop' : 'Dodaj nowy laptop'}</h2>
      
      {errors.api && <div className="error-message">{errors.api}</div>}
      
      {success && (
        <div className="success-message">
          Pomyślnie {isEditMode ? 'zaktualizowano' : 'dodano'} laptopa! Zaraz zostaniesz przekierowany...
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="brand">Marka:</label>
          <input
            type="text"
            id="brand"
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            className={errors.brand ? 'input-error' : ''}
          />
          {errors.brand && <span className="error-text">{errors.brand}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="model">Model:</label>
          <input
            type="text"
            id="model"
            name="model"
            value={formData.model}
            onChange={handleChange}
            className={errors.model ? 'input-error' : ''}
          />
          {errors.model && <span className="error-text">{errors.model}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="serialNumber">Numer seryjny:</label>
          <input
            type="text"
            id="serialNumber"
            name="serialNumber"
            value={formData.serialNumber}
            onChange={handleChange}
            className={errors.serialNumber ? 'input-error' : ''}
          />
          {errors.serialNumber && <span className="error-text">{errors.serialNumber}</span>}
        </div>

        {/* Dodano nowe pola formularza */}
        <div className="form-group">
          <label htmlFor="description">Opis:</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
          ></textarea>
          {/* Można dodać walidację */}
        </div>

        <fieldset className="form-group specs-group">
          <legend>Specyfikacja</legend>
          <div className="form-group">
            <label htmlFor="specs.cpu">CPU:</label>
            <input
              type="text"
              id="specs.cpu"
              name="specs.cpu"
              value={formData.specs.cpu}
              onChange={handleChange}
            />
            {/* Można dodać walidację */}
          </div>
          <div className="form-group">
            <label htmlFor="specs.ram">RAM:</label>
            <input
              type="text"
              id="specs.ram"
              name="specs.ram"
              value={formData.specs.ram}
              onChange={handleChange}
            />
            {/* Można dodać walidację */}
          </div>
          <div className="form-group">
            <label htmlFor="specs.disk">Dysk:</label>
            <input
              type="text"
              id="specs.disk"
              name="specs.disk"
              value={formData.specs.disk}
              onChange={handleChange}
            />
            {/* Można dodać walidację */}
          </div>
        </fieldset>

        <div className="form-group">
          <label htmlFor="images">Zdjęcia (URL-e, oddzielone przecinkiem lub nową linią):</label>
          <textarea
            id="images"
            name="images"
            value={formData.images}
            onChange={handleChange}
            rows="3"
          ></textarea>
          {/* Można dodać walidację */}
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="submit-button"
        >
          {loading ? (isEditMode ? 'Aktualizowanie...' : 'Dodawanie...') : (isEditMode ? 'Zaktualizuj laptop' : 'Dodaj laptop')}
        </button>
      </form>
    </div>
  );
};

export default AddLaptopForm;