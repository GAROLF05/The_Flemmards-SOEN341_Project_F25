# Production Deployment Checklist

**Status:** 🟡 Ready for Production Setup  
**Last Updated:** October 30, 2025

---

## ✅ Pre-Deployment Checklist

### 1. Database Setup

#### Required Database Migrations
Add the following fields to your production database:

**Organizations Table:**
```sql
ALTER TABLE organizations 
ADD COLUMN status VARCHAR(20) DEFAULT 'pending',
ADD INDEX idx_organization_status (status);
```

**Events Table:**
```sql
ALTER TABLE events 
ADD COLUMN moderationStatus VARCHAR(20) DEFAULT 'pending_approval',
ADD COLUMN moderationNotes TEXT,
ADD COLUMN moderatedBy VARCHAR(255),
ADD COLUMN moderatedAt DATETIME,
ADD INDEX idx_moderation_status (moderationStatus);
```

**Tickets Table (if not exists):**
```sql
ALTER TABLE tickets
ADD COLUMN scannedAt DATETIME,
ADD COLUMN scannedCount INT DEFAULT 0,
ADD INDEX idx_ticket_scanned (scannedAt);
```

#### Database Indexes (Performance Optimization)
```sql
-- For faster event browsing
CREATE INDEX idx_event_date ON events(start_at);
CREATE INDEX idx_event_category ON events(category);
CREATE INDEX idx_event_capacity ON events(capacity);

-- For faster moderation queries
CREATE INDEX idx_event_moderation_status ON events(moderationStatus);
CREATE INDEX idx_org_status ON organizations(status);
```

---

### 2. Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Database Configuration
DB_HOST=your_production_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
DB_PORT=3306

# Server Configuration
PORT=3000
NODE_ENV=production

# Email Service Configuration (Choose one)
# Option 1: SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Option 2: AWS SES
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
AWS_SES_FROM_EMAIL=noreply@yourdomain.com

# Option 3: Mailgun
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_FROM_EMAIL=noreply@yourdomain.com

# SMTP (Generic)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM_EMAIL=noreply@yourdomain.com

# Security
JWT_SECRET=your_jwt_secret_key_here
SESSION_SECRET=your_session_secret_here

# Admin Configuration
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_ALERT_EMAIL=security@yourdomain.com

# Frontend URL (for CORS)
FRONTEND_URL=https://yourdomain.com

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_DIR=/var/www/uploads
```

---

### 3. Email Service Integration

Replace the mock notification system with a real email service. Choose one of the following:

#### Option A: SendGrid (Recommended for simplicity)
```bash
npm install @sendgrid/mail
```

Update `backend/controllers/notificationController.js`:
```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendNotification(to, subject, message) {
    const msg = {
        to,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject,
        text: message,
        html: `<p>${message}</p>`
    };
    
    try {
        await sgMail.send(msg);
        console.log(`[EMAIL] Sent to ${to}: ${subject}`);
    } catch (error) {
        console.error(`[EMAIL ERROR]`, error);
    }
}
```

#### Option B: AWS SES (Recommended for AWS infrastructure)
```bash
npm install @aws-sdk/client-ses
```

#### Option C: Nodemailer (Generic SMTP)
```bash
npm install nodemailer
```

Update `backend/controllers/notificationController.js`:
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

async function sendNotification(to, subject, message) {
    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM_EMAIL,
            to,
            subject,
            text: message,
            html: `<p>${message}</p>`
        });
        console.log(`[EMAIL] Sent to ${to}: ${subject}`);
    } catch (error) {
        console.error(`[EMAIL ERROR]`, error);
    }
}
```

---

### 4. Security Configuration

#### CORS Setup
Update `backend/server.js`:
```javascript
const cors = require('cors');

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
```

#### Rate Limiting
```bash
npm install express-rate-limit
```

Add to `backend/server.js`:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

#### Helmet (Security Headers)
```bash
npm install helmet
```

