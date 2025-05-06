import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const AddLaptopForm = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    serialNumber: '',
    description: '',
    specs: {
      cpu: '',
      ram: '',
      disk: ''
    },
    images: ''
  });
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const fileInputRef = useRef(null);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserRole(decoded.role);
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }

    if (isEditMode) {
      setInitialLoading(true);
      axios.get(`${process.env.REACT_APP_API_URL}/api/laptops/${id}`)
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
            images: laptopData.images?.join('\n') || ''
          });
          setInitialLoading(false);
        })
        .catch(error => {
          console.error('Error fetching laptop data:', error);
          setErrors({ api: 'Nie udało się załadować danych laptopa do edycji.' });
          setInitialLoading(false);
        });
    }
  }, [token, isEditMode, id]);

  const validate = () => {
    const newErrors = {};
    if (!formData.brand.trim()) newErrors.brand = 'Marka jest wymagana';
    if (!formData.model.trim()) newErrors.model = 'Model jest wymagany';
    if (!formData.serialNumber.trim()) newErrors.serialNumber = 'Numer seryjny jest wymagany';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
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

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadedImages(prevImages => [...prevImages, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prevPreviews => [...prevPreviews, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setUploadedImages(prevImages => prevImages.filter((_, i) => i !== index));
    setImagePreviews(prevPreviews => prevPreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    if (!validate()) return;
    
    try {
      setLoading(true);
      
      const imagesArray = formData.images.split(/[\n,]+/)
        .map(url => url.trim())
        .filter(url => url);
      
      const formDataToSend = new FormData();
      
      formDataToSend.append('brand', formData.brand);
      formDataToSend.append('model', formData.model);
      formDataToSend.append('serialNumber', formData.serialNumber);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('specs', JSON.stringify(formData.specs));
      formDataToSend.append('imageUrls', JSON.stringify(imagesArray));
      
      uploadedImages.forEach((file, index) => {
        formDataToSend.append('files', file);
      });

      let response;
      if (isEditMode) {
        response = await axios.put(
          `${process.env.REACT_APP_API_URL}/api/laptops/${id}`,
          formDataToSend,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      } else {
        response = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/laptops`,
          formDataToSend,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      }
       
      setSuccess(true);
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

        <div className="form-group">
          <label htmlFor="description">Opis:</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
          ></textarea>
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
            placeholder="np. https://example.com/image1.jpg, https://example.com/image2.jpg"
          ></textarea>
        </div>

        <div className="form-group">
          <label>Dodaj własne zdjęcia:</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            ref={fileInputRef}
            style={{ display: 'none' }}
          />
          <div className="file-upload-container">
            <button 
              type="button"
              className="file-upload-button"
              onClick={() => fileInputRef.current.click()}
            >
              Wybierz pliki
            </button>
            <span className="file-info">
              {uploadedImages.length > 0 ? `Wybrano plików: ${uploadedImages.length}` : 'Nie wybrano żadnych plików'}
            </span>
          </div>

          {imagePreviews.length > 0 && (
            <div className="image-preview-container">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="image-preview">
                  <img src={preview} alt={`Preview ${index + 1}`} />
                  <button 
                    type="button" 
                    className="remove-image" 
                    onClick={() => removeImage(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
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