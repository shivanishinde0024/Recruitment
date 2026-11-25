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
const allowedOrigins = [
  CLIENT_URL,
  'http://localhost:3000',
  'https://recruitment-six-beige.vercel.app'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server or tools without an origin header
    if (!origin) return callback(null, true);

    // Allow configured CLIENT_URL, localhost, or any Vercel domain (*.vercel.app)
    if (
      allowedOrigins.includes(origin) ||
      /\.vercel\.app$/.test(origin) ||
      origin.startsWith('http://localhost:')
    ) {
      return callback(null, true);
    }

    // Reflect origin to ensure smooth cross-origin communication
    return callback(null, true);
  },
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

// Rate Limiting on Sensitive Auth Endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: NODE_ENV === 'production' ? 100 : 5000,
  skip: () => NODE_ENV === 'test',
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/forgot-password', authLimiter);

// Mount API Documentation in non-production
if (NODE_ENV !== 'production') {
  const path = require('path');
  const openApiSpec = require('./docs/openapi.json');

  app.get('/api/docs/openapi.json', (req, res) => {
    res.json(openApiSpec);
  });

  app.get('/api/docs', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Recruitment Portal API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; background: #fafafa; }
    .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      SwaggerUIBundle({
        url: '/api/docs/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`);
  });
}

// Direct aliases for SQA landing page actions
const sqaRoutes = require('./modules/sqa/sqa.routes');
app.use('/api/leads', sqaRoutes);
app.use('/api/applications', sqaRoutes);

// Mount API v1 Routes
app.use('/api/v1', routes);

// 404 & Centralized Error Handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;
