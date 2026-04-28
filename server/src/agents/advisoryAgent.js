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

// ── Minimum follow-up rounds required before final answer ────────────────────
const MIN_FOLLOWUP_ROUNDS = 2;

// ── Count how many follow-up rounds already happened in session ───────────────
// A "round" = one assistant question + one farmer reply
function countFollowUpRounds(sessionMessages) {
  // sessionMessages are the SAVED messages (before current user message)
  // Each assistant message that has NO advisory = a follow-up question round
  let rounds = 0;
  for (const msg of sessionMessages) {
    if ((msg.role === 'assistant') && !msg.advisory) {
      rounds++;
    }
  }
  return rounds;
}

// ── Build system prompt dynamically based on follow-up progress ───────────────
function buildSystemPrompt(followUpRoundsDone) {
  const roundsRemaining = Math.max(0, MIN_FOLLOWUP_ROUNDS - followUpRoundsDone);
  const canGiveFinalAnswer = followUpRoundsDone >= MIN_FOLLOWUP_ROUNDS;

  return `You are AgroBot, an expert agricultural advisory AI for Bangladeshi farmers.
Your goal is to diagnose crop problems and provide practical, actionable advice.

## Follow-up Status:
- Follow-up rounds completed: ${followUpRoundsDone}
- Minimum required: ${MIN_FOLLOWUP_ROUNDS}
- Rounds still needed: ${roundsRemaining}
- Can give final answer now: ${canGiveFinalAnswer}

## STRICT RULES:

${!canGiveFinalAnswer ? `
### ⚠ YOU MUST ASK FOLLOW-UP QUESTIONS — DO NOT GIVE A FINAL ANSWER YET
You still need ${roundsRemaining} more follow-up round(s) before diagnosing.
- Ask 2-3 specific questions to gather more information
- Do NOT call any tools yet
- Do NOT give a diagnosis yet
- Focus on gathering: crop type, symptoms, location, duration, irrigation method

` : `
### ✅ YOU HAVE ENOUGH FOLLOW-UP — NOW DIAGNOSE AND USE TOOLS
You have completed the required follow-up rounds. Now:
1. Call search_crop_diseases if crop + symptoms are known
2. Call get_weather if location is mentioned
3. Call check_escalation after identifying the disease
4. Give a complete final diagnosis

`}

## What to ask in follow-up (if still needed):
- Round 1: Ask about crop type, specific symptoms, and how long ago it started
- Round 2: Ask about location/district, irrigation method, and whether it is spreading

## Final response format (only when canGiveFinalAnswer is true):
- **Disease:** name
- **Confidence:** High/Medium/Low
- **Cause:** fungal/bacterial/viral/pest
- **Recommended Actions:** numbered list
- **Prevention Tips:** numbered list
- **Weather Impact:** (if weather data available)
- **Bangladesh Context:** local relevance
- ⚠ Escalation warning if needed

## General Rules:
- Be concise and practical
- Use simple language suitable for farmers
- Always respond in English by default
- Only respond in Bangla if the user writes in Bangla first

## When crop is NOT in the database (search_crop_diseases returns found: false):
- Do NOT make up or guess a disease name from the database
- Clearly tell the farmer: "This crop is not in our verified database yet"
- Show the list of supported crops from the tool result
- Then use your own OpenAI agricultural knowledge to give general advice
- Structure your general advice exactly like a normal final response:
  - **Disease (General Knowledge):** best guess based on symptoms
  - **Confidence:** Low (not from verified database)
  - **Cause:** your best assessment
  - **Recommended Actions:** practical steps
  - **Prevention Tips:** general tips
  - ⚠ Always add: "This advice is based on general agricultural knowledge, not our verified crop database. Please consult a local agronomist for confirmation."
- Still call check_escalation after forming your general assessment
- Still call get_weather if location is known (weather is always useful)`;
}

// ── Main agentic agent ────────────────────────────────────────────────────────
export const advisoryAgent = {
  async processMessage(userMessage, session) {
    console.log('\n=== AGENTIC PROCESSING ===');
    console.log('User message:', userMessage);

    // Count how many follow-up rounds already done in this conversation
    const followUpRoundsDone = countFollowUpRounds(session.messages);
    const canGiveFinalAnswer = followUpRoundsDone >= MIN_FOLLOWUP_ROUNDS;

    console.log(`  Follow-up rounds done: ${followUpRoundsDone}/${MIN_FOLLOWUP_ROUNDS} — can finalize: ${canGiveFinalAnswer}`);

    // Build dynamic system prompt based on follow-up progress
    const systemPrompt = buildSystemPrompt(followUpRoundsDone);

    // Build messages array with full conversation history
    const messages = [
      { role: 'system', content: systemPrompt },
      // Include last 10 messages for context
      ...session.messages.slice(-10).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      // Current user message
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
        // Only offer tools once follow-up is complete
        tools: canGiveFinalAnswer ? TOOL_DEFINITIONS : undefined,
        tool_choice: canGiveFinalAnswer ? 'auto' : undefined,
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

        messages.push(...toolResults);
        toolCallCount += message.tool_calls.length;
        continue;
      }

      // ── Agent finished — has a final text response ────────────────────────
      if (finishReason === 'stop' && message.content) {
        const isFinalAnswer = canGiveFinalAnswer && toolCallCount > 0;
        console.log(`  ✓ Agent finished — ${isFinalAnswer ? 'FINAL ANSWER' : 'FOLLOW-UP QUESTION'} (${toolCallCount} tool calls)`);
        console.log('=== END AGENTIC PROCESSING ===\n');

        // Only parse advisory card data for final answers (not follow-up questions)
        const advisory = isFinalAnswer
          ? this.parseAdvisoryFromResponse(message.content)
          : null;

        return {
          content: message.content,
          advisory
        };
      }

      console.warn(`  ⚠ Unexpected finish reason: ${finishReason}`);
      break;
    }

    // Fallback
    console.warn('⚠ Max tool calls reached');
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

    // Detect if this is a general knowledge fallback (crop not in database)
    const isGeneralKnowledge = lower.includes('not in our verified database') ||
      lower.includes('general knowledge') ||
      lower.includes('general agricultural knowledge');

    // Try to extract disease name
    const diseaseMatch = content.match(/\*\*?(?:disease(?:\s*\(general knowledge\))?)[:\s]+([^\n*]+)\*\*?/i)
      || content.match(/\*\*?([A-Z][^*\n]+(?:disease|blight|rot|wilt|rust|smut|borer|virus|mildew|spot|blast|burn)[^*\n]*)\*\*?/i)
      || content.match(/(?:disease|diagnosis|identified)[:\s]+\*?\*?([^\n*]+)/i);

    // Try to extract confidence
    const confidenceMatch = content.match(/confidence[:\s]+\*?\*?(High|Medium|Low)\*?\*?/i);

    // Try to extract cause type
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

    // For general knowledge fallback, always return an advisory with low confidence
    if (isGeneralKnowledge) {
      return {
        likelyDisease: diseaseMatch?.[1]?.trim() || 'Unknown (crop not in database)',
        confidence: 'Low',
        causeType: causeMatch?.[1] || null,
        recommendedActions: actions,
        escalateToAgronomist: true, // always escalate when not from verified data
        isGeneralKnowledge: true
      };
    }

    // Only return advisory object if we found a disease
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
