# Production Deployment & Operations Guide (DEPLOYMENT.md)

## 1. System Requirements & Topology

- **Operating System**: Linux (Ubuntu 22.04 LTS / Debian 12 / Alpine Linux)
- **Runtimes**: Node.js 20 LTS, npm 10+
- **Database**: MySQL 8.0 with InnoDB and `utf8mb4_unicode_ci` collation
- **Reverse Proxy**: Nginx 1.24+ (Handling SSL termination, rate limiting, and static assets)
- **Containerization**: Docker 26+ & Docker Compose v2

---

## 2. Docker Compose Deployment (Recommended)

The easiest and most reliable method to deploy the complete application is using Docker Compose:

```bash
# 1. Clone repository
git clone https://github.com/organization/recruitment-portal.git
cd recruitment-portal

# 2. Configure environment variables
cp .env.example .env

# 3. Build and start services (MySQL, Express API, Next.js Web)
docker compose up -d --build

# 4. Run Prisma database migrations and seed default data
docker compose exec server npx prisma migrate deploy
docker compose exec server npm run seed
```

Once running:
- **Web Frontend**: `http://localhost:3000`
- **REST API**: `http://localhost:5000/api/v1`
- **Swagger Documentation**: `http://localhost:5000/api/docs`

---

## 3. Environment Variables Reference

### Root & Server Environment Variables (`server/.env`)
| Variable | Description | Example / Default |
|---|---|---|
| `PORT` | API server listen port | `5000` |
| `NODE_ENV` | Environment mode | `production` |
| `DATABASE_URL` | MySQL connection string | `mysql://root:rootpassword@localhost:3306/recruitment_portal` |
| `JWT_SECRET` | Secret key for signing Access Tokens | `64+ char random string` |
| `JWT_REFRESH_SECRET` | Secret key for signing Refresh Tokens | `64+ char random string` |
| `CLIENT_URL` | Allowed CORS origin | `https://portal.example.com` |
| `UPLOAD_DIR` | Absolute path for file storage | `/var/app/uploads` |
| `SMTP_HOST` | Outbound mail server hostname | `smtp.mailgun.org` |
| `SMTP_PORT` | Outbound mail port | `587` |
| `SMTP_USER` | SMTP username | `postmaster@example.com` |
| `SMTP_PASS` | SMTP password | `secret_password` |
| `SMTP_FROM` | System sender email address | `Recruitment Portal <noreply@example.com>` |

### Client Environment Variables (`client/.env.production`)
| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL for API calls | `https://portal.example.com/api/v1` |

---

## 4. Bare-Metal & PM2 Production Setup

### 4.1 Server Process Setup
```bash
cd server
npm ci --only=production
npx prisma migrate deploy
npx prisma generate
pm2 start src/server.js --name "recruitment-api" -i max
```

### 4.2 Client Next.js Setup
```bash
cd client
npm ci
npm run build
pm2 start npm --name "recruitment-web" -- start -- -p 3000
```

---

## 5. Nginx Reverse Proxy & SSL Configuration

Create `/etc/nginx/sites-available/recruitment-portal`:

```nginx
server {
    listen 80;
    server_name portal.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name portal.example.com;

    ssl_certificate /etc/letsencrypt/live/portal.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/portal.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 25M;

    # Next.js Web Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Express REST API Gateway
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 6. Backups, Restore Drill & Log Rotation

### Automated MySQL Backup Cron
Add to crontab (`crontab -e`):
```cron
# Daily database backup at 02:00 AM
0 2 * * * /usr/bin/mysqldump -u root -p'password' recruitment_portal | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz
```

### Database Restore Drill
```bash
gunzip < /backups/db_20261118.sql.gz | mysql -u root -p recruitment_portal
```

### Log Rotation
Configure `/etc/logrotate.d/recruitment-portal`:
```
/var/log/pm2/*.log {
    daily
    missingok
    rotate 14
    compress
    notifempty
    copytruncate
}
```
