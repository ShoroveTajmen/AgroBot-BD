import { OpenAI } from 'openai';
import { cropKnowledgeTool } from '../tools/cropKnowledgeTool.js';
import { weatherTool } from '../tools/weatherTool.js';
import { escalationTool } from '../tools/escalationTool.js';

let openai = null;
const getOpenAI = () => {
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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

// ── Tool executor ─────────────────────────────────────────────────────────────
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

// ── Conversation state detection ──────────────────────────────────────────────
//
// We support two conversation flows:
//
//  TEXT FLOW  (no image ever sent)
//    Requires MIN_TEXT_FOLLOWUPS follow-up rounds before final answer.
//
//  IMAGE FLOW (a user message has imageAnalysisSummary set, OR current message
//              contains [Image Analysis:] — the latter covers the very first turn
//              before the message is saved to DB)
//
// detectConversationState returns one of:
//   { mode: 'text',  canFinalize: bool }
//   { mode: 'image', phase: 'ask_followup' | 'finalize', imageContext: string }

const MIN_TEXT_FOLLOWUPS = 2;

function detectConversationState(sessionMessages, currentMessage) {
  // Check saved history for an image message (has imageAnalysisSummary field)
  const savedImageMsg = sessionMessages.find(
    m => m.role === 'user' && m.imageAnalysisSummary
  );

  // Also check if the current (unsaved) message carries image analysis inline
  const currentHasImage = typeof currentMessage === 'string' &&
    currentMessage.includes('[Image Analysis:');

  if (!savedImageMsg && !currentHasImage) {
    // ── TEXT FLOW ─────────────────────────────────────────────────────────
    const followUpsDone = sessionMessages.filter(
      m => m.role === 'assistant' && !m.advisory
    ).length;
    return { mode: 'text', canFinalize: followUpsDone >= MIN_TEXT_FOLLOWUPS };
  }

  // ── IMAGE FLOW ────────────────────────────────────────────────────────────
  // Prefer the stored summary; fall back to extracting from current message
  const imageContext = savedImageMsg?.imageAnalysisSummary ?? currentMessage;

  if (currentHasImage && !savedImageMsg) {
    // Very first turn — image just arrived, not yet in DB
    return { mode: 'image', phase: 'ask_followup', imageContext };
  }

  // Image was sent in a previous turn. Count assistant follow-ups after it.
  const imageIndex = sessionMessages.findIndex(
    m => m.role === 'user' && m.imageAnalysisSummary
  );
  const assistantFollowUpsAfterImage = sessionMessages
    .slice(imageIndex + 1)
    .filter(m => m.role === 'assistant' && !m.advisory)
    .length;

  if (assistantFollowUpsAfterImage >= 1) {
    return { mode: 'image', phase: 'finalize', imageContext };
  }

  return { mode: 'image', phase: 'ask_followup', imageContext };
}

// ── System prompt builder ─────────────────────────────────────────────────────
function buildSystemPrompt(state) {
  const base = `You are AgroBot, an expert agricultural advisory AI for Bangladeshi farmers.
Your goal is to diagnose crop problems and provide practical, actionable advice.

## General Rules:
- Be concise and practical
- Use simple language suitable for farmers
- Always respond in English by default
- Only respond in Bangla if the user writes in Bangla first`;

  if (state.mode === 'text' && !state.canFinalize) {
    const roundsDone = state.followUpsDone ?? 0;
    const remaining = MIN_TEXT_FOLLOWUPS - roundsDone;
    return `${base}

## YOUR TASK: ASK FOLLOW-UP QUESTIONS (${remaining} round(s) remaining)
You do NOT have enough information yet. Ask 2-3 specific questions to gather:
- Crop type
- Specific symptoms (color, shape, location on plant)
- How long ago it started
- Location/district in Bangladesh
- Irrigation method
- Whether it is spreading

DO NOT diagnose yet. DO NOT call any tools yet.`;
  }

  if (state.mode === 'image' && state.phase === 'ask_followup') {
    return `${base}

## YOUR TASK: IMAGE RECEIVED — ASK FOLLOW-UP QUESTIONS
The farmer has uploaded a crop photo. The image has already been analyzed by our vision system.
Here is what was detected from the image:

${state.imageContext}

Acknowledge what you can see in the image (crop, symptoms, likely condition).
Then ask 2-3 targeted follow-up questions to complete the diagnosis:
- Their location/district in Bangladesh (for weather context)
- How long these symptoms have been present
- Whether the problem is spreading to other plants
- Irrigation method (if relevant)

DO NOT give a final diagnosis yet. DO NOT call any tools yet.
Be warm and reassuring — the farmer is worried about their crop.`;
  }

  // Finalize (both text and image flows)
  return `${base}

## YOUR TASK: DIAGNOSE AND USE TOOLS — GIVE FINAL ANSWER
You now have enough information. Follow these steps:
1. Call search_crop_diseases with the crop name and symptoms
2. Call get_weather if the farmer mentioned their location/district
3. Call check_escalation after identifying the disease
4. Give a complete final diagnosis

## Final response format:
- **Disease:** name
- **Confidence:** High/Medium/Low
- **Cause:** fungal/bacterial/viral/pest
- **Recommended Actions:** numbered list
- **Prevention Tips:** numbered list
- **Weather Impact:** (if weather data available)
- **Bangladesh Context:** local relevance
- ⚠ Escalation warning if needed

## When crop is NOT in the database (search_crop_diseases returns found: false):
- Tell the farmer: "This crop is not in our verified database yet"
- Show the list of supported crops from the tool result
- Use your own agricultural knowledge to give general advice
- Structure it like a normal final response but label it **Disease (General Knowledge):**
- Confidence: Low, always add escalation warning
- Still call check_escalation and get_weather`;
}

// ── Main agentic loop ─────────────────────────────────────────────────────────
export const advisoryAgent = {
  async processMessage(userMessage, session) {
    console.log('\n=== AGENTIC PROCESSING ===');
    console.log('User message (first 120 chars):', userMessage.substring(0, 120));

    const state = detectConversationState(session.messages, userMessage);
    const canFinalize = state.mode === 'text'
      ? state.canFinalize
      : state.phase === 'finalize';

    console.log(`  State: mode=${state.mode}${state.phase ? ` phase=${state.phase}` : ` canFinalize=${state.canFinalize}`}`);

    const systemPrompt = buildSystemPrompt(state);

    const messages = [
      { role: 'system', content: systemPrompt },
      // Last 10 saved messages for context.
      // For user messages that had an image, use imageAnalysisSummary as content
      // so the agent sees the full analysis context, not just the display text.
      ...session.messages.slice(-10).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: (msg.role === 'user' && msg.imageAnalysisSummary)
          ? msg.imageAnalysisSummary
          : msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    let toolCallCount = 0;
    const MAX_TOOL_CALLS = 10;

    while (toolCallCount < MAX_TOOL_CALLS) {
      console.log(`\n→ Agent loop iteration ${toolCallCount + 1}`);

      const response = await getOpenAI().chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages,
        tools: canFinalize ? TOOL_DEFINITIONS : undefined,
        tool_choice: canFinalize ? 'auto' : undefined,
        temperature: 0.4,
        max_tokens: 1500
      });

      const message = response.choices[0].message;
      const finishReason = response.choices[0].finish_reason;
      console.log(`  Finish reason: ${finishReason}`);

      messages.push(message);

      // ── Tool calls ────────────────────────────────────────────────────────
      if (finishReason === 'tool_calls' && message.tool_calls?.length > 0) {
        console.log(`  → Agent requested ${message.tool_calls.length} tool(s)`);
        const toolResults = await Promise.all(
          message.tool_calls.map(async (toolCall) => {
            const args = JSON.parse(toolCall.function.arguments);
            const result = await executeTool(toolCall.function.name, args);
            return { role: 'tool', tool_call_id: toolCall.id, content: result };
          })
        );
        messages.push(...toolResults);
        toolCallCount += message.tool_calls.length;
        continue;
      }

      // ── Final text response ───────────────────────────────────────────────
      if (finishReason === 'stop' && message.content) {
        const isFinalAnswer = canFinalize && toolCallCount > 0;
        console.log(`  ✓ Agent finished — ${isFinalAnswer ? 'FINAL ANSWER' : 'FOLLOW-UP QUESTION'} (${toolCallCount} tool calls)`);
        console.log('=== END AGENTIC PROCESSING ===\n');

        const advisory = isFinalAnswer
          ? this.parseAdvisoryFromResponse(message.content)
          : null;

        return { content: message.content, advisory };
      }

      console.warn(`  ⚠ Unexpected finish reason: ${finishReason}`);
      break;
    }

    console.warn('⚠ Max tool calls reached');
    const lastMessage = messages[messages.length - 1];
    return {
      content: lastMessage.content || 'I was unable to process your request. Please try again.',
      advisory: null
    };
  },

  // ── Parse structured advisory data from the text response ─────────────────
  parseAdvisoryFromResponse(content) {
    if (!content) return null;

    const lower = content.toLowerCase();

    const isGeneralKnowledge = lower.includes('not in our verified database') ||
      lower.includes('general knowledge') ||
      lower.includes('general agricultural knowledge');

    const diseaseMatch =
      content.match(/\*\*?(?:disease(?:\s*\(general knowledge\))?)[:\s]+([^\n*]+)\*\*?/i) ||
      content.match(/\*\*?([A-Z][^*\n]+(?:disease|blight|rot|wilt|rust|smut|borer|virus|mildew|spot|blast|burn)[^*\n]*)\*\*?/i) ||
      content.match(/(?:disease|diagnosis|identified)[:\s]+\*?\*?([^\n*]+)/i);

    const confidenceMatch = content.match(/confidence[:\s]+\*?\*?(High|Medium|Low)\*?\*?/i);
    const causeMatch = content.match(/cause[:\s]+\*?\*?(fungal|bacterial|viral|pest)\*?\*?/i);

    const escalate =
      lower.includes('consult an agronomist') ||
      lower.includes('consult a local agronomist') ||
      lower.includes('professional') ||
      lower.includes('⚠');

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
