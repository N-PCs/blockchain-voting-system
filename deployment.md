# Deployment Guide: Blockchain Voting System

This document provides step-by-step instructions for deploying the Decentralized Blockchain Voting System to the cloud.

## Recommended Tech Stack for Deployment
- **Database**: Railway (MySQL) or Aiven (MySQL)
- **Backend (API & WebSockets)**: Render or Railway
- **Frontend (Web)**: Vercel or Netlify

---

## 1. Database Setup (MySQL)
Most cloud platforms require a persistent MySQL database. We recommend **Railway.app**.

1.  Go to [Railway.app](https://railway.app/) and create a new project.
2.  Add a **MySQL** service.
3.  Once the database is created, go to the **Variables** tab to find your connection details:
    -   `MYSQLHOST`
    -   `MYSQLUSER`
    -   `MYSQLPASSWORD`
    -   `MYSQLDATABASE`
    -   `MYSQLPORT`

---

## 2. Backend Deployment (Flask & WebSockets)
You can deploy the backend to **Render.com**.

### Prerequisites
Update `backend/db.py` to use environment variables for database connection:
```python
import os
import mysql.connector

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        user=os.getenv('DB_USER', 'project'),
        password=os.getenv('DB_PASSWORD', 'np'),
        database=os.getenv('DB_NAME', 'voting_system'),
        port=os.getenv('DB_PORT', '3306')
    )
```

### Steps to Deploy on Render
1.  Connect your GitHub repository to Render.
2.  Create a new **Web Service**.
3.  **Environment**: `Python`
4.  **Build Command**: `pip install -r backend/requirements.txt`
5.  **Start Command**: `gunicorn --worker-class eventlet -w 1 backend.app:app`
    *Note: For Python 3.13+, use `gevent` if `eventlet` fails.*
6.  **Environment Variables**:
    -   `DB_HOST`: Your Railway MySQL host
    -   `DB_USER`: Your Railway MySQL user
    -   `DB_PASSWORD`: Your Railway MySQL password
    -   `DB_NAME`: Your Railway MySQL database name
    -   `DB_PORT`: Your Railway MySQL port (usually 3306)

---

## 3. Frontend Deployment (React)
Deploy the frontend to **Vercel**.

1.  Connect your GitHub repository to [Vercel](https://vercel.com/).
2.  Select the `frontend-new` directory as the **Root Directory**.
3.  **Framework Preset**: `Create React App`
4.  **Environment Variables**:
    -   `REACT_APP_API_URL`: The URL of your deployed backend (e.g., `https://your-backend.onrender.com`)
    -   `REACT_APP_WS_URL`: The WebSocket URL (e.g., `wss://your-backend.onrender.com`)
5.  Click **Deploy**.

---

## 4. Environment Variables Summary

| Component | Variable Name | Description |
| :--- | :--- | :--- |
| **Backend** | `DB_HOST` | MySQL hostname |
| **Backend** | `DB_USER` | MySQL username |
| **Backend** | `DB_PASSWORD` | MySQL password |
| **Backend** | `DB_NAME` | MySQL database name |
| **Frontend**| `REACT_APP_API_URL` | Backend API URL |
| **Frontend**| `REACT_APP_WS_URL` | Backend WebSocket URL |

---

## Troubleshooting
- **CORS Errors**: Ensure `cors_allowed_origins="*"` is set in `app.py` and `ws_server.py`.
- **Python 3.13 Compatibility**: If you see `AttributeError: module 'ssl' has no attribute 'wrap_socket'`, replace `eventlet` with `gevent` in `requirements.txt` and use `--worker-class gevent` in your start command.
- **DB Connection**: Ensure your MySQL database allows external connections (Railway does this by default).
