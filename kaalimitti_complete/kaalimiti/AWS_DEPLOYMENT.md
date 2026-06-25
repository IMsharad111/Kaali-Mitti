# 🚀 Kaalimitti — AWS Deployment Guide
## Stack: EC2 (Ubuntu) + MongoDB Atlas + S3

---

## PART 1 — MongoDB Atlas Setup (Free)

1. Go to https://cloud.mongodb.com → Create free account
2. Create a new **free M0 cluster** (choose `ap-south-1` Mumbai region)
3. Under **Database Access** → Add user: set username + strong password
4. Under **Network Access** → Add IP: `0.0.0.0/0` (allow all, you'll lock this down later)
5. Click **Connect** → **Connect your application** → copy the connection string
   - It looks like: `mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/kaalimiti`
6. Save this — you'll need it in your `.env`
mongodb+srv://kaalimitti007_db_user:<Kaalimitti>@cluster0.1uckxsu.mongodb.net/?appName=Cluster0
---
final 
mongodb+srv://kaalimitti007_db_user:YOUR_PASSWORD@cluster0.luckxsu.mongodb.net/kaalimitti?retryWrites=true&w=majority&appName=Cluster0

## PART 2 — AWS S3 Setup (for image uploads)

1. Go to AWS Console → S3 → **Create bucket**
   - Name: `kaalimitti-uploads`
   - Region: `ap-south-1` (Mumbai)
   - **Uncheck** "Block all public access" → confirm
2. Go to bucket → **Permissions** → **Bucket Policy** → paste:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::kaalimitti-uploads/*"
  }]
}
```
3. Go to **IAM** → Users → Create user: `kaalimitti-app`
   - Attach policy: **AmazonS3FullAccess** (or create a limited policy for just your bucket)
   - Create **Access Keys** → download CSV → save `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`

---

## PART 3 — Razorpay Setup

1. Go to https://dashboard.razorpay.com → Sign up / Log in
2. Go to **Settings** → **API Keys** → Generate Test Keys first
3. Save `Key ID` and `Key Secret`
4. When ready to go live: complete KYC → generate Live Keys

---

## PART 4 — Gmail App Password (for emails)

1. Go to your Google Account → **Security**
2. Enable **2-Step Verification** (required)
3. Go to **App Passwords** (search for it) → Select app: "Mail" → Generate
4. Copy the 16-character password — use this as `GMAIL_APP_PASSWORD`

---

## PART 5 — Launch EC2 Instance

1. Go to AWS Console → EC2 → **Launch Instance**
   - Name: `kaalimitti-server`
   - AMI: **Ubuntu Server 24.04 LTS** (Free tier eligible)
   - Instance type: **t2.micro** (free tier) or **t3.small** for better performance
   - Key pair: Create new → download `.pem` file → save it safely
   - Security Group — add these inbound rules:
     | Type  | Port | Source    |
     |-------|------|-----------|
     | SSH   | 22   | My IP     |
     | HTTP  | 80   | Anywhere  |
     | HTTPS | 443  | Anywhere  |
     | Custom TCP | 5000 | Anywhere (can remove after nginx setup) |
2. Launch → note down the **Public IPv4 address**

---

## PART 6 — Connect & Setup Server

```bash
# Connect to EC2 (replace with your .pem path and IP)
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Update packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install nginx, git, pm2
sudo apt install -y nginx git
sudo npm install -g pm2

# Verify installations
node --version   # should be v20.x
npm --version
nginx -v
pm2 --version
```

---

## PART 7 — Deploy Your Code

```bash
# Create app directory
sudo mkdir -p /var/www/kaalimitti
sudo chown -R ubuntu:ubuntu /var/www/kaalimitti
cd /var/www/kaalimitti

# Option A: Clone from GitHub (recommended)
git clone https://github.com/yourusername/kaalimitti.git .

# Option B: Upload via SCP from your local machine
# Run this on your LOCAL machine (not EC2):
# scp -i your-key.pem -r ./kaalimiti ubuntu@YOUR_EC2_IP:/var/www/kaalimitti

# Install backend dependencies
cd /var/www/kaalimitti/backend
npm install --production

# Create .env file from template
cp .env.example .env
nano .env
```

### Fill in your .env:
```env
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://youruser:password@cluster0.xxxxx.mongodb.net/kaalimiti
JWT_SECRET=pick_a_long_random_string_min_32_chars_abc123xyz789
RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXX
GMAIL_USER=youremail@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=ap-south-1
S3_BUCKET_NAME=kaalimitti-uploads
CLIENT_URL=http://YOUR_EC2_IP
```

---

## PART 8 — Build Frontend

```bash
# Install frontend dependencies and build
cd /var/www/kaalimitti/fronted
npm install
npm run build

# Verify dist folder was created
ls dist/   # should show index.html, assets/, etc.
```

---

## PART 9 — Configure Nginx

```bash
# Copy nginx config
sudo cp /var/www/kaalimitti/nginx.conf /etc/nginx/sites-available/kaalimitti

# Edit to set correct paths
sudo nano /etc/nginx/sites-available/kaalimitti
# → Change: root /var/www/kaalimitti/fronted/dist;
# → Change: server_name YOUR_EC2_IP;  (or your domain)

# Enable the site
sudo ln -s /etc/nginx/sites-available/kaalimitti /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## PART 10 — Start Backend with PM2

```bash
# Go to project root
cd /var/www/kaalimitti

# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 config to auto-restart on reboot
pm2 save
pm2 startup
# → Copy and run the command it prints

# Check status
pm2 status
pm2 logs kaalimitti-backend
```

---

## PART 11 — Seed the Database

```bash
cd /var/www/kaalimitti/backend
node seed.js
```

---

## PART 12 — Create Admin User

After seeding, register a user via the website, then promote them to admin in MongoDB Atlas:

1. Go to MongoDB Atlas → Browse Collections → `users`
2. Find your user → Edit → change `"role": "buyer"` to `"role": "admin"`
3. Save

---

## PART 13 — Add HTTPS with Let's Encrypt (if you have a domain)

```bash
# Point your domain's A record to EC2 IP first, then:
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renew
sudo systemctl enable certbot.timer
```

---

## Useful Commands After Deployment

```bash
# View live backend logs
pm2 logs kaalimitti-backend

# Restart backend
pm2 restart kaalimitti-backend

# Deploy code update
cd /var/www/kaalimitti
git pull
cd backend && npm install --production
cd ../fronted && npm install && npm run build
pm2 restart kaalimitti-backend
sudo systemctl reload nginx

# Check nginx errors
sudo tail -f /var/log/nginx/error.log
```

---

## Estimated Monthly Cost (AWS Free Tier)

| Service       | Free Tier          | After Free Tier  |
|---------------|-------------------|------------------|
| EC2 t2.micro  | 750 hrs/month FREE | ~$8-10/month     |
| S3            | 5 GB FREE         | ~$0.023/GB       |
| MongoDB Atlas | 512 MB FREE        | ~$57/month (M10) |
| Data transfer | 15 GB FREE        | $0.09/GB         |

**Total: ~₹0/month on free tier for the first 12 months!**
