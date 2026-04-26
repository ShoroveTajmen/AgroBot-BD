# AgroBot BD Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v6 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **OpenAI API Key** - [Get one here](https://platform.openai.com/api-keys)

## Step-by-Step Setup

### Step 1: Clone and Navigate

```bash
cd agrobot-bd
```

### Step 2: Install Backend Dependencies

```bash
cd server
npm install
```

This will install:
- express - Web framework
- dotenv - Environment variable management
- openai - OpenAI SDK
- mongoose - MongoDB ODM
- cors - Cross-origin resource sharing
- express-rate-limit - Rate limiting
- nodemon - Development server
- vitest - Testing framework

### Step 3: Install Frontend Dependencies

```bash
cd ../client
npm install
```

This will install:
- react - UI library
- react-dom - React DOM renderer
- axios - HTTP client
- vite - Build tool
- @vitejs/plugin-react - React plugin for Vite

### Step 4: Configure Environment Variables

#### Backend Configuration

```bash
cd ../server
cp .env.example .env
```

Edit the `.env` file with your values:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini

# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/agrobot_bd

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Frontend Configuration

No environment variables needed for development. The proxy is configured in `vite.config.js`.

### Step 5: Start MongoDB

Make sure MongoDB is running on your system.

**Windows (if installed as service):**
```bash
# MongoDB should start automatically as a service
# Check status in Services app or run:
net start MongoDB
```

**Or start manually:**
```bash
mongod --dbpath="C:\data\db"
```

**Verify MongoDB is running:**
```bash
mongosh --eval "db.runCommand({ ping: 1 })"
```

### Step 6: Start the Application

#### Option A: Start Both Servers Separately

**Terminal 1 - Backend:**
```bash
cd agrobot-bd/server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd agrobot-bd/client
npm run dev
```

#### Option B: Start Production Server

**Build frontend first:**
```bash
cd agrobot-bd/client
npm run build
```

**Start backend (serves static files):**
```bash
cd agrobot-bd/server
npm start
```

### Step 7: Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## Testing the Setup

### Test Backend API

```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

### Test Health Check

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Troubleshooting

### MongoDB Connection Issues

**Error:** `MongoDB connection error`

**Solutions:**
1. Ensure MongoDB is running
2. Check MongoDB URI in `.env`
3. Verify MongoDB is accessible on port 27017

### OpenAI API Issues

**Error:** `OpenAI API key not found`

**Solutions:**
1. Verify `OPENAI_API_KEY` in `.env`
2. Check that the API key is valid
3. Ensure the API key has sufficient credits

### Port Already in Use

**Error:** `EADDRINUSE: address already in use`

**Solutions:**
1. Change the PORT in `.env`
2. Or kill the process using the port:
   ```bash
   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <pid> /F
   ```

### Module Not Found

**Error:** `Cannot find module`

**Solutions:**
1. Run `npm install` in the correct directory
2. Delete `node_modules` and `package-lock.json`, then reinstall

## Next Steps

After setup is complete:

1. **Explore the UI** - Try different crop problems
2. **Review the Code** - Understand the architecture
3. **Customize** - Add your own features
4. **Deploy** - Follow deployment guide

## Deployment

See the main README for deployment instructions.

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review error logs in the terminal
3. Verify all prerequisites are installed
4. Check environment variables are set correctly
