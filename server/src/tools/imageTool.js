/**
 * imageTool.js — Crop Image Analysis Tool (GPT-4o Vision)
 *
 * Analyzes a base64-encoded crop photo using OpenAI's GPT-4o-mini vision model.
 * Returns a structured JSON object describing the crop, visible symptoms,
 * likely disease/condition, and severity.
 *
 * This tool is called directly by chatController (not via OpenAI function calling)
 * because image analysis always happens before the advisory agent runs.
 * The analysis result is appended to the user's message text so the agent
 * has full context from both the image and any text the farmer typed.
 */

import { OpenAI } from 'openai';

// Lazy-initialise the OpenAI client so it is only created when first needed
// (avoids issues if OPENAI_API_KEY is not set at import time)
let openai = null;
const getOpenAI = () => {
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
};

export const imageTool = {

  /**
   * analyzeCropImage — Send a crop photo to GPT-4o Vision for disease analysis.
   *
   * Uses `detail: 'low'` to reduce token usage while maintaining sufficient
   * accuracy for crop disease detection.
   *
   * @param {string} base64Image - Base64-encoded image string (without data URL prefix)
   * @param {string} mimeType    - MIME type of the image (default: 'image/jpeg')
   * @returns {object} Analysis result:
   *   {
   *     cropDetected:      string | null,   // crop type identified in the image
   *     symptomsObserved:  string[],        // list of visible symptoms
   *     likelyCondition:   string,          // most likely disease/pest/deficiency
   *     severity:          string,          // 'mild' | 'moderate' | 'severe'
   *     confidence:        string,          // 'High' | 'Medium' | 'Low'
   *     visualDescription: string,          // brief description of what was seen
   *     recommendSearch:   boolean          // whether to search the crop disease DB
   *   }
   */
  async analyzeCropImage(base64Image, mimeType = 'image/jpeg') {
    console.log('  → Image Tool: Analyzing crop image with GPT-4o-mini vision');

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: 'low' // saves tokens, still accurate for disease detection
              }
            },
            {
              type: 'text',
              text: `You are an expert agricultural plant pathologist analyzing a crop photo from a Bangladeshi farmer.

Carefully examine this image and identify:
1. The crop type (if visible)
2. All visible symptoms (spots, discoloration, wilting, holes, lesions, etc.)
3. The likely disease, pest, or deficiency
4. Severity (mild/moderate/severe)

Respond in this exact JSON format:
{
  "cropDetected": "crop name or null if unclear",
  "symptomsObserved": ["symptom 1", "symptom 2"],
  "likelyCondition": "disease/pest/deficiency name",
  "severity": "mild/moderate/severe",
  "confidence": "High/Medium/Low",
  "visualDescription": "brief description of what you see",
  "recommendSearch": true
}`
            }
          ]
        }
      ],
      max_tokens: 500,
      response_format: { type: 'json_object' } // enforce structured JSON output
    });

    const result = JSON.parse(response.choices[0].message.content);
    console.log(`    ✓ Image analysis: ${result.likelyCondition} (${result.confidence} confidence)`);
    return result;
  }
};
