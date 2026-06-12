/* bulk-upload.js — Bulk Upload page */
'use strict';

let parsedRows = [];
let dropEl = null;

function setupDropZone() {
  dropEl = document.getElementById('drop-zone');
  if (!dropEl) return;

  dropEl.addEventListener('dragover', e => {
    e.preventDefault();
    dropEl.classList.add('over');
  });
  dropEl.addEventListener('dragleave', () => dropEl.classList.remove('over'));
  dropEl.addEventListener('drop', e => {
    e.preventDefault();
    dropEl.classList.remove('over');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });
  document.getElementById('file-input')?.addEventListener('change', function() {
    if (this.files[0]) handleFile(this.files[0]);
  });
}

function handleFile(file) {
  const validExts = ['.xlsx','.xls','.csv'];
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  if (!validExts.includes(ext)) {
    Toast.error('Invalid file type', 'Please upload an Excel (.xlsx, .xls) or CSV file.');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    Toast.error('File too large', 'Maximum file size is 10MB.');
    return;
  }

  document.getElementById('file-name').style.display = '';
  document.getElementById('file-name').textContent = `📎 ${file.name}`;

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const wb    = XLSX.read(e.target.result, { type: 'binary' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json  = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      parsedRows  = json.filter(r => r.some(c => String(c).trim()));
      showPreview(parsedRows);
    } catch (err) {
      Toast.error('Parse error', err.message);
    }
  };
  reader.readAsBinaryString(file);
}

function showPreview(rows) {
  if (rows.length < 2) {
    Toast.warning('Empty file', 'The file appears to have no data rows.');
    return;
  }
  const headers = rows[0].map(h => String(h).trim());
  const data    = rows.slice(1, 6); // first 5 rows

  document.getElementById('total-rows').textContent = rows.length - 1;

  const thead = document.getElementById('preview-head');
  thead.innerHTML = '<tr>' + headers.map(h =>
    `<th>${esc(h)}</th>`).join('') + '</tr>';

  const tbody = document.getElementById('preview-body');
  tbody.innerHTML = data.map(row =>
    '<tr>' + headers.map((_, i) => `<td class="text-sm">${esc(String(row[i] || ''))}</td>`).join('') + '</tr>'
  ).join('');

  document.getElementById('preview-section').style.display = '';
  document.getElementById('upload-options').style.display  = '';
  document.getElementById('upload-action').style.display   = '';
}

