# Tool Calling System - How It Works

## Overview
Your AgroBot uses an **intelligent tool calling system** that automatically executes specialized tools for each chat message to provide accurate agricultural advice.

## Architecture

```
User Message → Advisory Agent → Tool Execution → AI Analysis → Response
```

## How It Works for Each Chat

### 1. **Message Processing Flow**
When a user sends a message, here's what happens:

```javascript
// File: server/src/controllers/chatController.js
POST /api/chat
  ↓
advisoryAgent.processMessage(message, conversation)
  ↓
[Tool Calling System Activates]
```

### 2. **Advisory Agent Workflow**
**File:** `server/src/agents/advisoryAgent.js`

#### Step 1: Check if Follow-up Questions Needed
```javascript
const needsFollowUp = await this.checkNeedsFollowUp(userMessage, conversationHistory);
```
- Uses OpenAI to determine if more information is needed
- If yes: Returns follow-up questions
- If no: Proceeds to tool execution

#### Step 2: Extract Context from Conversation
```javascript
const context = this.extractContext(conversationHistory);
```
Extracts:
- **Crop name**: rice, wheat, maize, potato, tomato, etc.
- **Location**: Dhaka, Chittagong, Rajshahi, etc.
- **Symptoms**: brown spots, yellow leaves, wilting, etc.
- **Duration**, **irrigation**, **season**

#### Step 3: Run Tools Automatically
```javascript
const toolResults = await this.runTools(context);
```

**Tools are executed conditionally:**

| Tool | When It Runs | What It Does |
|------|-------------|--------------|
| **Crop Knowledge Tool** | If crop + symptoms detected | Searches disease database, matches symptoms, scores diseases |
| **Weather Tool** | If location detected | Gets weather data (temp, humidity, rainfall) |
| **Escalation Tool** | Always (after advisory) | Determines if expert consultation needed |

#### Step 4: Generate Advisory with AI
```javascript
const advisory = await this.generateAdvisory(userMessage, context, toolResults);
```
- Sends tool results + context to OpenAI
- Gets structured JSON response with:
  - `likelyDisease`
  - `confidence` (High/Medium/Low)
  - `causeType` (fungal/bacterial/viral/pest)
  - `recommendedActions[]`
  - `preventionTips[]`
  - `bangladeshContext`

#### Step 5: Format and Return Response
```javascript
const response = this.formatAdvisory(advisory);
```
- Formats advisory into readable text
- Adds escalation warning if needed
- Returns to user

---

## Tool Details

### 🌾 **Crop Knowledge Tool**
**File:** `server/src/tools/cropKnowledgeTool.js`

**How it works:**
1. Loads disease database from `crop_diseases.json`
2. Filters diseases by crop name
3. Scores each disease based on symptom matching:
   - Exact symptom match: +2 points
   - Partial word match: +1 point
4. Returns top 5 matching diseases sorted by score

**Example:**
```javascript
Input: crop="rice", symptoms=["brown spots", "yellow leaves"]
Output: {
  diseases: [
    { diseaseName: "Brown Spot", matchScore: 5, symptoms: [...], treatment: [...] },
    { diseaseName: "Bacterial Leaf Blight", matchScore: 3, ... }
  ],
  totalMatches: 2
}
```

### 🌤️ **Weather Tool**
**File:** `server/src/tools/weatherTool.js`

**How it works:**
1. Takes location (district name)
2. Returns weather data (currently mock data, can integrate real API)
3. Generates weather impact message:
   - High humidity (>70%) → Fungal disease risk
   - Heavy rainfall (>15mm) → Disease spread risk
   - High temperature (>33°C) → Pest reproduction
   - Low temperature (<25°C) → Fungal disease risk

**Example:**
```javascript
Input: location="Dhaka"
Output: {
  temperature: 32,
  humidity: 75,
  rainfall: 12,
  condition: "Humid",
  message: "High humidity may promote fungal disease spread"
}
```

### ⚠️ **Escalation Tool**
**File:** `server/src/tools/escalationTool.js`

**How it works:**
Automatically determines if farmer needs expert consultation based on:

| Condition | Escalate? |
|-----------|-----------|
| High severity disease | ✅ Yes |
| Low confidence diagnosis | ✅ Yes |
| Multiple high-severity symptoms | ✅ Yes |
| Uncertain diagnosis (similar scores) | ✅ Yes |
| Viral/bacterial disease | ✅ Yes |
| Otherwise | ❌ No |

