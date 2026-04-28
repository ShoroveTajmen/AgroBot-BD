import { OpenAI } from 'openai';
import { cropKnowledgeTool } from '../tools/cropKnowledgeTool.js';
import { weatherTool } from '../tools/weatherTool.js';
import { escalationTool } from '../tools/escalationTool.js';

let openai = null;

const getOpenAI = () => {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
};

// ── Tool definitions for OpenAI function calling ──────────────────────────────
const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'search_crop_diseases',
      description: 'Search the crop disease database for diseases matching the given crop and symptoms. Use this when the farmer mentions a specific crop and describes symptoms.',
      parameters: {
        type: 'object',
        properties: {
          crop: {
            type: 'string',
            description: 'The crop name e.g. rice, wheat, maize, potato, tomato, brinjal, chili, onion, cucumber, jute, mustard, banana, mango'
          },
          symptoms: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of symptoms described by the farmer e.g. ["brown spots", "yellow leaves", "wilting"]'
          }
        },
        required: ['crop', 'symptoms']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get current weather data for a Bangladesh district. Use this when the farmer mentions their location or when weather context would help diagnose the problem.',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'Bangladesh district name e.g. Dhaka, Chittagong, Rajshahi, Khulna, Barisal, Sylhet, Rangpur, Mymensingh'
          }
        },
        required: ['location']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'check_escalation',
      description: 'Check if the diagnosed disease requires escalation to a professional agronomist. Use this after identifying a likely disease.',
      parameters: {
        type: 'object',
        properties: {
          likelyDisease: { type: 'string', description: 'Name of the diagnosed disease' },
          confidence: { type: 'string', enum: ['High', 'Medium', 'Low'], description: 'Confidence level of the diagnosis' },
          causeType: { type: 'string', enum: ['fungal', 'bacterial', 'viral', 'pest'], description: 'Type of disease cause' },
          severity: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Severity of the disease' },
          recommendedActions: { type: 'array', items: { type: 'string' }, description: 'List of recommended actions' }
        },
        required: ['likelyDisease', 'confidence', 'causeType', 'severity']
      }
    }
  }
];

