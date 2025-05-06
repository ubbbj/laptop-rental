const fs = require('fs');
const path = require('path');

const logToFile = (error, req) => {
  try {
    const logDir = path.join(__dirname, '../logs');
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }

    const date = new Date();
    const logFilename = path.join(logDir, `error-${date.toISOString().split('T')[0]}.log`);
    
    const logEntry = {
      timestamp: date.toISOString(),
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      errorMessage: error.message,
      errorStack: error.stack,
      requestBody: req.method !== 'GET' ? JSON.stringify(req.body) : null,
      requestQuery: Object.keys(req.query).length > 0 ? JSON.stringify(req.query) : null,
      userEmail: req.user?.email || 'niezalogowany',
      userRole: req.user?.role || 'brak'
    };

    fs.appendFileSync(
      logFilename, 
      JSON.stringify(logEntry, null, 2) + ',\n',
      'utf8'
    );
  } catch (e) {
    console.error('Błąd zapisywania do pliku logów:', e);
  }
};

const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, err);
  
  logToFile(err, req);
  
  if (process.env.NODE_ENV === 'production') {
    res.status(err.status || 500).json({ 
      error: 'Wystąpił błąd podczas przetwarzania żądania.' 
    });
  } else {
    res.status(err.status || 500).json({
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

const notFoundHandler = (req, res, next) => {
  const error = new Error(`Nie znaleziono: ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

module.exports = { 
  errorHandler, 
  notFoundHandler 
};