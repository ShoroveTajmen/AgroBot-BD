# AgroBot BD Project Structure

```
agrobot-bd/
├── agro_bot_bd_implementation_guide.md    # Original implementation guide
├── crop_diseases.json                      # Crop disease dataset
├── .gitignore                              # Git ignore rules
├── README.md                               # Main project README
├── SETUP.md                                # Detailed setup guide
├── PROJECT_STRUCTURE.md                    # This file
│
├── client/                                 # React frontend application
│   ├── index.html                          # HTML entry point
│   ├── package.json                        # Dependencies and scripts
│   ├── package-lock.json                   # Lock file
│   ├── vite.config.js                      # Vite configuration
│   ├── README.md                           # Client README
│   │
│   └── src/
│       ├── main.js                         # Application entry point
│       ├── components/
│       │   └── ChatUI.js                   # Chat UI component
│       ├── services/
│       │   └── ChatService.js              # API service layer
│       └── utils/                          # Utility functions (if needed)
│
├── server/                                 # Node.js backend application
│   ├── src/
│   │   ├── server.js                       # Express server entry point
│   │   ├── controllers/
│   │   │   ├── chatController.js           # Chat endpoint controller
│   │   │   └── sessionController.js        # Session management controller
│   │   ├── models/
│   │   │   └── Session.js                  # MongoDB session model
│   │   ├── routes/
│   │   │   └── api.js                      # API routes
│   │   ├── agents/
│   │   │   └── advisoryAgent.js            # Main AI agent logic
│   │   ├── tools/
│   │   │   ├── cropKnowledgeTool.js        # Crop disease search tool
│   │   │   ├── weatherTool.js              # Weather information tool
│   │   │   ├── escalationTool.js           # Escalation decision tool
│   │   │   ├── cropKnowledgeTool.test.js   # Unit tests
│   │   │   └── escalationTool.test.js      # Unit tests
│   │   ├── prompts/
│   │   │   └── systemPrompts.js            # AI prompt templates
│   │   └── utils/                          # Utility functions (if needed)
│   │
│   ├── .env.example                        # Environment template
│   ├── package.json                        # Dependencies and scripts
│   ├── package-lock.json                   # Lock file
│   ├── vite.config.js                      # Vitest configuration
│   ├── README.md                           # Server README
│   └── crop_diseases.json                  # Crop disease dataset
│
└── .kiro/                                  # Kiro configuration (if needed)
```

## File Descriptions

### Core Application Files

| File | Purpose |
|------|---------|
| `server/src/server.js` | Express server setup, middleware, routes |
| `client/src/main.js` | React app entry point, event handlers |
| `server/src/agents/advisoryAgent.js` | Main AI agent orchestration |

### AI Agent Components

| File | Purpose |
|------|---------|
| `server/src/agents/advisoryAgent.js` | Processes messages, manages conversation flow |
| `server/src/prompts/systemPrompts.js` | AI prompt templates for different scenarios |
| `server/src/tools/cropKnowledgeTool.js` | Searches crop disease database |
| `server/src/tools/weatherTool.js` | Gets weather information for locations |
| `server/src/tools/escalationTool.js` | Determines when to escalate to agronomist |

### API Layer

| File | Purpose |
|------|---------|
| `server/src/controllers/chatController.js` | Handles chat API requests |
| `server/src/controllers/sessionController.js` | Manages chat sessions |
| `server/src/routes/api.js` | API route definitions |

### Data Layer

| File | Purpose |
|------|---------|
| `server/src/models/Session.js` | MongoDB session schema |
| `server/crop_diseases.json` | Crop disease knowledge base |

### Frontend Components

| File | Purpose |
|------|---------|
| `client/src/components/ChatUI.js` | Chat interface rendering |
| `client/src/services/ChatService.js` | HTTP client for API calls |

## SOLID Principles Implementation

### Single Responsibility Principle (SRP)
- Each module has one responsibility
- `WeatherService` → only weather data
- `DiseaseMatcher` → only disease matching
- `AdvisoryGenerator` → only advisory generation

### Open/Closed Principle (OCP)
- Modules are open for extension, closed for modification
- New crops can be added to dataset without code changes
- New tools can be added by implementing the tool interface

### Liskov Substitution Principle (LSP)
- Tool implementations are interchangeable
- Any weather provider can be swapped

### Interface Segregation Principle (ISP)
- Small, focused interfaces
- `IWeatherService`, `IKnowledgeProvider`, `IEscalationEvaluator`

### Dependency Inversion Principle (DIP)
- High-level modules depend on abstractions
- Agent depends on tool interfaces, not concrete implementations

## Testing Strategy

### Unit Tests
- `server/src/tools/cropKnowledgeTool.test.js`
- `server/src/tools/escalationTool.test.js`

### Integration Tests
- API endpoint tests
- Tool interaction tests

### E2E Tests
- Full farmer chat flow
- Follow-up question flow

## Security Features

- Rate limiting on API endpoints
- Environment variable management
- Input validation
- CORS configuration
- Error handling without exposing sensitive info

## Scalability Considerations

- Session-based conversation history
- Tool caching for repeated queries
- Database indexing for fast lookups
- Async tool execution
- Load balancing ready
