# MCQ Study App - Deployment Guide

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Backend Deployment](#backend-deployment)
- [Mobile App Deployment](#mobile-app-deployment)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)

---

## Overview

This guide covers deploying the MCQ Study App to production, including:
- Backend API deployment (DigitalOcean/Railway/Heroku)
- PostgreSQL database setup
- SSL certificate configuration
- Mobile app building and distribution

---

## Prerequisites

### Required Accounts
- [ ] GitHub account (for code repository)
- [ ] DigitalOcean/Railway/Heroku account (for hosting)
- [ ] Domain name (optional but recommended)
- [ ] Google Play Developer account ($25 one-time)
- [ ] Apple Developer account ($99/year) - if deploying to iOS

### Required Tools
- [ ] Git installed
- [ ] Node.js 16+ installed
- [ ] Python 3.8+ installed
- [ ] Expo CLI installed (`npm install -g @expo/cli`)
- [ ] SSH client (for server access)

---

## Backend Deployment

### Option 1: Railway (Easiest - Recommended)

#### Step 1: Prepare Your Code
```bash
# Ensure your code is in Git
cd backend
git init
git add .
git commit -m "Initial commit"
git push origin main
```

#### Step 2: Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository
6. Railway will auto-detect FastAPI

#### Step 3: Add PostgreSQL Database
1. In your project, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway will create and link the database

#### Step 4: Configure Environment Variables
In Railway dashboard, add these variables:
```
DATABASE_URL=${PGDATABASE_URL}  # Auto-provided by Railway
SECRET_KEY=your-super-secret-key-here-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

#### Step 5: Deploy
```bash
# Railway will auto-deploy on git push
git push origin main
```

#### Step 6: Run Migrations
```bash
# In Railway dashboard, open terminal
alembic upgrade head
python scripts/create_owner.py
```

**Cost**: $5-10/month
**Time**: 15-20 minutes
**Difficulty**: ⭐ Very Easy

---

### Option 2: DigitalOcean (Best Value)

#### Step 1: Create Droplet
1. Go to [digitalocean.com](https://digitalocean.com)
2. Create account
3. Create Droplet:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic ($6/month)
   - **CPU**: Regular Intel (1GB RAM)
   - **Datacenter**: Closest to your users
   - **Authentication**: SSH keys (recommended)

#### Step 2: Connect to Server
```bash
ssh root@your_server_ip
```

#### Step 3: Install Dependencies
```bash
# Update system
apt update && apt upgrade -y

# Install Python and PostgreSQL
apt install python3 python3-pip python3-venv postgresql postgresql-contrib nginx -y

# Install certbot for SSL
apt install certbot python3-certbot-nginx -y
```

#### Step 4: Setup PostgreSQL
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE mcq_study_db;
CREATE USER mcq_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE mcq_study_db TO mcq_user;
\q
```

#### Step 5: Deploy Application
```bash
# Create app directory
mkdir -p /var/www/mcq-app
cd /var/www/mcq-app

# Clone your repository
git clone https://github.com/yourusername/mcq-app.git .

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
cd backend
pip install -r requirements.txt
```

#### Step 6: Configure Environment
```bash
# Create .env file
nano /var/www/mcq-app/backend/.env
```

Add:
```env
DATABASE_URL=postgresql://mcq_user:your_secure_password@localhost:5432/mcq_study_db
SECRET_KEY=your-super-secret-key-here-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

#### Step 7: Run Migrations
```bash
cd /var/www/mcq-app/backend
source ../venv/bin/activate
alembic upgrade head
python scripts/create_owner.py
```

#### Step 8: Create Systemd Service
```bash
nano /etc/systemd/system/mcq-app.service
```

Add:
```ini
[Unit]
Description=MCQ Study App
After=network.target

[Service]
User=root
WorkingDirectory=/var/www/mcq-app/backend
Environment="PATH=/var/www/mcq-app/venv/bin"
ExecStart=/var/www/mcq-app/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
systemctl enable mcq-app
systemctl start mcq-app
systemctl status mcq-app
```

#### Step 9: Configure Nginx
```bash
nano /etc/nginx/sites-available/mcq-app
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
ln -s /etc/nginx/sites-available/mcq-app /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

#### Step 10: Setup SSL
```bash
certbot --nginx -d your-domain.com
```

Follow prompts to get free SSL certificate.

**Cost**: $6/month
**Time**: 1-2 hours
**Difficulty**: ⭐⭐⭐ Medium

---

### Option 3: Heroku (Simple)

#### Step 1: Install Heroku CLI
```bash
# macOS
brew tap heroku/brew && brew install heroku

# Windows
# Download from heroku.com

# Linux
curl https://cli-assets.heroku.com/install.sh | sh
```

#### Step 2: Login and Create App
```bash
heroku login
cd backend
heroku create mcq-study-app
```

#### Step 3: Add PostgreSQL
```bash
heroku addons:create heroku-postgresql:mini
```

#### Step 4: Configure Environment
```bash
heroku config:set SECRET_KEY=your-super-secret-key
heroku config:set ALGORITHM=HS256
heroku config:set ACCESS_TOKEN_EXPIRE_MINUTES=30
```

#### Step 5: Create Procfile
```bash
echo "web: uvicorn app.main:app --host 0.0.0.0 --port \$PORT" > Procfile
```

#### Step 6: Deploy
```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

#### Step 7: Run Migrations
```bash
heroku run alembic upgrade head
heroku run python scripts/create_owner.py
```

**Cost**: $7/month
**Time**: 30 minutes
**Difficulty**: ⭐⭐ Easy

---

## Mobile App Deployment

### Android Deployment

#### Step 1: Update Configuration
```bash
cd react-native-med-app
```

Edit `app.json`:
```json
{
  "expo": {
    "name": "MedExam Pro",
    "slug": "medexam-pro",
    "version": "1.0.0",
    "android": {
      "package": "com.yourcompany.medexampro",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      }
    }
  }
}
```

#### Step 2: Update API Base URL
Edit `src/services/api.ts`:
```typescript
const API_BASE_URL = 'https://your-domain.com'; // Production URL
```

#### Step 3: Build APK (Development)
```bash
# For testing
expo build:android -t apk
```

#### Step 4: Build AAB (Production)
```bash
# For Google Play Store
expo build:android -t app-bundle
```

#### Step 5: Download Build
```bash
# Expo will provide download link
# Download the APK/AAB file
```

#### Step 6: Test APK
```bash
# Install on Android device
adb install app-release.apk

# Test all features
```

#### Step 7: Submit to Google Play

1. **Create Developer Account**
   - Go to [play.google.com/console](https://play.google.com/console)
   - Pay $25 one-time fee
   - Complete registration

2. **Create App**
   - Click "Create app"
   - Fill app details:
     - Name: MedExam Pro
     - Default language: French
     - App type: App
     - Category: Education

3. **Upload AAB**
   - Go to "Production" → "Create new release"
   - Upload AAB file
   - Fill release notes

4. **Complete Store Listing**
   - App description
   - Screenshots (at least 2)
   - Feature graphic (1024x500)
   - App icon (512x512)
   - Privacy policy URL

5. **Content Rating**
   - Complete questionnaire
   - Get rating

6. **Submit for Review**
   - Review and submit
   - Wait 1-3 days for approval

---

### iOS Deployment (If Applicable)

#### Step 1: Requirements
- Mac computer with Xcode
- Apple Developer account ($99/year)
- iOS device for testing

#### Step 2: Update Configuration
Edit `app.json`:
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.medexampro",
      "buildNumber": "1.0.0",
      "supportsTablet": true
    }
  }
}
```

#### Step 3: Build IPA
```bash
expo build:ios
```

#### Step 4: Submit to App Store
1. Create app in App Store Connect
2. Upload IPA using Transporter
3. Complete app information
4. Submit for review
5. Wait 1-7 days for approval

---

## Post-Deployment

### Monitoring

#### Backend Monitoring
```bash
# Check service status
systemctl status mcq-app

# View logs
journalctl -u mcq-app -f

# Check Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

#### Database Monitoring
```bash
# Connect to database
sudo -u postgres psql mcq_study_db

# Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Backups

#### Database Backup
```bash
# Create backup script
nano /root/backup-db.sh
```

Add:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups"
mkdir -p $BACKUP_DIR

# Backup database
sudo -u postgres pg_dump mcq_study_db > $BACKUP_DIR/mcq_db_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "mcq_db_*.sql" -mtime +7 -delete

echo "Backup completed: mcq_db_$DATE.sql"
```

Make executable and schedule:
```bash
chmod +x /root/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /root/backup-db.sh
```

### Updates

#### Backend Updates
```bash
cd /var/www/mcq-app
git pull origin main
source venv/bin/activate
cd backend
pip install -r requirements.txt
alembic upgrade head
systemctl restart mcq-app
```

#### Mobile App Updates
```bash
# Update version in app.json
# Build new version
# Submit to stores
```

---

## Troubleshooting

### Backend Issues

**Issue**: Service won't start
```bash
# Check logs
journalctl -u mcq-app -n 50

# Check if port is in use
netstat -tulpn | grep 8000

# Restart service
systemctl restart mcq-app
```

**Issue**: Database connection error
```bash
# Check PostgreSQL status
systemctl status postgresql

# Check connection
sudo -u postgres psql -c "SELECT 1"

# Check DATABASE_URL in .env
```

**Issue**: SSL certificate error
```bash
# Renew certificate
certbot renew

# Check certificate
certbot certificates
```

### Mobile App Issues

**Issue**: Build fails
```bash
# Clear cache
expo start -c

# Reinstall dependencies
rm -rf node_modules
npm install
```

**Issue**: API connection fails
```bash
# Check API URL in code
# Check CORS settings on backend
# Check SSL certificate
```

**Issue**: App crashes on startup
```bash
# Check logs in Expo
# Test on different device
# Check for missing dependencies
```

---

## Security Checklist

### Backend Security
- [ ] Change default SECRET_KEY
- [ ] Use strong database password
- [ ] Enable firewall (ufw)
- [ ] Setup fail2ban (optional)
- [ ] Regular security updates
- [ ] Backup database daily
- [ ] Monitor logs for suspicious activity

### Mobile App Security
- [ ] Use HTTPS only
- [ ] Validate all inputs
- [ ] Store tokens securely
- [ ] Implement rate limiting
- [ ] Add app signing
- [ ] Enable ProGuard (Android)

---

## Performance Optimization

### Backend
```python
# Add database indexes
CREATE INDEX idx_questions_study_year ON questions(study_year);
CREATE INDEX idx_questions_module ON questions(module);
CREATE INDEX idx_saved_questions_user ON saved_questions(user_id);
```

### Mobile App
```typescript
// Use React.memo for expensive components
const QuestionCard = React.memo(({ question }) => {
  // Component code
});

// Implement pagination
const [page, setPage] = useState(1);
const loadMore = () => setPage(page + 1);
```

---

## Cost Summary

### Monthly Costs
| Service | Cost |
|---------|------|
| Backend Hosting (Railway) | $5-10 |
| Backend Hosting (DigitalOcean) | $6 |
| Backend Hosting (Heroku) | $7 |
| Domain Name | $1-2 |
| **Total** | **$6-12/month** |

### One-Time Costs
| Service | Cost |
|---------|------|
| Google Play Developer | $25 |
| Apple Developer | $99/year |
| **Total** | **$25-124** |

---

## Support & Maintenance

### Regular Tasks
- **Daily**: Monitor logs and errors
- **Weekly**: Check backups, review analytics
- **Monthly**: Update dependencies, security patches
- **Quarterly**: Review and optimize performance

### Emergency Contacts
- Hosting support: support@railway.app / support@digitalocean.com
- Database issues: Check PostgreSQL docs
- Mobile issues: Check Expo forums

---

## Conclusion

This deployment guide provides step-by-step instructions for deploying the MCQ Study App to production. Choose the deployment option that best fits your technical skills and budget.

**Recommended Path**:
1. Start with Railway (easiest)
2. Move to DigitalOcean when you need more control
3. Consider Heroku if you want simplicity

**Next Steps**:
1. Choose deployment option
2. Follow step-by-step guide
3. Test thoroughly
4. Monitor and maintain

Good luck with your deployment! 🚀
