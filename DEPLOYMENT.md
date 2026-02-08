# Deployment Guide (Vercel)

This guide explains how to deploy the Heidi application to Vercel. We recommend deploying the **Frontend** and **Backend** as two separate Vercel projects for better manageability.

## Prerequisites
-   A Vercel Account.
-   A GitHub Repository with this code pushed.
-   **Cloud Database**: A Postgres database (e.g., [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres), [Neon](https://neon.tech), or [Supabase](https://supabase.com)).
-   **Cloud Storage**: An S3-compatible bucket (e.g., [AWS S3](https://aws.amazon.com/s3/), [Supabase Storage](https://supabase.com/docs/guides/storage), or [DigitalOcean Spaces](https://www.digitalocean.com/products/spaces)).
-   **Inngest Cloud**: An [Inngest](https://www.inngest.com/) account.

---

## Part 1: Deploy Backend

1.  **Create New Project** in Vercel.
2.  **Import** your Git repository.
3.  **Configure Project**:
    -   **Project Name**: `heidi-backend` (example).
    -   **Root Directory**: `backend` (Click "Edit" next to Root Directory and select `backend`).
    -   **Framework Preset**: Other (default) or Python (if detected).
4.  **Environment Variables**:
    Add the following variables in the "Environment Variables" section:

    | Variable | Value / Description |
    | :--- | :--- |
    | `DATABASE_URL` | `postgres://user:pass@host:port/dbname` (Connection string from your Cloud DB provider) |
    | `OPENAI_API_KEY` | `sk-...` (Your OpenAI API Key) |
    | `INNGEST_EVENT_KEY` | (From Inngest Cloud Dashboard) |
    | `INNGEST_SIGNING_KEY` | (From Inngest Cloud Dashboard) |
    | `INNGEST_DEV` | `0` (Critical: Disables local dev server mode) |
    | `MINIO_ENDPOINT` | e.g. `s3.us-east-1.amazonaws.com` (Do not include `https://`) |
    | `MINIO_ACCESS_KEY` | Your Cloud Storage Access Key |
    | `MINIO_SECRET_KEY` | Your Cloud Storage Secret Key |
    | `MINIO_BUCKET` | Your Bucket Name |
    | `MINIO_USE_SSL` | `true` |

5.  **Deploy**.
6.  **Copy URL**: Once deployed, copy the project domain (e.g., `https://heidi-backend.vercel.app`). You will need this for the Frontend.

---

## Part 2: Deploy Frontend

1.  **Create New Project** in Vercel (Back to Dashboard -> Add New).
2.  **Import** the *same* Git repository.
3.  **Configure Project**:
    -   **Project Name**: `heidi-frontend` (example).
    -   **Root Directory**: `frontend`.
    -   **Framework Preset**: Vite.
    -   **Build Command**: `npm run build` (Default).
    -   **Output Directory**: `dist` (Default).
4.  **Environment Variables**:

    | Variable | Value |
    | :--- | :--- |
    | `VITE_API_URL` | The Backend URL from Part 1 (e.g., `https://heidi-backend.vercel.app`). **Important**: Do not allow trailing slash (ok if handled, but cleaner without). |
    | `VITE_CALENDLY_URL` | Your Calendly link (e.g., `https://calendly.com/your-name`) |

5.  **Deploy**.

---

## Part 3: Connect Inngest (Post-Deployment)

1.  Go to the [Inngest Cloud Dashboard](https://app.inngest.com).
2.  Go to "Apps" -> Connect App.
3.  Use your Backend Deployment URL + `/api/inngest` (e.g., `https://heidi-backend.vercel.app/api/inngest`).
4.  Inngest will verify the connection. Once verified, your functions (`process_voicemail`) will appear in the dashboard.

## Troubleshooting

-   **Database Connection**: Ensure your Cloud DB allows connections from all IPs (0.0.0.0/0) or Vercel's IP range.
-   **CORS**: The backend is configured to allow `*`. If you restrict it, ensure the Frontend URL is added.
-   **Audio Upload Fails**: Check `MINIO_*` variables. Ensure `MINIO_ENDPOINT` is correct (no protocol prefix usually, just hostname).