function downloadTemplate() {
  const ws_data = [
    ['Product Name', 'Destination URL', 'Product Code', 'Category', 'Description'],
    ['Navkar Premium Plywood 18mm', 'https://navkarplywood.com/products/npl18', 'NPL-18MM', 'Plywood', 'Premium 18mm commercial plywood'],
    ['Teak Face Plywood 12mm', 'https://navkarplywood.com/products/tfp12', 'TFP-12MM', 'Plywood', 'Teak face veneer finish'],
    ['MR Grade BWR Plywood', 'https://navkarplywood.com/products/mr-bwr', 'MR-BWR', 'Specialty', 'Moisture resistant grade'],
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  ws['!cols'] = [{ wch: 30 }, { wch: 50 }, { wch: 18 }, { wch: 20 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, ws, 'QR Codes Template');
  XLSX.writeFile(wb, 'navkar-qr-template.xlsx');
  Toast.success('Template downloaded!');
}

async function uploadAll() {
  if (!parsedRows.length) { Toast.error('No file loaded'); return; }

  const headers = parsedRows[0].map(h => String(h).trim().toLowerCase());
  const dataRows = parsedRows.slice(1);

  // Required column check
  const nameCol = headers.findIndex(h => h.includes('product') && h.includes('name'));
  const urlCol  = headers.findIndex(h => h.includes('url') || h.includes('destination'));

  if (nameCol === -1 || urlCol === -1) {
    Toast.error('Column mapping error', 'File must have "Product Name" and "Destination URL" columns.');
    return;
  }

  const codeCol = headers.findIndex(h => h.includes('code') || h.includes('sku'));
  const catCol  = headers.findIndex(h => h.includes('category'));
  const descCol = headers.findIndex(h => h.includes('description') || h.includes('desc'));

  const template = document.getElementById('template-select').value;
  const status   = document.getElementById('status-select').value;

  const btn = document.getElementById('upload-btn');
  btn.disabled = true;

  document.getElementById('progress-section').style.display = '';
  document.getElementById('upload-action').style.display   = 'none';
  document.getElementById('results-section').style.display = 'none';

  let success = 0, errors = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const pct = Math.round(((i + 1) / dataRows.length) * 100);
    document.getElementById('progress-bar').style.width = pct + '%';
    document.getElementById('progress-pct').textContent = pct + '%';
    document.getElementById('progress-detail').textContent = `Processing row ${i + 1} of ${dataRows.length}...`;

    const name = String(row[nameCol] || '').trim();
    const url  = String(row[urlCol]  || '').trim();

    if (!name || !url) {
      errors.push({ row: i + 2, product: name || '(empty)', error: 'Missing required fields' });
      continue;
    }

    try {
      await API.post('/qr', {
        product_name:    name,
        destination_url: url,
        product_code:    codeCol >= 0 ? String(row[codeCol] || '').trim() : '',
        category:        catCol  >= 0 ? String(row[catCol]  || '').trim() : '',
        description:     descCol >= 0 ? String(row[descCol] || '').trim() : '',
        template_id:     template || null,
        status,
      });
      success++;
    } catch (err) {
      errors.push({ row: i + 2, product: name, error: err.message });
    }

    // Small delay to avoid overloading
    if (i % 10 === 9) await new Promise(r => setTimeout(r, 100));
  }

  document.getElementById('progress-section').style.display = 'none';

  // Show results
  document.getElementById('res-success').textContent = success;
  document.getElementById('res-errors').textContent  = errors.length;
  document.getElementById('res-total').textContent   = dataRows.length;
  document.getElementById('results-section').style.display = '';

  if (errors.length > 0) {
    const errorList = document.getElementById('error-list');
    errorList.style.display = '';
    document.getElementById('error-tbody').innerHTML = errors.map(e => `<tr>
      <td>${e.row}</td>
      <td>${esc(e.product)}</td>
      <td class="text-danger">${esc(e.error)}</td>
    </tr>`).join('');
  }

  if (success > 0) Toast.success(`${success} QR codes created!`);
  if (errors.length > 0) Toast.warning(`${errors.length} rows had errors`);

  btn.disabled = false;
}

document.addEventListener('DOMContentLoaded', () => {
  setupDropZone();

  document.getElementById('download-template-btn')?.addEventListener('click', downloadTemplate);
  document.getElementById('upload-btn')?.addEventListener('click', uploadAll);

  document.getElementById('clear-file-btn')?.addEventListener('click', () => {
    parsedRows = [];
    document.getElementById('file-input').value = '';
    document.getElementById('file-name').style.display = 'none';
    document.getElementById('preview-section').style.display = 'none';
    document.getElementById('upload-options').style.display  = 'none';
    document.getElementById('upload-action').style.display   = 'none';
  });

  document.getElementById('upload-more-btn')?.addEventListener('click', () => {
    parsedRows = [];
    document.getElementById('file-input').value = '';
    document.getElementById('file-name').style.display = 'none';
    document.getElementById('preview-section').style.display = 'none';
    document.getElementById('upload-options').style.display  = 'none';
    document.getElementById('results-section').style.display = 'none';
    document.getElementById('error-list').style.display      = 'none';
    document.getElementById('upload-action').style.display   = 'none';
    document.getElementById('progress-pct').textContent = '0%';
    document.getElementById('progress-bar').style.width = '0%';
  });
});
