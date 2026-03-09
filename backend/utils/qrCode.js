const QRCode = require('qrcode');

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:5174';

/**
 * Generate a QR code data URI for an asset.
 * The QR value encodes the assetId so the scanner page can look it up.
 *
 * @param {string} assetId
 * @returns {Promise<string>} Base64 PNG data URI
 */
async function generateAssetQR(assetId) {
    const payload = JSON.stringify({ assetId, ts: Date.now() });
    return await QRCode.toDataURL(payload, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 256,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
    });
}

/**
 * Generate a plain text QR code (for print labels, etc.).
 */
async function generateTextQR(text) {
    return await QRCode.toDataURL(text, { width: 256, errorCorrectionLevel: 'M' });
}

module.exports = { generateAssetQR, generateTextQR };
