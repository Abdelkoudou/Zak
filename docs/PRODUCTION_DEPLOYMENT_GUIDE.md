# Production Deployment Guide

This guide explains how to deploy the MCQ Study App backend to production, including specific recommendations for dzSecurity hosting.

## Production Requirements

### Minimum System Requirements
- **CPU**: 1 vCPU (2 vCPU recommended)
- **RAM**: 1GB (2GB recommended)
- **Storage**: 10GB SSD
- **OS**: Ubuntu 20.04+ or CentOS 8+
- **Python**: 3.8+

### Recommended Production Stack
- **Web Server**: Nginx (reverse proxy)
- **ASGI Server**: Uvicorn with Gunicorn
- **Database**: PostgreSQL (recommended) or SQLite (small scale)
- **Process Manager**: systemd or PM2
- **SSL**: Let's Encrypt (free) or commercial certificate

## dzSecurity Hosting Recommendations

Based on typical hosting providers, for dzSecurity hosting:

### Recommended Plan
- **Plan**: Business/VPS Plan (not shared hosting)
- **Specifications**: 
  - 2GB RAM minimum
  - 2 vCPU cores
  - 20GB SSD storage
  - Ubuntu 20.04/22.04 LTS
  - Root/SSH access required

### Why Not Shared Hosting
- Need to install Python packages
- Require process management
- Need to run background services
- Database management requirements

## Production Deployment Steps

### 1. Prepare the Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and essential packages
sudo apt install python3 python3-pip python3-venv nginx postgresql postgresql-contrib supervisor git -y

# Create application user
sudo adduser --system --group mcqapp
sudo mkdir -p /opt/mcqapp
sudo chown mcqapp:mcqapp /opt/mcqapp
```

### 2. Setup Database (PostgreSQL Recommended)

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE mcq_study_db;
CREATE USER mcqapp WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE mcq_study_db TO mcqapp;
\q
```

### 3. Deploy Application

```bash
# Clone repository
sudo -u mcqapp git clone https://github.com/Abdelkoudou/Zak.git /opt/mcqapp/app
cd /opt/mcqapp/app/backend

# Create virtual environment
sudo -u mcqapp python3 -m venv venv
sudo -u mcqapp ./venv/bin/pip install -r requirements.txt

# Create production environment file
sudo -u mcqapp cp env_example.txt .env
```

### 4. Configure Environment Variables

Edit `/opt/mcqapp/app/backend/.env`:

```bash
# Database Configuration
DATABASE_URL=postgresql://mcqapp:your_secure_password_here@localhost:5432/mcq_study_db

# Security
SECRET_KEY=your_very_long_and_random_secret_key_here_minimum_32_characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Production Settings
ENVIRONMENT=production
DEBUG=false
```

### 5. Initialize Database

```bash
cd /opt/mcqapp/app/backend
sudo -u mcqapp ./venv/bin/alembic upgrade head
sudo -u mcqapp ./venv/bin/python scripts/create_owner.py
```

### 6. Create Systemd Service

Create `/etc/systemd/system/mcqapp.service`:

```ini
[Unit]
Description=MCQ Study App
After=network.target

[Service]
User=mcqapp
Group=mcqapp
WorkingDirectory=/opt/mcqapp/app/backend
ExecStart=/opt/mcqapp/app/backend/venv/bin/gunicorn app.main:app -k uvicorn.workers.UvicornWorker -b 127.0.0.1:8000 --workers 2
Restart=always
RestartSec=10
Environment=PATH=/opt/mcqapp/app/backend/venv/bin

[Install]
WantedBy=multi-user.target
```

### 7. Configure Nginx

Create `/etc/nginx/sites-available/mcqapp`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Static files (frontend)
    location / {
        root /opt/mcqapp/app/frontend;
        try_files $uri $uri/ /index.html;
    }
    
    # API backend
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Handle CORS
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization";
    }
    
    # Handle WebSocket connections (if needed)
    location /ws {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 8. Start Services

```bash
# Enable and start services
sudo systemctl enable mcqapp nginx
sudo systemctl start mcqapp nginx

# Enable site
sudo ln -s /etc/nginx/sites-available/mcqapp /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

### 9. Setup SSL (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Verify auto-renewal
sudo certbot renew --dry-run
```

## Production Configuration

### 1. Install Gunicorn

```bash
sudo -u mcqapp ./venv/bin/pip install gunicorn
```

### 2. Gunicorn Configuration

Create `/opt/mcqapp/app/backend/gunicorn.conf.py`:

```python
bind = "127.0.0.1:8000"
workers = 2
worker_class = "uvicorn.workers.UvicornWorker"
timeout = 30
keepalive = 5
max_requests = 1000
max_requests_jitter = 100
preload_app = True
```

### 3. Security Considerations

```bash
# Firewall setup
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Database security
sudo -u postgres psql -c "ALTER USER mcqapp PASSWORD 'new_secure_password';"

# File permissions
sudo chmod 600 /opt/mcqapp/app/backend/.env
sudo chown mcqapp:mcqapp /opt/mcqapp/app/backend/.env
```

## Monitoring and Maintenance

### 1. Log Management

```bash
# View application logs
sudo journalctl -u mcqapp -f

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 2. Database Backup

Create `/opt/mcqapp/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/opt/mcqapp/backups"
DATE=$(date +"%Y%m%d_%H%M%S")

mkdir -p $BACKUP_DIR

# PostgreSQL backup
pg_dump -h localhost -U mcqapp -d mcq_study_db > $BACKUP_DIR/mcq_backup_$DATE.sql

# Keep only last 30 backups
find $BACKUP_DIR -name "mcq_backup_*.sql" -mtime +30 -delete
```

### 3. Updates

```bash
# Update application
cd /opt/mcqapp/app
sudo -u mcqapp git pull origin main
sudo -u mcqapp ./backend/venv/bin/pip install -r backend/requirements.txt
sudo -u mcqapp ./backend/venv/bin/alembic upgrade head
sudo systemctl restart mcqapp
```

## Performance Optimization

### 1. Database Optimization

```sql
-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_year ON questions(year);
CREATE INDEX IF NOT EXISTS idx_questions_study_year ON questions(study_year);
CREATE INDEX IF NOT EXISTS idx_questions_speciality ON questions(speciality);
```

### 2. Nginx Caching

Add to Nginx configuration:

```nginx
# Cache static files
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Troubleshooting

### Common Issues

1. **Application won't start**:
   ```bash
   sudo systemctl status mcqapp
   sudo journalctl -u mcqapp --no-pager -l
   ```

2. **Database connection errors**:
   ```bash
   sudo -u postgres psql -l
   sudo systemctl status postgresql
   ```

3. **Nginx errors**:
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   ```

### Health Check Endpoint

Test your deployment:

```bash
curl http://your-domain.com/api/health
```

## Cost Estimation (dzSecurity)

Based on typical VPS pricing:
- **Small deployment**: $10-20/month (1GB RAM, 1 vCPU)
- **Recommended**: $20-40/month (2GB RAM, 2 vCPU)
- **High traffic**: $40-80/month (4GB RAM, 2+ vCPU)

Additional costs:
- Domain name: $10-15/year
- SSL certificate: Free (Let's Encrypt) or $50-100/year
- Backup storage: $5-10/month (optional)

## Support and Maintenance

For ongoing support:
1. Monitor logs daily
2. Backup database weekly
3. Update system monthly
4. Review security quarterly

Contact your hosting provider (dzSecurity) support for:
- Server provisioning
- DNS configuration
- Network/firewall issues
- Hardware problems