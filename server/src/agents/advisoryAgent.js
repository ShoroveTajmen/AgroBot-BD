import { OpenAI } from 'openai';
import { cropKnowledgeTool } from '../tools/cropKnowledgeTool.js';
import { weatherTool } from '../tools/weatherTool.js';
import { escalationTool } from '../tools/escalationTool.js';
import { getSystemPrompt, getFollowUpPrompt } from '../prompts/systemPrompts.js';

let openai = null;

const getOpenAI = () => {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openai;
};

export const advisoryAgent = {
  async processMessage(userMessage, session) {
    try {
      // Build conversation history
      const conversationHistory = session.messages
        .map(msg => `${msg.role === 'user' ? 'Farmer' : 'AgroBot'}: ${msg.content}`)
        .join('\n\n');

      // Check if we need follow-up questions
      const needsFollowUp = await this.checkNeedsFollowUp(userMessage, conversationHistory);
      
      if (needsFollowUp) {
        const followUpQuestions = await this.getFollowUpQuestions(userMessage, conversationHistory);
        return {
          content: followUpQuestions,
          advisory: null
        };
      }

      // Extract context from conversation
      const context = this.extractContext(conversationHistory);

      // Use tools if we have enough context
      const toolResults = await this.runTools(context);

      // Generate advisory
      const advisory = await this.generateAdvisory(userMessage, context, toolResults);

      // Format response
      const response = this.formatAdvisory(advisory);

      return {
        content: response,
        advisory: advisory
      };
    } catch (error) {
      console.error('Agent error:', error);
      throw error;
    }
  },

  async checkNeedsFollowUp(userMessage, conversationHistory) {
    try {
      const prompt = getFollowUpPrompt(userMessage, conversationHistory);
      
      const response = await getOpenAI().chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an agricultural assistant. Determine if you need more information from the farmer.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 100
      });

      const answer = response.choices[0].message.content.toLowerCase();
      return answer.includes('yes') || answer.includes('need more');
    } catch (error) {
      console.error('Follow-up check error:', error);
      return false;
    }
  },

  async getFollowUpQuestions(userMessage, conversationHistory) {
    try {
      const prompt = `Based on this conversation:\n\n${conversationHistory}\n\nUser said: "${userMessage}"\n\nWhat follow-up questions would help you provide better advice? Ask 2-3 specific questions.`;
      
      const response = await getOpenAI().chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an agricultural assistant. Ask clear, simple questions to understand the farmer\'s problem better.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 200
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Follow-up questions error:', error);
      return 'Could you tell me more about the affected crop and the symptoms you\'re seeing?';
    }
  },

  extractContext(conversationHistory) {
    const context = {
      symptoms: [],
      crop: null,
      location: null,
      season: null,
      irrigation: null,
      duration: null
    };

    // Simple keyword extraction (could be enhanced with NLP)
    const lines = conversationHistory.toLowerCase().split('\n');
    
    for (const line of lines) {
      if (line.includes('rice') || line.includes('wheat') || line.includes('maize') || 
          line.includes('potato') || line.includes('tomato') || line.includes('brinjal') ||
          line.includes('chili') || line.includes('onion') || line.includes('cucumber') ||
          line.includes('jute') || line.includes('mustard') || line.includes('banana') ||
          line.includes('mango')) {
        context.crop = line.match(/(rice|wheat|maize|potato|tomato|brinjal|chili|onion|cucumber|jute|mustard|banana|mango)/)?.[0] || null;
      }
      
      if (line.includes('dhaka') || line.includes('chittagong') || line.includes('rajshahi') ||
          line.includes('khulna') || line.includes('barisal') || line.includes('sylhet') ||
          line.includes('rangpur') || line.includes('mymensingh')) {
        context.location = line.match(/(dhaka|chittagong|rajshahi|khulna|barisal|sylhet|rangpur|mymensingh)/)?.[0] || null;
      }
      
      if (line.includes('brown') || line.includes('yellow') || line.includes('spots') ||
          line.includes('lesions') || line.includes('wilt') || line.includes('rot') ||
          line.includes('curl') || line.includes('stunted') || line.includes('holes')) {
        context.symptoms.push(line);
      }
    }

    return context;
  },

  async runTools(context) {
    const results = {};

    // Run crop knowledge tool if we have crop and symptoms
    if (context.crop && context.symptoms.length > 0) {
      try {
        results.cropKnowledge = cropKnowledgeTool.searchDiseases(context.crop, context.symptoms);
      } catch (error) {
        console.error('Crop knowledge tool error:', error);
      }
    }

    // Run weather tool if we have location
    if (context.location) {
      try {
        results.weather = await weatherTool.getWeather(context.location);
      } catch (error) {
        console.error('Weather tool error:', error);
      }
    }

    return results;
  },

  async generateAdvisory(userMessage, context, toolResults) {
    try {
      const prompt = getSystemPrompt(userMessage, context, toolResults);
      
      const response = await getOpenAI().chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an agricultural advisory AI. Provide clear, practical advice for Bangladeshi farmers.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      });

      const advisory = JSON.parse(response.choices[0].message.content);
      
      // Add escalation check
      if (toolResults.cropKnowledge) {
        advisory.escalateToAgronomist = escalationTool.shouldEscalate(advisory);
      }
      
      return advisory;
    } catch (error) {
      console.error('Advisory generation error:', error);
      throw error;
    }
  },

  formatAdvisory(advisory) {
    let response = '';

    if (advisory.likelyDisease) {
      response += `*${advisory.likelyDisease}*\n\n`;
      response += `**Confidence:** ${advisory.confidence || 'Medium'}\n\n`;
      response += `**Cause:** ${advisory.causeType || 'Unknown'}\n\n`;
    }

    if (advisory.recommendedActions && advisory.recommendedActions.length > 0) {
      response += '**Recommended Actions:**\n';
      advisory.recommendedActions.forEach((action, index) => {
        response += `${index + 1}. ${action}\n`;
      });
      response += '\n';
    }

    if (advisory.preventionTips && advisory.preventionTips.length > 0) {
      response += '**Prevention Tips:**\n';
      advisory.preventionTips.forEach((tip, index) => {
        response += `${index + 1}. ${tip}\n`;
      });
      response += '\n';
    }

    if (advisory.weatherImpact) {
      response += `**Weather Impact:** ${advisory.weatherImpact}\n\n`;
    }

    if (advisory.escalateToAgronomist) {
      response += '⚠️ *This case requires professional attention. Please consult an agronomist or agricultural extension officer as soon as possible.*\n\n';
    }

    if (advisory.bangladeshContext) {
      response += `**In Bangladesh context:** ${advisory.bangladeshContext}\n`;
    }

    return response.trim();
  }
};
