# Blockchain Voting System

This is a simulated blockchain-based voting system using Python/Flask for the backend and React for the frontend.

## Setup Instructions

### Backend
1. Navigate to `backend/`.
2. Install dependencies: `pip install -r requirements.txt`.
3. Run the server: `python app.py`.

### Frontend
1. Navigate to `frontend/`.
2. Install dependencies: `npm install`.
3. Run the app: `npm start`.

The frontend will run on `http://localhost:3000` and proxy API requests to the backend at `http://localhost:5000`.

## Usage
- Use the form to cast votes (enter a unique Voter ID and select a candidate).
- View real-time results and the full blockchain.
