# Deployment Guide (Hybrid: Vercel + EC2)

This guide details how to deploy the **Frontend to Vercel** and the **Backend to AWS EC2** via Docker.

## Prerequisites

1. **Docker Hub Account**: Create one at [hub.docker.com](https://hub.docker.com/).
2. **AWS Account**: Access to EC2 console.
3. **Vercel Account**.
4. **Cloud Database (Postgres)**: e.g., Supabase, Neon, or RDS.
5. **Cloud Storage (S3)**: AWS S3 Bucket.
6. **Inngest Cloud Account**.

---

## Part 1: Deploy Backend

### Option 1: Vercel (Recommended)
This method is simpler and serverless.

1.  **Push to GitHub**: ensure `backend/vercel.json` is present.
2.  **Import to Vercel**:
    *   Select repo.
    *   **Root Directory**: `backend`.
    *   **Framework Preset**: Other (or Python).
3.  **Environment Variables**:
    *   Copy all values from your local `backend/.env`.
    *   **Important**: Ensure `MINIO_ENDPOINT` is the hostname (e.g., `s3.ap-southeast-2.amazonaws.com`) and `MINIO_USE_SSL=true`.
    *   Set `INNGEST_DEV=0`.
4.  **Deploy**.

### Option 2: AWS EC2 (Docker)
Use this if you need full control or long-running processes that exceed Vercel's execution limits.

### Step 1: Build and Push Docker Image

Since you are on a Mac (ARM64) and EC2 is likely Intel (AMD64), we must build for the correct platform.

1. **Login to Docker**:

```bash
docker login
```

2. **Build the Image** (Replace `your-username` with your Docker Hub username):

```bash
cd backend
docker buildx build --platform linux/amd64 -t your-username/heidi-backend:latest --push .
```

*This command builds the image and pushes it directly to Docker Hub.*

### Step 2: Launch EC2 Instance

1. Go to **AWS Console > EC2 > Launch Instances**.
2. **Name**: `Heidi-Backend`.
3. **OS Image**: `Ubuntu Server 22.04 LTS (HVM), SSD Volume Type`.
4. **Instance Type**: `t2.micro` (Free tier eligible) or `t3.small` (Recommended).
5. **Key Pair**: Create a new key pair (`heidi-key`), download the `.pem` file.
6. **Network Settings**:
   * Create Security Group.
   * Allow SSH (`22`) from My IP.
   * Allow TCP (`8000`) from Anywhere (`0.0.0.0/0`).

7. **Launch**.

### Step 3: Setup EC2

1. **Connect to EC2**:

```bash
chmod 400 heidi-key.pem
ssh -i "heidi-key.pem" ubuntu@<EC2-PUBLIC-IP>
```

2. **Install Docker on EC2**:

```bash
# Update packages
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group (avoid sudo)
sudo usermod -aG docker ubuntu
newgrp docker
```

### Step 4: Run the Backend

Run the following commands on your EC2 instance. **You must fill in the values**.

1. **Pull the latest image**:

```bash
docker pull your-username/heidi-backend:latest
```

2. **Start the container**:

```bash
docker run -d \
--name heidi-backend   
-p 8000:8000   
--restart always   
-e DATABASE_URL="postgresql://user:pass@host:port/dbname"   
-e OPENAI_API_KEY="sk-..."   
-e INNGEST_EVENT_KEY="<get from inngest dashboard>"   
-e INNGEST_SIGNING_KEY="<get from inngest dashboard>"   
-e INNGEST_DEV="0"   
-e MINIO_ENDPOINT="s3.ap-southeast-2.amazonaws.com"   
-e MINIO_ACCESS_KEY="<your access key>"   
-e MINIO_SECRET_KEY="<your secret key>"   
-e MINIO_BUCKET="voicemail-heidi"   
-e MINIO_USE_SSL="true"   
palmravicha/heidi-backend:latest
```


*   **DATABASE_URL**: Connection string from Supabase/Neon.
*   **MINIO_ENDPOINT**: The S3 hostname *without* `https://`.
*   **INNGEST_DEV="0"**: Critical for production mode.

### Step 5: Verify
1.  Visit `http://<EC2-PUBLIC-IP>:8000`. You should be redirected to the **Heidi Swagger UI**.
2.  Copy this URL (e.g., `http://54.123.45.67:8000`). This is your **VITE_API_URL**.

---

## Part 2: Deploy Frontend (Vercel)

1.  **Push your code** to GitHub (if not already).
2.  **Import Project** in Vercel.
3.  **Root Directory**: Select `frontend`.
4.  **Environment Variables**:
    *   `VITE_API_URL`: Paste your EC2 URL from Step 5 (e.g., `http://54.123.45.67:8000`).
    *   `VITE_CALENDLY_URL`: Your Calendly link.
5.  **Deploy**.

---

## Part 3: Connect Inngest Cloud
1.  Go to Inngest Cloud -> **Apps**.
2.  **Connect App URL**: `http://<EC2-PUBLIC-IP>:8000/api/inngest`.
3.  It should verify successfully.

## Troubleshooting
*   **Cannot access EC2/Swagger**: Check EC2 Security Group rules. Ensure Port 8000 is open to `0.0.0.0/0`.
*   **Docker Permission Denied**: Ensure you ran `newgrp docker` or use `sudo`.
*   **500 Errors**: use `docker logs heidi-backend` on the EC2 instance to see error details.

