import React from 'react';

const ReviewsPage = () => {
  return (
    <div className="reviews-page">
      <h2>Opinie użytkowników</h2>
      <div className="review">
        <p>"Świetna obsługa i szeroki wybór laptopów!"</p>
        <span className="rating">★★★★★</span>
      </div>
      <div className="review">
        <p>"Laptop działał bez zarzutu przez cały okres wynajmu."</p>
        <span className="rating">★★★★☆</span>
      </div>
      <div className="review">
        <p>"Ceny mogłyby być nieco niższe, ale jakość wynajmu jest bardzo dobra."</p>
        <span className="rating">★★★★☆</span>
      </div>
      <div className="review">
        <p>"Bardzo szybki proces rezerwacji i świetny kontakt z obsługą."</p>
        <span className="rating">★★★★★</span>
      </div>
      <div className="review">
        <p>"Laptop miał drobne ślady użytkowania, ale działał bez problemów."</p>
        <span className="rating">★★★☆☆</span>
      </div>
    </div>
  );
};

export default ReviewsPage;