const express = require('express');
const helmet = require('helmet');
const hpp = require('hpp');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/error');
const { CLIENT_URL, NODE_ENV } = require('./config/env');

const app = express();

// Trust proxy for secure cookies behind reverse proxies (Nginx / Docker)
app.set('trust proxy', 1);

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Cross-Origin Resource Sharing
app.use(cors({
  origin: CLIENT_URL,
  credentials: true
}));

// Body Parsing
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());
app.use(hpp());

// HTTP Request Logging
if (NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Rate Limiting on Auth Endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/v1/auth', authLimiter);

// Mount API v1 Routes
app.use('/api/v1', routes);

// 404 & Centralized Error Handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;
