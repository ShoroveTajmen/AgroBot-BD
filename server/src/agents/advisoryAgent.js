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

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are AgroBot, an expert agricultural advisory AI for Bangladeshi farmers.
Your goal is to diagnose crop problems and provide practical, actionable advice.

## How to handle each message:

You have access to three tools. Use them whenever they are relevant — you decide:
- search_crop_diseases: Use when you know the crop type AND have symptom information
- get_weather: Use when the farmer mentions a location/district
- check_escalation: Use after you have identified a likely disease

## Conversation flow:

If the farmer's message does not yet have enough information to diagnose (no crop type, no symptoms),
ask 2-3 focused follow-up questions. Do NOT call tools yet.

Once you have enough information (crop + symptoms at minimum), call the relevant tools and give a full diagnosis.

If the farmer asks a follow-up question after a diagnosis (e.g. organic alternatives, cost, prevention),
answer it directly from your knowledge. Only call tools again if new symptoms or a new location is mentioned.

## Final diagnosis format (use when you have enough info):
- **Disease:** name
- **Confidence:** High/Medium/Low
- **Cause:** fungal/bacterial/viral/pest
- **Recommended Actions:** numbered list
- **Prevention Tips:** numbered list
- **Weather Impact:** (if weather data available)
- **Bangladesh Context:** local relevance
- ⚠ Escalation warning if needed

## When crop is NOT in the database (search_crop_diseases returns found: false):
- Tell the farmer this crop is not in the verified database yet and show supported crops
- Still give advice using your own agricultural knowledge, structured like the format above
- Mark confidence as Low and add: "This advice is based on general agricultural knowledge, not our verified crop database."
- Still call check_escalation and get_weather if location is known

## General rules:
- Be concise and practical
- Use simple language suitable for farmers
- Respond in English by default; switch to Bangla only if the farmer writes in Bangla first`;

// ── Main agentic agent ────────────────────────────────────────────────────────
export const advisoryAgent = {
  async processMessage(userMessage, session) {
    console.log('\n=== AGENTIC PROCESSING ===');
    console.log('User message:', userMessage);

    // Build messages array: system prompt + last 10 conversation messages + current message
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...session.messages.slice(-10).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    let toolCallCount = 0;
    const MAX_TOOL_CALLS = 10;

    // ── Agentic loop ──────────────────────────────────────────────────────────
    while (toolCallCount < MAX_TOOL_CALLS) {
      console.log(`\n→ Agent loop iteration ${toolCallCount + 1}`);

      const response = await getOpenAI().chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages,
        tools: TOOL_DEFINITIONS,
        tool_choice: 'auto',
        temperature: 0.4,
        max_tokens: 1500
      });

      const message = response.choices[0].message;
      const finishReason = response.choices[0].finish_reason;

      console.log(`  Finish reason: ${finishReason}`);

      // Add assistant message to history for next iteration
      messages.push(message);

      // ── Agent decided to call tools ───────────────────────────────────────
      if (finishReason === 'tool_calls' && message.tool_calls?.length > 0) {
        console.log(`  → Agent requested ${message.tool_calls.length} tool(s)`);

        // Execute all requested tools in parallel
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

        messages.push(...toolResults);
        toolCallCount += message.tool_calls.length;
        continue;
      }

      // ── Agent finished — has a final text response ────────────────────────
      if (finishReason === 'stop' && message.content) {
        // A response counts as a diagnosis if tools were called this turn
        const isDiagnosis = toolCallCount > 0;
        console.log(`  ✓ Agent finished — ${isDiagnosis ? 'DIAGNOSIS' : 'CONVERSATIONAL'} response (${toolCallCount} tool calls)`);
        console.log('=== END AGENTIC PROCESSING ===\n');

        return {
          content: message.content,
          // Only attach advisory card data when a fresh diagnosis was made
          advisory: isDiagnosis ? this.parseAdvisoryFromResponse(message.content) : null
        };
      }

      console.warn(`  ⚠ Unexpected finish reason: ${finishReason}`);
      break;
    }

    // Fallback if max tool calls exceeded
    console.warn('⚠ Max tool calls reached');
    const lastMessage = messages[messages.length - 1];
    return {
      content: lastMessage.content || 'I was unable to process your request. Please try again.',
      advisory: null
    };
  },

  // ── Parse structured advisory data from the text response ─────────────────
  // Extracts key fields so the UI can render the advisory card
  parseAdvisoryFromResponse(content) {
    if (!content) return null;

    const lower = content.toLowerCase();

    // Detect general knowledge fallback (crop not in database)
    const isGeneralKnowledge = lower.includes('not in our verified database') ||
      lower.includes('general knowledge') ||
      lower.includes('general agricultural knowledge');

    // Extract disease name
    const diseaseMatch = content.match(/\*\*?(?:disease(?:\s*\(general knowledge\))?)[:\s]+([^\n*]+)\*\*?/i)
      || content.match(/\*\*?([A-Z][^*\n]+(?:disease|blight|rot|wilt|rust|smut|borer|virus|mildew|spot|blast|burn)[^*\n]*)\*\*?/i)
      || content.match(/(?:disease|diagnosis|identified)[:\s]+\*?\*?([^\n*]+)/i);

    // Extract confidence
    const confidenceMatch = content.match(/confidence[:\s]+\*?\*?(High|Medium|Low)\*?\*?/i);

    // Extract cause type
    const causeMatch = content.match(/cause[:\s]+\*?\*?(fungal|bacterial|viral|pest)\*?\*?/i);

    // Check for escalation warning
    const escalate = lower.includes('consult an agronomist') ||
      lower.includes('consult a local agronomist') ||
      lower.includes('professional') ||
      lower.includes('⚠');

    // Extract recommended actions
    const actionsMatch = content.match(/(?:recommended actions?|treatment)[:\s]*\n((?:\d+\..+\n?)+)/i);
    const actions = actionsMatch
      ? actionsMatch[1].split('\n').filter(l => l.trim()).map(l => l.replace(/^\d+\.\s*/, '').trim())
      : [];

    if (isGeneralKnowledge) {
      return {
        likelyDisease: diseaseMatch?.[1]?.trim() || 'Unknown (crop not in database)',
        confidence: 'Low',
        causeType: causeMatch?.[1] || null,
        recommendedActions: actions,
        escalateToAgronomist: true,
        isGeneralKnowledge: true
      };
    }

    if (!diseaseMatch && !confidenceMatch) return null;

    return {
      likelyDisease: diseaseMatch?.[1]?.trim() || null,
      confidence: confidenceMatch?.[1] || 'Medium',
      causeType: causeMatch?.[1] || null,
      recommendedActions: actions,
      escalateToAgronomist: escalate,
      isGeneralKnowledge: false
    };
  }
};
