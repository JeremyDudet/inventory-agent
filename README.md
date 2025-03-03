# Inventory Agent

A voice-driven AI agent designed for cafes/restaurants to manage inventory via natural, real-time conversation. It leverages speech recognition, natural language processing, and text-to-speech to allow staff to update and query inventory.

## Features

- Voice-driven inventory management
- Real-time speech-to-text processing
- Natural language processing for command interpretation
- Adaptive confirmation strategies
- Multi-turn context retention
- Role-based access control

## Tech Stack

- **Frontend**: React, Socket.IO
- **Backend**: Express, Bun.js
- **Database**: Supabase/PostgreSQL
- **Speech Recognition**: Deepgram
- **Deployment**: Docker, Kubernetes

## Getting Started

### Prerequisites

- Node.js v20.2.1 or higher
- Bun.js
- Docker (optional)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/inventory-agent.git
   cd inventory-agent
   ```

2. Install dependencies for the frontend:
   ```
   cd frontend
   npm install
   ```

3. Install dependencies for the backend:
   ```
   cd ../backend
   npm install
   ```

4. Set up environment variables:
   - Copy `.env.example` to `.env` in the backend directory
   - Add your Deepgram API key and other required variables

### Running the Application

1. Start the backend server:
   ```
   cd backend
   bun run dev
   ```

2. Start the frontend development server:
   ```
   cd frontend
   npm run dev
   ```

3. Open your browser and navigate to the URL shown in the terminal (typically `http://localhost:5173`)

## Usage

1. Log in with the demo credentials:
   - Email: demo@example.com
   - Password: password

2. Navigate to the dashboard

3. Click the microphone button to start voice recognition

4. Speak commands like:
   - "Add 5 pounds of coffee beans"
   - "Remove 2 gallons of whole milk"
   - "Set 10 bottles of vanilla syrup"

## License

This project is licensed under the MIT License - see the LICENSE file for details. 