**Example:**
```javascript
Input: advisory = { causeType: "viral", confidence: "Low" }
Output: true (escalate to agronomist)
```

---

## Execution Flow Example

### User Message: "My rice plants have brown spots on leaves"

```
1. Extract Context:
   ✓ Crop: "rice"
   ✓ Symptoms: ["brown spots", "leaves"]
   ✗ Location: not mentioned

2. Run Tools:
   → Crop Knowledge Tool:
     ✓ Found 15 diseases for rice
     ✓ Top match: "Brown Spot" (score: 5)
     ✓ 2nd match: "Bacterial Leaf Blight" (score: 3)
   
   → Weather Tool:
     ✗ Skipped (no location)
   
3. Generate Advisory (OpenAI):
   {
     "likelyDisease": "Brown Spot (Helminthosporium oryzae)",
     "confidence": "High",
     "causeType": "fungal",
     "recommendedActions": [
       "Apply fungicide containing Mancozeb or Carbendazim",
       "Remove and destroy infected leaves",
       "Improve field drainage"
     ],
     "preventionTips": [
       "Use disease-resistant rice varieties",
       "Maintain proper plant spacing"
     ]
   }

4. Check Escalation:
   ✗ No escalation needed (high confidence, fungal disease)

5. Format Response:
   "*Brown Spot (Helminthosporium oryzae)*
   
   **Confidence:** High
   **Cause:** Fungal
   
   **Recommended Actions:**
   1. Apply fungicide containing Mancozeb or Carbendazim
   2. Remove and destroy infected leaves
   3. Improve field drainage
   
   **Prevention Tips:**
   1. Use disease-resistant rice varieties
   2. Maintain proper plant spacing"
```

---

## Console Logs

When tools execute, you'll see logs like:

```
=== AGENT PROCESSING ===
User message: My rice plants have brown spots on leaves
Extracted context: { crop: 'rice', symptoms: ['brown spots', 'leaves'], location: null }
→ Running tools...
  → Crop Knowledge Tool: Searching for "rice" with symptoms: brown spots, leaves
    ✓ Found 15 diseases for rice
    ✓ Top matches: Brown Spot (5), Bacterial Leaf Blight (3)
  → Weather Tool: Skipped (no location)
Tool results: { cropKnowledge: { diseases: [...], totalMatches: 2 } }
Generated advisory: Brown Spot (Helminthosporium oryzae)
  → Escalation Tool: Checking if escalation is needed
    ✗ No escalation needed
=== END AGENT PROCESSING ===
```

---

## Key Features

### ✅ **Automatic Tool Selection**
- Tools run automatically based on available context
- No manual tool calling needed
- Intelligent conditional execution

### ✅ **Context Accumulation**
- Conversation history is analyzed
- Context builds up across multiple messages
- Follow-up questions fill in missing information

### ✅ **Structured Output**
- AI returns JSON format
- Consistent advisory structure
- Easy to display in UI

### ✅ **Safety Checks**
- Escalation tool ensures critical cases get expert attention
- Confidence levels indicate reliability
- Weather impact warnings

---

## Future Enhancements

### 🔄 **Real Weather API Integration**
Replace mock data with:
- OpenWeatherMap API
- Bangladesh Meteorological Department API
- Real-time weather data

### 🔄 **Image Analysis Tool**
Add computer vision:
- Upload crop photos
- AI analyzes images
- Visual symptom detection

### 🔄 **Soil Analysis Tool**
- Soil pH recommendations
- Nutrient deficiency detection
- Fertilizer suggestions

### 🔄 **Market Price Tool**
- Current crop prices
- Market trends
- Best selling times

### 🔄 **Pest Identification Tool**
- Pest database
- Lifecycle information
- Control methods

---

## Testing Tools

You can test individual tools:

```bash
# Test Crop Knowledge Tool
cd server
node src/tools/cropKnowledgeTool.test.js

# Test Escalation Tool
node src/tools/escalationTool.test.js
```

---

## Summary

**Yes, tool calling happens for EACH chat message!**

The system:
1. ✅ Analyzes every user message
2. ✅ Extracts context automatically
3. ✅ Runs relevant tools conditionally
4. ✅ Combines tool results with AI reasoning
5. ✅ Returns comprehensive agricultural advice

This creates an intelligent, context-aware agricultural advisory system that gets smarter with each message in the conversation!
