import { OpenAI } from 'openai';

let openai = null;
const getOpenAI = () => {
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
};

export const imageTool = {
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
                detail: 'low'  // saves tokens, still accurate for disease detection
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
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content);
    console.log(`    ✓ Image analysis: ${result.likelyCondition} (${result.confidence} confidence)`);
    return result;
  }
};
