/**
 * StudentNotebook.js — Shared Student Electronic Lab Notebook (ELN)
 *
 * Saves observations, parameters, and results to localStorage; exports CSV lab reports.
 */

export class StudentNotebook {
  constructor(storageKey = 'val_student_notebook') {
    this.storageKey = storageKey;
    this.entries = this.loadEntries();
  }

  loadEntries() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveEntry(entry = {}) {
    const record = {
      id: 'entry_' + Date.now(),
      timestamp: new Date().toISOString(),
      instrument: entry.instrument || 'Analytical Instrument',
      parameters: entry.parameters || {},
      observations: entry.observations || '',
      results: entry.results || {}
    };

    this.entries.unshift(record);
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.entries));
    } catch (e) {
      console.warn('Storage warning:', e);
    }
    return record;
  }

  exportCsv() {
    if (this.entries.length === 0) return '';
    const headers = ['ID', 'Timestamp', 'Instrument', 'Observations'];
    const rows = this.entries.map(e => [
      e.id,
      e.timestamp,
      `"${e.instrument}"`,
      `"${(e.observations || '').replace(/"/g, '""')}"`
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}

export const studentNotebookInstance = new StudentNotebook();
