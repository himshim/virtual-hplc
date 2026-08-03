/**
 * ExportService.js — Shared Report Export Service (CSV, JSON)
 */

export class ExportService {
  /**
   * Generates a downloadable CSV file from structured data points
   * @param {Array<Object>} rows - Array of data objects
   * @param {string} filename - Target filename
   */
  static exportCSV(rows = [], filename = 'lab_report.csv') {
    if (!rows || rows.length === 0) return;

    const headers = Object.keys(rows[0]);
    const csvLines = [headers.join(',')];

    for (const row of rows) {
      const values = headers.map(h => {
        const val = row[h];
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
      });
      csvLines.push(values.join(','));
    }

    const csvContent = csvLines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Generates a downloadable JSON file
   * @param {Object} data - Data to export
   * @param {string} filename - Target filename
   */
  static exportJSON(data = {}, filename = 'lab_session.json') {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
