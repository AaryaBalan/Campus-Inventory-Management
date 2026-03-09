const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');
const dayjs = require('dayjs');

/**
 * Generate a PDF report buffer.
 * @param {object} reportData
 * @param {string} reportData.title
 * @param {string} reportData.dateFrom
 * @param {string} reportData.dateTo
 * @param {object[]} reportData.sections  [{heading, rows: [{label, value}]}]
 * @returns {Promise<Buffer>}
 */
function generatePDF({ title, dateFrom, dateTo, sections }) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];
        doc.on('data', c => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(20).fillColor('#18181b').text('CITIL', { align: 'center' });
        doc.fontSize(14).fillColor('#52525b').text(title, { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(9).fillColor('#71717a')
            .text(`Period: ${dayjs(dateFrom).format('DD MMM YYYY')} – ${dayjs(dateTo).format('DD MMM YYYY')}`, { align: 'center' })
            .text(`Generated: ${dayjs().format('DD MMM YYYY HH:mm')}`, { align: 'center' });
        doc.moveDown(1);

        // Sections
        for (const section of sections) {
            doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#e4e4e7').stroke();
            doc.moveDown(0.5);
            doc.fontSize(12).fillColor('#18181b').text(section.heading);
            doc.moveDown(0.3);

            for (const row of section.rows) {
                doc.fontSize(10)
                    .fillColor('#52525b').text(row.label, { continued: true, width: 250 })
                    .fillColor('#18181b').text(String(row.value));
            }
            doc.moveDown(0.8);
        }

        doc.end();
    });
}

/**
 * Generate an Excel workbook buffer.
 * @param {object[]} sheets  [{name, data: [{col: val, ...}]}]
 * @returns {Buffer}
 */
function generateExcel(sheets) {
    const wb = XLSX.utils.book_new();
    for (const { name, data } of sheets) {
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31)); // Excel 31-char limit
    }
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Convert array of objects to CSV string.
 */
function generateCSV(data) {
    if (!data.length) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','));
    return [headers.join(','), ...rows].join('\n');
}

module.exports = { generatePDF, generateExcel, generateCSV };
