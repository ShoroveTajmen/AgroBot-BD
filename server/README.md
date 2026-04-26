# AgroBot BD Server

Node.js backend for the AgroBot BD crop disease advisory system.

## Features

- Express.js REST API
- OpenAI integration for conversational AI
- Crop disease knowledge base
- Weather information integration
- Session management with MongoDB
- Rate limiting for security

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and update with your values:

```bash
cp .env.example .env
```

Required environment variables:
- `OPENAI_API_KEY` - Your OpenAI API key
- `OPENAI_MODEL` - Model to use (default: gpt-4o-mini)
- `MONGODB_URI` - MongoDB connection string
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (default: development)

## Running

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

## API Endpoints

### POST /api/chat
Send a message to the AI agent.

### GET /api/sessions
Get all sessions.

### POST /api/sessions
Create a new session.

## Project Structure

```
server/
├── src/
│   ├── agents/      # AI agent logic
│   ├── tools/       # External tools
│   ├── controllers/ # Route controllers
│   ├── models/      # Database models
│   ├── routes/      # API routes
│   ├── services/    # Business logic
│   └── prompts/     # AI prompts
├── .env.example
├── package.json
└── README.md
```

## Testing

```bash
npm test
```

## License

MIT
