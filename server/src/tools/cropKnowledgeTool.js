/**
 * cropKnowledgeTool.js — Crop Disease Knowledge Base Search Tool
 *
 * Searches the local crop_diseases.json database to find diseases that match
 * a given crop name and list of symptoms. Uses a simple scoring algorithm:
 *   - Exact symptom match  → +2 points
 *   - Partial word match   → +1 point (for words longer than 3 characters)
 *
 * Returns the top 5 diseases sorted by match score.
 * If the crop is not in the database, returns a "not found" response with
 * the list of supported crops so the agent can inform the farmer.
 *
 * Supported crops: Rice, Wheat, Maize, Potato, Tomato, Brinjal, Chili,
 *                  Onion, Cucumber, Jute, Mustard, Banana, Mango
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname in ES module context (not available natively in ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the disease dataset once at startup — synchronous read is fine here
// because it happens before the server starts accepting requests
const cropDiseasesPath = path.join(__dirname, '../../crop_diseases.json');
let cropDiseases = [];

try {
  const data = fs.readFileSync(cropDiseasesPath, 'utf8');
  cropDiseases = JSON.parse(data);
  console.log(`✓ Crop Knowledge Tool: Loaded ${cropDiseases.length} crop diseases from dataset`);
} catch (error) {
  console.error('✗ Error loading crop diseases dataset:', error);
  cropDiseases = []; // graceful fallback — tool will return "not found" for all queries
}

export const cropKnowledgeTool = {

  /**
   * searchDiseases — Find diseases matching a crop and symptom list.
   *
   * Scoring algorithm:
   *  - For each known disease symptom, check if it appears in the farmer's symptom text
   *  - Exact phrase match: +2 points
   *  - Individual word match (>3 chars): +1 point (catches partial descriptions)
   *  - Diseases with score 0 are excluded from results
   *
   * @param {string}   cropName - Name of the crop (e.g. "rice", "tomato")
   * @param {string[]} symptoms - List of symptoms described by the farmer
   * @returns {object} Search result:
   *   Found:     { crop, symptoms, diseases: [...top5], totalMatches }
   *   Not found: { found: false, message, diseases: [], totalMatches: 0, supportedCrops }
   */
  searchDiseases(cropName, symptoms) {
    console.log(`  → Crop Knowledge Tool: Searching for "${cropName}" with symptoms: ${symptoms.join(', ')}`);

    // Normalise crop name for case-insensitive matching
    const normalizedCrop = cropName.toLowerCase().trim();

    // Filter the dataset to only diseases for this crop
    const relevantDiseases = cropDiseases.filter(disease =>
      disease.cropName.toLowerCase() === normalizedCrop
    );

    // Crop not in database — return a helpful "not found" response
    if (relevantDiseases.length === 0) {
      console.log(`    ✗ No disease data found for ${cropName}`);
      return {
        found: false,
        message: `"${cropName}" is not in our crop disease database. Our database currently covers: Rice, Wheat, Maize, Potato, Tomato, Brinjal, Chili, Onion, Cucumber, Jute, Mustard, Banana, Mango.`,
        diseases: [],
        totalMatches: 0,
        supportedCrops: ['Rice', 'Wheat', 'Maize', 'Potato', 'Tomato', 'Brinjal', 'Chili', 'Onion', 'Cucumber', 'Jute', 'Mustard', 'Banana', 'Mango']
      };
    }

    console.log(`    ✓ Found ${relevantDiseases.length} diseases for ${cropName}`);

    // Score each disease by how well its symptoms match the farmer's description
    const scoredDiseases = relevantDiseases.map(disease => {
      let score = 0;
      const symptomText = symptoms.join(' ').toLowerCase();

      disease.symptoms.forEach(symptom => {
        // Exact phrase match — higher weight
        if (symptomText.includes(symptom.toLowerCase())) {
          score += 2;
        }

        // Partial word match — catches cases where farmer uses different phrasing
        const symptomWords = symptom.toLowerCase().split(' ');
        symptomWords.forEach(word => {
          if (symptomText.includes(word) && word.length > 3) {
            score += 1;
          }
        });
      });

      return { ...disease, matchScore: score };
    });

    // Sort by score descending and return top 5 with at least one match
    scoredDiseases.sort((a, b) => b.matchScore - a.matchScore);
    const topMatches = scoredDiseases.slice(0, 5).filter(d => d.matchScore > 0);

    console.log(`    ✓ Top matches: ${topMatches.map(d => `${d.diseaseName} (${d.matchScore})`).join(', ')}`);

    return {
      crop: cropName,
      symptoms: symptoms,
      diseases: topMatches,
      totalMatches: topMatches.length
    };
  }
};
