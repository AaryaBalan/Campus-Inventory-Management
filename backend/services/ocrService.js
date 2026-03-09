/**
 * ocrService.js
 *
 * Two-step pipeline:
 *   1. extractText()  — Tesseract.js for images, pdf-parse for PDFs
 *   2. parseWithAI()  — OpenAI GPT structures the raw text into clean JSON
 */

const path = require('path');
const fs = require('fs');
const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');
const OpenAI = require('openai');
const logger = require('../utils/logger');

// Lazy client pointing at OpenRouter — drop-in compatible with the OpenAI SDK.
// Free models are available at openrouter.ai/keys (no card required).
let _openai = null;
function getOpenAI() {
    if (!_openai) {
        _openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || 'missing',
            baseURL: 'https://openrouter.ai/api/v1',
            defaultHeaders: {
                'HTTP-Referer': 'https://citil.campus.local',  // any URL is fine
                'X-Title': 'CITIL Bill Extractor',
            },
        });
    }
    return _openai;
}

// Supported MIME types
const IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff']);
const PDF_MIMES = new Set(['application/pdf']);

/**
 * Extract raw text from an uploaded file.
 * @param {string} filePath — absolute path to the temp file
 * @param {string} mimeType — e.g. 'image/png' or 'application/pdf'
 * @returns {Promise<string>}  raw OCR/extracted text
 */
async function extractText(filePath, mimeType) {
    if (IMAGE_MIMES.has(mimeType)) {
        logger.info(`[OCR] Running Tesseract on ${path.basename(filePath)}`);
        const { data: { text } } = await Tesseract.recognize(filePath, 'eng', {
            logger: () => { }, // suppress progress noise
        });
        return text.trim();
    }

    if (PDF_MIMES.has(mimeType)) {
        logger.info(`[OCR] Parsing PDF: ${path.basename(filePath)}`);
        const buffer = fs.readFileSync(filePath);
        const data = await pdfParse(buffer);
        return data.text.trim();
    }

    throw Object.assign(new Error('Unsupported file type. Upload a JPEG, PNG, WEBP, or PDF.'), { statusCode: 400 });
}

/**
 * Send raw OCR text to OpenAI and get structured bill data back.
 * All missing fields are returned as null — never throws on partial data.
 *
 * @param {string} rawText
 * @returns {Promise<object>}  structured bill JSON
 */
// Free models tried in order — if one is overloaded (429), the next is used.
const FREE_MODELS = [
    'arcee-ai/trinity-mini:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'google/gemini-2.0-flash-exp:free',
    'mistralai/mistral-small-3.1-24b-instruct:free',
    'qwen/qwen2.5-72b-instruct:free',
];

async function parseWithAI(rawText) {
    if (!process.env.OPENAI_API_KEY) {
        logger.warn('[OCR] OPENAI_API_KEY not set — returning raw text only, no AI parsing');
        return buildFallback(rawText);
    }

    const systemPrompt = `You are a bill/receipt data extraction assistant. Given raw OCR text from a bill or receipt, extract structured information and return ONLY valid JSON — no explanation, no markdown, no code fences.

The JSON must follow this exact schema:
{
  "vendor": string | null,
  "date": string | null,
  "items": [
    {
      "name": string,
      "quantity": number | null,
      "unitPrice": number | null,
      "totalAmount": number | null
    }
  ],
  "tax": number | null,
  "grandTotal": number | null,
  "warrantyInfo": string | null
}

Rules:
- If a field cannot be determined, use null.
- Monetary values must be numbers (not strings), no currency symbols.
- The items array can be empty [] if no line items are found.
- For date, convert to YYYY-MM-DD if possible.`;

    let lastErr;
    for (const model of FREE_MODELS) {
        try {
            logger.info(`[OCR] Trying model: ${model}`);
            const completion = await getOpenAI().chat.completions.create({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Extract bill data from this text:\n\n${rawText.slice(0, 8000)}` },
                ],
                temperature: 0,
                max_tokens: 1500,
            });

            const raw = completion.choices[0]?.message?.content || '{}';
            // Strip markdown fences if the model wrapped the JSON
            const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
            const parsed = JSON.parse(cleaned);

            return {
                vendor: parsed.vendor ?? null,
                date: parsed.date ?? null,
                items: Array.isArray(parsed.items) ? parsed.items.map(normaliseItem) : [],
                tax: typeof parsed.tax === 'number' ? parsed.tax : null,
                grandTotal: typeof parsed.grandTotal === 'number' ? parsed.grandTotal : null,
                warrantyInfo: parsed.warrantyInfo ?? null,
            };
        } catch (err) {
            lastErr = err;
            const is429 = err.status === 429 || (err.message || '').includes('429');
            logger.warn(`[OCR] Model ${model} failed${is429 ? ' (overloaded, trying next)' : ''}: ${err.message}`);
            if (!is429) break; // auth/key errors won't be fixed by switching models
        }
    }

    logger.error(`[OCR] All models failed. Last error: ${lastErr?.message}`);
    return buildFallback(rawText);
}


function normaliseItem(item) {
    return {
        name: item.name || item.description || item.item || 'Unknown item',
        quantity: typeof item.quantity === 'number' ? item.quantity : null,
        unitPrice: typeof item.unitPrice === 'number' ? item.unitPrice
            : typeof item.unit_price === 'number' ? item.unit_price
                : typeof item.price === 'number' ? item.price : null,
        totalAmount: typeof item.totalAmount === 'number' ? item.totalAmount
            : typeof item.total === 'number' ? item.total
                : typeof item.amount === 'number' ? item.amount : null,
    };
}

function buildFallback(rawText) {
    return {
        vendor: null,
        date: null,
        items: [],
        tax: null,
        grandTotal: null,
        warrantyInfo: null,
        _note: 'AI parsing unavailable — review raw text manually.',
    };
}

module.exports = { extractText, parseWithAI };
