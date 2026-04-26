import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load crop diseases dataset - use the correct path relative to server root
const cropDiseasesPath = path.join(__dirname, '../../crop_diseases.json');
let cropDiseases = [];

try {
  const data = fs.readFileSync(cropDiseasesPath, 'utf8');
  cropDiseases = JSON.parse(data);
} catch (error) {
  console.error('Error loading crop diseases dataset:', error);
  cropDiseases = [];
}

export const cropKnowledgeTool = {
  searchDiseases(cropName, symptoms) {
    // Normalize crop name
    const normalizedCrop = cropName.toLowerCase().trim();
    
    // Find diseases for this crop
    const relevantDiseases = cropDiseases.filter(disease => 
      disease.cropName.toLowerCase() === normalizedCrop
    );

    if (relevantDiseases.length === 0) {
      return {
        message: `No disease data found for ${cropName}`,
        diseases: []
      };
    }

    // Score diseases based on symptom matching
    const scoredDiseases = relevantDiseases.map(disease => {
      let score = 0;
      const symptomText = symptoms.join(' ').toLowerCase();
      
      // Check symptom matches
      disease.symptoms.forEach(symptom => {
        if (symptomText.includes(symptom.toLowerCase())) {
          score += 2;
        }
      });
      
      // Add partial matches
      disease.symptoms.forEach(symptom => {
        const symptomWords = symptom.toLowerCase().split(' ');
        symptomWords.forEach(word => {
          if (symptomText.includes(word) && word.length > 3) {
            score += 1;
          }
        });
      });
      
      return {
        ...disease,
        matchScore: score
      };
    });

    // Sort by score and return top matches
    scoredDiseases.sort((a, b) => b.matchScore - a.matchScore);
    
    const topMatches = scoredDiseases.slice(0, 5).filter(d => d.matchScore > 0);

    return {
      crop: cropName,
      symptoms: symptoms,
      diseases: topMatches,
      totalMatches: topMatches.length
    };
  }
};
