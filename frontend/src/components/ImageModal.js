import React from 'react';

const ImageModal = ({ image, altText, onClose }) => {
  // Zamykanie modalu przy kliknięciu poza obrazkiem
  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('image-modal-backdrop')) {
      onClose();
    }
  };

  return (
    <div className="image-modal-backdrop" onClick={handleBackdropClick}>
      <div className="image-modal-content">
        <button className="image-modal-close" onClick={onClose}>×</button>
        <img src={image} alt={altText || 'Powiększone zdjęcie'} />
      </div>
    </div>
  );
};

export default ImageModal;
