# EC2 Ubuntu Deployment Guide for Doctor AI API

This guide will help you deploy your NestJS application to an EC2 Ubuntu instance.

## Prerequisites

- AWS Account with EC2 access
- Basic knowledge of AWS services
- SSH access to your local machine

## Step 1: Launch EC2 Instance

### 1.1 Create EC2 Instance
- Go to AWS Console → EC2 → Launch Instance
- Choose Ubuntu Server 22.04 LTS (HVM)
- Select instance type: `t3.medium` or `t3.large` (recommended for production)
- Configure Security Groups:
  - SSH (Port 22) - Your IP
  - HTTP (Port 80) - 0.0.0.0/0
  - HTTPS (Port 443) - 0.0.0.0/0
  - Custom TCP (Port 3000) - 0.0.0.0/0 (for your API)
  - PostgreSQL (Port 5432) - 0.0.0.0/0 (if using external DB)

### 1.2 Connect to Instance
```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

## Step 2: Install Dependencies

### 2.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 2.2 Install Node.js 18.x
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version
```

### 2.3 Install PostgreSQL (if hosting locally)
```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE doctor_ai;
CREATE USER doctor_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE doctor_ai TO doctor_user;
\q
```

### 2.4 Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### 2.5 Install Nginx
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Step 3: Deploy Application

### 3.1 Clone Repository
```bash
cd /home/ubuntu
git clone <your-repository-url>
cd doctor_api
```

### 3.2 Install Dependencies
```bash
npm install
npm run build
```

### 3.3 Create Environment File
```bash
sudo nano .env
```

Add your environment variables:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=doctor_user
DB_PASSWORD=your_secure_password
DB_NAME=doctor_ai
DB_SYNC=false

# Application Configuration
PORT=3000
NODE_ENV=production

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=24h

# Google OAuth (if using)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Gemini AI (if using)
GEMINI_API_KEY=your_gemini_api_key

# Supabase (if using)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3.4 Run Database Migrations/Seeds
```bash
npm run seed
```

### 3.5 Start Application with PM2
```bash
pm2 start dist/main.js --name "doctor-ai-api"
pm2 save
pm2 startup
```

## Step 4: Configure Nginx

### 4.1 Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/doctor-ai
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com; # Replace with your domain or EC2 public IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Increase upload size limits
    client_max_body_size 50M;
}
```

### 4.2 Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/doctor-ai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 5: SSL Certificate (Optional but Recommended)

### 5.1 Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 5.2 Get SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com
```

## Step 6: Firewall Configuration

### 6.1 Configure UFW
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## Step 7: Monitoring and Maintenance

### 7.1 Check Application Status
```bash
pm2 status
pm2 logs doctor-ai-api
```

### 7.2 Monitor System Resources
```bash
htop
df -h
free -h
```

### 7.3 Set up Log Rotation
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## Step 8: Backup Strategy

### 8.1 Database Backup
```bash
# Create backup script
sudo nano /home/ubuntu/backup-db.sh
```

Add this content:
```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="doctor_ai_$DATE.sql"

mkdir -p $BACKUP_DIR
pg_dump -h localhost -U doctor_user -d doctor_ai > $BACKUP_DIR/$BACKUP_FILE

# Keep only last 7 backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
```

Make it executable:
```bash
chmod +x /home/ubuntu/backup-db.sh
```

### 8.2 Set up Cron Job for Daily Backups
```bash
crontab -e
```

Add this line:
```
0 2 * * * /home/ubuntu/backup-db.sh
```

## Troubleshooting

### Common Issues:

1. **Application won't start**: Check logs with `pm2 logs doctor-ai-api`
2. **Database connection failed**: Verify PostgreSQL is running and credentials are correct
3. **Port already in use**: Check what's using port 3000 with `sudo netstat -tlnp | grep :3000`
4. **Permission denied**: Ensure proper file permissions and ownership

### Useful Commands:
```bash
# Restart application
pm2 restart doctor-ai-api

# Restart Nginx
sudo systemctl restart nginx

# Check Nginx status
sudo systemctl status nginx

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check application logs
pm2 logs doctor-ai-api --lines 100
```

## Security Considerations

1. **Firewall**: Only open necessary ports
2. **SSH**: Use key-based authentication, disable password auth
3. **Database**: Use strong passwords, restrict access
4. **Updates**: Regularly update system packages
5. **Monitoring**: Set up alerts for system resources

## Performance Optimization

1. **PM2 Clustering**: Use `pm2 start dist/main.js -i max` for multiple instances
2. **Nginx Caching**: Configure proxy caching for static assets
3. **Database**: Optimize queries and add indexes
4. **Monitoring**: Use PM2 monitoring dashboard

## Next Steps

1. Set up domain name and DNS
2. Configure monitoring and alerting
3. Set up CI/CD pipeline
4. Implement backup verification
5. Set up log aggregation
