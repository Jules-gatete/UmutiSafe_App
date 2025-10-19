import fs from 'fs';

if (process.argv.length < 3) {
  console.error('Usage: node map_fastapi_response.js <response.json>');
  process.exit(1);
}

const file = process.argv[2];
let raw;
try {
  raw = fs.readFileSync(file, 'utf8');
} catch (err) {
  console.error('Failed to read file', file, err.message);
  process.exit(2);
}

let f;
try {
  f = JSON.parse(raw);
} catch (err) {
  console.error('Failed to parse JSON', err.message);
  process.exit(3);
}

function mapFastApiResponse(f) {
  return {
    success: !!f.success,
    ocr_text: {
      medicine_name: f.ocr_info?.extracted_info?.generic_name || f.medicine_info?.generic_name || '',
      brand_name: f.ocr_info?.extracted_info?.brand_name || f.medicine_info?.brand_name || ''
    },
    predicted_category: f.predictions?.disposal_category || f.safety_guidance?.category_name || '',
    risk_level: f.predictions?.risk_level || f.safety_guidance?.risk_level || '',
    confidence: typeof f.predictions?.confidence === 'number' ? f.predictions.confidence : (f.predictions?.all_probabilities?.['1'] || 0),
    disposal_guidance: f.safety_guidance?.procedure || f.safety_guidance?.prohibitions || '',
    safety_notes: f.safety_guidance?.special_instructions || f.safety_guidance?.risks || ''
  };
}

const mapped = mapFastApiResponse(f);

console.log(JSON.stringify({ raw: f, mapped }, null, 2));