// ── Tool executor: maps function name → actual tool call ──────────────────────
async function executeTool(name, args) {
  console.log(`  🔧 Executing tool: ${name}`, args);

  switch (name) {
    case 'search_crop_diseases': {
      const result = cropKnowledgeTool.searchDiseases(args.crop, args.symptoms);
      console.log(`    ✓ Found ${result.totalMatches ?? 0} matching diseases`);
      return JSON.stringify(result);
    }

    case 'get_weather': {
      const result = await weatherTool.getWeather(args.location);
      console.log(`    ✓ Weather: ${result.temperature}°C, ${result.humidity}% humidity`);
      return JSON.stringify(result);
    }

    case 'check_escalation': {
      const shouldEscalate = escalationTool.shouldEscalate(args);
      console.log(`    ✓ Escalation needed: ${shouldEscalate}`);
      return JSON.stringify({ escalateToAgronomist: shouldEscalate });
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

// ── System prompt for the agentic agent ──────────────────────────────────────
const SYSTEM_PROMPT = `You are AgroBot, an expert agricultural advisory AI for Bangladeshi farmers.

Your goal is to diagnose crop problems and provide practical advice.

## How to respond:

1. **If the farmer's message is vague** (no crop or symptoms mentioned):
   - Ask 2-3 specific follow-up questions directly in your response
   - Do NOT call any tools yet

2. **If crop and symptoms are mentioned**:
   - Call search_crop_diseases tool first
   - If location is mentioned, also call get_weather tool
   - After getting disease results, call check_escalation tool
   - Then provide your final diagnosis

3. **Final response must include**:
   - Disease name and confidence
   - Cause type (fungal/bacterial/viral/pest)
   - Recommended actions (numbered list)
   - Prevention tips
   - Weather impact (if weather data available)
   - Escalation warning (if needed)
   - Bangladesh-specific context

## Rules:
- Always use tools when you have enough information
- You can call multiple tools in one turn
- Be concise and practical for farmers
- Use simple language
- Always respond in the same language the farmer uses`;

// ── Main agentic agent ────────────────────────────────────────────────────────
export const advisoryAgent = {
  async processMessage(userMessage, session) {
    console.log('\n=== AGENTIC PROCESSING ===');
    console.log('User message:', userMessage);

    // Build messages array with full conversation history
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      // Include previous conversation turns
      ...session.messages.slice(-10).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      // Current user message
      { role: 'user', content: userMessage }
    ];

    let toolCallCount = 0;
    const MAX_TOOL_CALLS = 10; // Safety limit to prevent infinite loops

    // ── Agentic loop ──────────────────────────────────────────────────────────
    while (toolCallCount < MAX_TOOL_CALLS) {
      console.log(`\n→ Agent loop iteration ${toolCallCount + 1}`);

      const response = await getOpenAI().chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages,
        tools: TOOL_DEFINITIONS,
        tool_choice: 'auto',   // Agent decides whether to call tools
        temperature: 0.4,
        max_tokens: 1500
      });

      const message = response.choices[0].message;
      const finishReason = response.choices[0].finish_reason;

      console.log(`  Finish reason: ${finishReason}`);

      // Add assistant message to history
      messages.push(message);

      // ── Agent decided to call tools ───────────────────────────────────────
      if (finishReason === 'tool_calls' && message.tool_calls?.length > 0) {
        console.log(`  → Agent requested ${message.tool_calls.length} tool(s)`);

        // Execute ALL requested tools in parallel
        const toolResults = await Promise.all(
          message.tool_calls.map(async (toolCall) => {
            const args = JSON.parse(toolCall.function.arguments);
            const result = await executeTool(toolCall.function.name, args);
            return {
              role: 'tool',
              tool_call_id: toolCall.id,
              content: result
            };
          })
        );

        // Add all tool results back to messages
        messages.push(...toolResults);
        toolCallCount += message.tool_calls.length;
        continue; // Loop again so agent can analyze tool results
      }

      // ── Agent finished — has a final text response ────────────────────────
      if (finishReason === 'stop' && message.content) {
        console.log(`  ✓ Agent finished after ${toolCallCount} tool call(s)`);
        console.log('=== END AGENTIC PROCESSING ===\n');

        // Parse advisory data from the response for structured UI display
        const advisory = this.parseAdvisoryFromResponse(message.content);

        return {
          content: message.content,
          advisory
        };
      }

      // Unexpected finish reason — break to avoid infinite loop
      console.warn(`  ⚠ Unexpected finish reason: ${finishReason}`);
      break;
    }

    // Fallback if loop exhausted
    console.warn('⚠ Max tool calls reached, returning last message');
    const lastMessage = messages[messages.length - 1];
    return {
      content: lastMessage.content || 'I was unable to process your request. Please try again.',
      advisory: null
    };
  },

  // ── Parse structured advisory data from the text response ─────────────────
  // This extracts key fields so the UI can display the advisory card
  parseAdvisoryFromResponse(content) {
    if (!content) return null;

    const lower = content.toLowerCase();

    // Try to extract disease name
    const diseaseMatch = content.match(/\*\*?([A-Z][^*\n]+(?:disease|blight|rot|wilt|rust|smut|borer|virus|mildew|spot|blast|burn)[^*\n]*)\*\*?/i)
      || content.match(/(?:disease|diagnosis|identified)[:\s]+\*?\*?([^\n*]+)/i);

    // Try to extract confidence
    const confidenceMatch = content.match(/confidence[:\s]+\*?\*?(High|Medium|Low)\*?\*?/i);

    // Try to extract cause type
    const causeMatch = content.match(/cause[:\s]+\*?\*?(fungal|bacterial|viral|pest)\*?\*?/i);

    // Check for escalation warning
    const escalate = lower.includes('consult an agronomist') || lower.includes('professional') || lower.includes('⚠');

    // Extract recommended actions
    const actionsMatch = content.match(/(?:recommended actions?|treatment)[:\s]*\n((?:\d+\..+\n?)+)/i);
    const actions = actionsMatch
      ? actionsMatch[1].split('\n').filter(l => l.trim()).map(l => l.replace(/^\d+\.\s*/, '').trim())
      : [];

    // Only return advisory object if we found a disease
    if (!diseaseMatch && !confidenceMatch) return null;

    return {
      likelyDisease: diseaseMatch?.[1]?.trim() || null,
      confidence: confidenceMatch?.[1] || 'Medium',
      causeType: causeMatch?.[1] || null,
      recommendedActions: actions,
      escalateToAgronomist: escalate
    };
  }
};
