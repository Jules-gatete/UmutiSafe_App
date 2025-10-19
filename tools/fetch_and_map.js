import fs from 'fs';
import path from 'path';
import axios from 'axios';

const MODEL_API_URL = process.env.VITE_MODEL_API_URL || 'http://localhost:8000';

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

async function postText() {
  const payload = {
    genericName: 'Paracetamol',
    brandName: 'Panadol',
    dosageForm: 'Tablet',
    packagingType: 'Box'
  };
  try {
    console.log('Posting to', `${MODEL_API_URL}/api/predict/text`);
    const resp = await axios.post(`${MODEL_API_URL}/api/predict/text`, payload, { timeout: 20000 });
    const raw = resp.data;
    fs.writeFileSync(path.join('tools', 'text_raw.json'), JSON.stringify(raw, null, 2));
    const mapped = mapFastApiResponse(raw);
    fs.writeFileSync(path.join('tools', 'text_mapped.json'), JSON.stringify(mapped, null, 2));
    console.log('Text response saved to tools/text_raw.json and tools/text_mapped.json');
  } catch (err) {
    console.error('Text request failed:', err.message || err);
    if (err.response) {
      try { fs.writeFileSync(path.join('tools','text_raw_error.json'), JSON.stringify(err.response.data, null,2)); } catch(e){}
    }
  }
}

async function postImage() {
  const samplePath = path.join('tools', 'sample.jpg');
  if (!fs.existsSync(samplePath)) {
    console.log('No tools/sample.jpg found — skipping image POST. Place a sample image at tools/sample.jpg to test.');
    return;
  }

  // Try different FormData implementations
  let FormDataImpl = global.FormData;
  let form;
  let headers = {};
  try {
    if (!FormDataImpl) {
      // try to require 'form-data'
      // eslint-disable-next-line no-eval
      const FormDataPackage = await import('form-data');
      FormDataImpl = FormDataPackage.default;
    }
  } catch (e) {
    // ignore — we'll try to use axios with stream and form-data package not available
  }

  try {
    if (FormDataImpl && FormDataImpl.prototype && typeof FormDataImpl.prototype.append === 'function') {
      form = new FormDataImpl();
      // form-data package expects stream
      const stream = fs.createReadStream(samplePath);
      form.append('file', stream);
      if (typeof form.getHeaders === 'function') headers = form.getHeaders();

      console.log('Posting image to', `${MODEL_API_URL}/api/predict/image`);
      const resp = await axios.post(`${MODEL_API_URL}/api/predict/image`, form, { headers, maxBodyLength: Infinity, timeout: 60000 });
      const raw = resp.data;
      fs.writeFileSync(path.join('tools', 'image_raw.json'), JSON.stringify(raw, null, 2));
      const mapped = mapFastApiResponse(raw);
      fs.writeFileSync(path.join('tools', 'image_mapped.json'), JSON.stringify(mapped, null, 2));
      console.log('Image response saved to tools/image_raw.json and tools/image_mapped.json');
    } else {
      console.log('No compatible FormData implementation found in Node. Skipping image upload.');
    }
  } catch (err) {
    console.error('Image request failed:', err.message || err);
    if (err.response) {
      try { fs.writeFileSync(path.join('tools','image_raw_error.json'), JSON.stringify(err.response.data, null,2)); } catch(e){}
    }
  }
}

(async () => {
  await postText();
  await postImage();
})();