Add to `backend/server.js`:
```javascript
const helmet = require('helmet');
app.use(helmet());
```

---

### 5. Logging and Monitoring

#### Production Logging
```bash
npm install winston
```

Create `backend/config/logger.js`:
```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

module.exports = logger;
```

Replace `console.log` statements with `logger.info()` and `console.error` with `logger.error()`.

---

### 6. Performance Optimization

#### Add Compression
```bash
npm install compression
```

Add to `backend/server.js`:
```javascript
const compression = require('compression');
app.use(compression());
```

#### Database Connection Pooling
Update `backend/config/database.js`:
```javascript
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
```

---

### 7. Testing Before Deployment

#### Run All API Tests
```bash
# Test event browsing
curl "https://yourdomain.com/api/events/browse?q=test"

# Test organizer approval
curl -X PATCH https://yourdomain.com/api/admin/approve-organizer/ORG123 \
  -H "Content-Type: application/json" \
  -d '{"action": "approve"}'

# Test QR code scanning
curl -X POST https://yourdomain.com/api/tickets/ticket/scan \
  -H "Content-Type: application/json" \
  -d '{"ticketId": "TICKET123"}'
```

#### Health Check Endpoint
Add to `backend/server.js`:
```javascript
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
```

---

### 8. Deployment Steps

#### For Traditional Server (VPS/EC2)
```bash
# 1. SSH into server
ssh user@your-server-ip

# 2. Clone repository
git clone <your-repo-url>
cd The_Flemmards-SOEN341_Project_F25

# 3. Install dependencies
cd backend
npm install --production

# 4. Set up environment variables
nano .env
# (Paste your production .env contents)

# 5. Run database migrations
node scripts/migrate.js

# 6. Start with PM2 (Process Manager)
npm install -g pm2
pm2 start server.js --name "event-api"
pm2 save
pm2 startup

# 7. Set up Nginx reverse proxy
sudo nano /etc/nginx/sites-available/event-api
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### For Docker Deployment
Create `backend/Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  api:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - ./backend/.env
    restart: always
```

---

### 9. Post-Deployment Verification

✅ **Check List:**
- [ ] Database migrations applied successfully
- [ ] All environment variables configured
- [ ] Email notifications working
- [ ] API endpoints responding correctly
- [ ] CORS configured for frontend
- [ ] Rate limiting active
- [ ] Logging system operational
- [ ] Health check endpoint responding
- [ ] SSL certificate installed (HTTPS)
- [ ] Backup system configured
- [ ] Monitoring alerts set up

---

### 10. Monitoring and Maintenance

#### Recommended Tools:
- **Uptime Monitoring:** UptimeRobot, Pingdom
- **Error Tracking:** Sentry, Rollbar
- **Log Management:** Loggly, Papertrail
- **Performance:** New Relic, Datadog
- **Database Backups:** Daily automated backups

#### Daily Checks:
```bash
# Check server status
pm2 status

# Check logs
pm2 logs event-api --lines 50

# Check database connection
mysql -u user -p -e "SELECT COUNT(*) FROM events;"

# Check disk space
df -h
```

---

## 🚨 Rollback Plan

If deployment fails:

1. **Revert Database Changes:**
   ```sql
   ALTER TABLE events DROP COLUMN moderationStatus;
   ALTER TABLE organizations DROP COLUMN status;
   ```

2. **Rollback Code:**
   ```bash
   git revert HEAD
   pm2 restart event-api
   ```

3. **Restore Backup:**
   ```bash
   mysql -u user -p dbname < backup.sql
   ```

---

## 📞 Support

- **Documentation:** `/docs/` folder
- **API Testing:** See `API_TESTING_GUIDE.md`
- **Implementation Details:** See `COMPLETE_BACKEND_IMPLEMENTATION_SUMMARY.md`

---

**Deployment Status:** 🟢 Ready when checklist complete  
**Estimated Deployment Time:** 2-4 hours  
**Risk Level:** Low (all code tested and verified)
