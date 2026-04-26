# AgroBot BD

AI-Powered Crop Disease and Advisory Web Application for Bangladeshi Farmers

## Overview

AgroBot BD helps farmers identify possible crop diseases and receive practical first-step advice. Farmers describe crop problems in plain text, and the AI agent asks follow-up questions, uses external tools, consults the crop knowledge base, and provides structured recommendations.

## Features

- 🌾 Crop disease identification for major Bangladeshi crops
- 💬 Conversational AI assistant
- 🌦️ Weather-aware recommendations
- 📋 Structured advisory output
- ⚠️ Smart escalation to agronomists
- 💾 Session persistence

## Supported Crops

- Rice
- Wheat
- Maize
- Potato
- Tomato
- Brinjal
- Chili
- Onion
- Cucumber
- Jute
- Mustard
- Banana
- Mango

## Technology Stack

### Frontend
- React
- Vite
- Axios

### Backend
- Node.js
- Express.js
- OpenAI API
- MongoDB

### Testing
- Vitest
- Playwright

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- OpenAI API key

### Installation

1. Clone the repository:
```bash
cd agrobot-bd
```

2. Install backend dependencies:
```bash
cd server
npm install
```

3. Install frontend dependencies:
```bash
cd ../client
npm install
```

4. Configure environment variables:
```bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env with your configuration
```

5. Start MongoDB:
```bash
# Make sure MongoDB is running on your system
```

6. Start the development servers:

Backend:
```bash
cd server
npm run dev
```

Frontend:
```bash
cd client
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
agrobot-bd/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/    # API services
│   │   └── utils/       # Utility functions
│   └── package.json
├── server/              # Node.js backend
│   ├── src/
│   │   ├── agents/      # AI agent logic
│   │   ├── tools/       # External tools
│   │   ├── controllers/ # Route controllers
│   │   ├── models/      # Database models
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   └── prompts/     # AI prompts
│   └── package.json
└── README.md
```

## API Endpoints

### POST /api/chat
Send a message to the AI agent.

**Request Body:**
```json
{
  "sessionId": "session_id",
  "message": "My rice leaves have brown spots"
}
```

**Response:**
```json
{
  "sessionId": "session_id",
  "response": {
    "content": "Based on your description...",
    "advisory": {
      "likelyDisease": "Brown Spot",
      "confidence": "High",
      "recommendedActions": [...]
    }
  }
}
```

### GET /api/sessions
Get all sessions.

### POST /api/sessions
Create a new session.

## Development

### Running Tests

Backend:
```bash
cd server
npm test
```

Frontend:
```bash
cd client
npm test
```

### Code Quality

Run linter:
```bash
npm run lint
```

## Deployment

### Environment Variables

Required environment variables:
- `OPENAI_API_KEY` - Your OpenAI API key
- `MONGODB_URI` - MongoDB connection string
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)

### Production Build

1. Build frontend:
```bash
cd client
npm run build
```

2. Start server:
```bash
cd server
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT License

## Acknowledgments

- Powered by OpenAI GPT models
- Crop disease data from Kaggle dataset
- Designed specifically for Bangladeshi agricultural conditions
