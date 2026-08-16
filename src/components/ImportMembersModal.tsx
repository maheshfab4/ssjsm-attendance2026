import { useState, useMemo, useCallback } from 'react';
import Papa from 'papaparse';
import { Member } from '../types';
import { normalizePhotoUrl } from '../utils/photoUrl';
import { todayISO } from '../utils/attendance';
import {
  X,
  Upload,
  ClipboardPaste,
  Link2,
  FileSpreadsheet,
  Download,
  Check,
  AlertCircle,
  Loader2,
  Wand2,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';

type ImportMethod = 'paste' | 'file' | 'url';
type FieldKey = 'name' | 'phone' | 'firmName' | 'photoUrl' | 'ignore';

interface ImportMembersModalProps {
  onImport: (members: Omit<Member, 'id'>[]) => void;
  onCancel: () => void;
  groupName: string;
}

interface ParsedRow {
  raw: Record<string, string>;
  mapped: {
    name: string;
    phone: string;
    firmName: string;
    photoUrl: string;
  };
  valid: boolean;
}

// normalizePhotoUrl is imported from utils/photoUrl.ts

// Auto-detect column mapping based on header names
function autoDetectMapping(headers: string[]): Record<FieldKey, string> {
  const mapping: Record<FieldKey, string> = {
    name: '',
    phone: '',
    firmName: '',
    photoUrl: '',
    ignore: '',
  };

  const normalize = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, '');

  headers.forEach((header) => {
    const h = normalize(header);
    if (!h) return;

    if (
      !mapping.name &&
      (h.includes('name') || h.includes('member') || h === 'fullname' || h === 'fullname')
    ) {
      mapping.name = header;
    } else if (
      !mapping.phone &&
      (h.includes('phone') ||
        h.includes('mobile') ||
        h.includes('contact') ||
        h.includes('cell') ||
        h === 'number' ||
        h === 'no')
    ) {
      mapping.phone = header;
    } else if (
      !mapping.firmName &&
      (h.includes('firm') ||
        h.includes('company') ||
        h.includes('organization') ||
        h.includes('organisation') ||
        h.includes('business'))
    ) {
      mapping.firmName = header;
    } else if (
      !mapping.photoUrl &&
      (h.includes('photo') ||
        h.includes('image') ||
        h.includes('picture') ||
        h.includes('avatar') ||
        h.includes('pic'))
    ) {
      mapping.photoUrl = header;
    }
  });

  // Fallback: if no name column found, use first column
  if (!mapping.name && headers.length > 0) {
    mapping.name = headers[0];
  }

  return mapping;
}

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  // Try to detect delimiter
  const firstLine = text.split('\n')[0] || '';
  const hasTabs = firstLine.includes('\t');
  const hasCommas = firstLine.includes(',');

  const result = Papa.parse<string[]>(text, {
    header: false,
    skipEmptyLines: true,
    delimiter: hasTabs && !hasCommas ? '\t' : ',',
  });

  if (result.data.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = (result.data[0] as string[]).map((h) => (h || '').trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < result.data.length; i++) {
    const row = result.data[i] as string[];
    if (!row || row.every((c) => !c || !c.trim())) continue;
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (row[idx] || '').trim();
    });
    rows.push(obj);
  }

  return { headers, rows };
}

export default function ImportMembersModal({ onImport, onCancel, groupName }: ImportMembersModalProps) {
  const [method, setMethod] = useState<ImportMethod>('paste');
  const [pasteText, setPasteText] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetError, setSheetError] = useState('');
  const [hasHeaderRow, setHasHeaderRow] = useState(true);

  // Parsed state
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<FieldKey, string>>({
    name: '',
    phone: '',
    firmName: '',
    photoUrl: '',
    ignore: '',
  });

  const parsedRows: ParsedRow[] = useMemo(() => {
    if (rows.length === 0 || !mapping.name) return [];
    return rows.map((raw) => {
      const mapped = {
        name: (raw[mapping.name] || '').trim(),
        phone: (raw[mapping.phone] || '').trim(),
        firmName: (raw[mapping.firmName] || '').trim(),
        photoUrl: normalizePhotoUrl(raw[mapping.photoUrl] || ''),
      };
      return {
        raw,
        mapped,
        valid: mapped.name.length > 0,
      };
    });
  }, [rows, mapping]);

  const validCount = parsedRows.filter((r) => r.valid).length;

  const handleParsedData = useCallback(
    (data: { headers: string[]; rows: Record<string, string>[] }) => {
      setHeaders(data.headers);
      setRows(data.rows);
      const detected = autoDetectMapping(data.headers);
      setMapping(detected);
    },
    []
  );

  const handlePaste = () => {
    if (!pasteText.trim()) return;
    // If hasHeaderRow is false, generate fake headers
    const textToParse = hasHeaderRow
      ? pasteText
      : (() => {
          const lines = pasteText.split('\n').filter((l) => l.trim());
          const firstLine = lines[0] || '';
          const cols = firstLine.includes('\t')
            ? firstLine.split('\t').length
            : firstLine.split(',').length;
          const fakeHeaders = Array.from({ length: cols }, (_, i) => `Column ${i + 1}`).join(
            firstLine.includes('\t') ? '\t' : ','
          );
          return fakeHeaders + '\n' + pasteText;
        })();
    handleParsedData(parseCSV(textToParse));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      handleParsedData(parseCSV(text));
    };
    reader.readAsText(file);
  };

  const handleSheetUrl = async () => {
    setSheetLoading(true);
    setSheetError('');
    try {
      // Extract sheet ID and optional gid
      const urlMatch = sheetUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (!urlMatch) {
        throw new Error('Invalid Google Sheets URL. It should contain /d/SHEET_ID');
      }
      const sheetId = urlMatch[1];
      const gidMatch = sheetUrl.match(/[?#&]gid=(\d+)/);
      const gid = gidMatch ? gidMatch[1] : '0';

      // Try the published CSV export endpoint
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
      const res = await fetch(csvUrl);
      if (!res.ok) {
        throw new Error(
          `Could not fetch sheet (status ${res.status}). Make sure it's published to the web (File → Share → Publish to web → CSV).`
        );
      }
      const text = await res.text();
      handleParsedData(parseCSV(text));
    } catch (err: any) {
      setSheetError(err.message || 'Failed to fetch sheet');
    } finally {
      setSheetLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csv = `Name,Phone,Firm Name,Photo URL
John Doe,+91 98765 43210,ABC Traders,
Jane Smith,+91 98765 11111,XYZ Corp,https://drive.google.com/file/d/YOUR_DRIVE_ID/view
`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'members-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setHeaders([]);
    setRows([]);
    setPasteText('');
    setSheetUrl('');
    setSheetError('');
  };

  const handleImport = () => {
    const members: Omit<Member, 'id'>[] = parsedRows
      .filter((r) => r.valid)
      .map((r) => ({
        name: r.mapped.name,
        phone: r.mapped.phone,
        firmName: r.mapped.firmName,
        photoUrl: r.mapped.photoUrl,
        effectiveFrom: todayISO(),
      }));
    onImport(members);
  };

  const hasData = rows.length > 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-5 text-white flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-6 h-6" />
            <div>
              <h2 className="text-lg font-bold">Import Members</h2>
              <p className="text-white/70 text-xs">Import into {groupName}</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!hasData ? (
            <>
              {/* Method tabs */}
              <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-5">
                {([
                  { key: 'paste' as ImportMethod, label: 'Paste', icon: ClipboardPaste },
                  { key: 'file' as ImportMethod, label: 'Upload CSV', icon: Upload },
                  { key: 'url' as ImportMethod, label: 'Sheet URL', icon: Link2 },
                ]).map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setMethod(key)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      method === key
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              {/* Template download */}
              <button
                onClick={handleDownloadTemplate}
                className="w-full flex items-center justify-center gap-2 mb-4 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-200"
              >
                <Download className="w-4 h-4" />
                Download Template CSV
              </button>

              {/* Photo URL instructions */}
              <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                <strong className="text-amber-900">📷 For photos to show for everyone:</strong>
                <p className="mt-1">
                  Google Drive images must be shared with <strong>"Anyone with the link"</strong>. 
                  Select all images → Right-click → Share → Change access → Anyone with the link → Done.
                </p>
              </div>

              {/* Paste Method */}
              {method === 'paste' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Paste data from Google Sheets (or Excel)
                    </label>
                    <p className="text-xs text-slate-500 mb-2">
                      💡 Tip: Select rows in Google Sheets → right-click → Copy (or Ctrl/Cmd+C) → paste below. The first row should be column headers.
                    </p>
                    <textarea
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      placeholder="Name&#9;Phone&#9;Firm Name&#9;Photo URL
John Doe&#9;+91 98765 43210&#9;ABC Traders&#9;https://drive.google.com/file/d/xyz/view
Jane Smith&#9;+91 98765 11111&#9;XYZ Corp&#9;"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm resize-none"
                      rows={10}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={hasHeaderRow}
                      onChange={(e) => setHasHeaderRow(e.target.checked)}
                      className="rounded"
                    />
                    First row contains headers
                  </label>
                  <button
                    onClick={handlePaste}
                    disabled={!pasteText.trim()}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Parse Data
                  </button>
                </div>
              )}

              {/* File Method */}
              {method === 'file' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Upload a CSV file exported from Google Sheets
                    </label>
                    <p className="text-xs text-slate-500 mb-4">
                      💡 In Google Sheets: File → Download → Comma Separated Values (.csv)
                    </p>
                    <label className="block cursor-pointer">
                      <input type="file" accept=".csv,.tsv,.txt" onChange={handleFileUpload} className="hidden" />
                      <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition-all">
                        <Upload className="w-10 h-10 mx-auto mb-3 text-slate-400" />
                        <p className="font-medium text-slate-700">Click to upload CSV</p>
                        <p className="text-sm text-slate-500 mt-1">or drag and drop</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* URL Method */}
              {method === 'url' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Google Sheets URL (published to web)
                    </label>
                    <p className="text-xs text-slate-500 mb-2">
                      ⚠️ The sheet must be published to the web: File → Share → Publish to web → select CSV format.
                    </p>
                    <input
                      type="url"
                      value={sheetUrl}
                      onChange={(e) => setSheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                    />
                  </div>
                  {sheetError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-sm text-red-700">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Could not fetch sheet</p>
                        <p className="text-xs mt-0.5">{sheetError}</p>
                        <p className="text-xs mt-2">
                          Try the <strong>Paste</strong> or <strong>Upload CSV</strong> method instead — these work without publishing.
                        </p>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={handleSheetUrl}
                    disabled={!sheetUrl.trim() || sheetLoading}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {sheetLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Fetching...
                      </>
                    ) : (
                      <>
                        <Link2 className="w-4 h-4" />
                        Fetch Sheet
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Column mapping */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-semibold text-slate-900">Map Columns to Fields</h3>
                  </div>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Re-import
                  </button>
                </div>

                <p className="text-xs text-slate-500 mb-3">
                  We auto-detected columns. Adjust if needed. {validCount} of {rows.length} rows have a name and will be imported.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(['name', 'phone', 'firmName', 'photoUrl'] as FieldKey[]).map((field) => {
                    const labels: Record<FieldKey, string> = {
                      name: 'Name *',
                      phone: 'Phone',
                      firmName: 'Firm Name',
                      photoUrl: 'Photo URL',
                      ignore: '',
                    };
                    return (
                      <div key={field}>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          {labels[field]}
                        </label>
                        <select
                          value={mapping[field]}
                          onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white"
                        >
                          <option value="">— None —</option>
                          {headers.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Preview */}
              <div className="mb-5">
                <h3 className="font-semibold text-slate-900 mb-3">
                  Preview (first {Math.min(parsedRows.length, 5)} rows)
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-3 py-2 text-slate-600 font-medium">Status</th>
                        <th className="text-left px-3 py-2 text-slate-600 font-medium">Photo</th>
                        <th className="text-left px-3 py-2 text-slate-600 font-medium">Name</th>
                        <th className="text-left px-3 py-2 text-slate-600 font-medium">Phone</th>
                        <th className="text-left px-3 py-2 text-slate-600 font-medium">Firm</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.slice(0, 5).map((row, idx) => (
                        <tr
                          key={idx}
                          className={`border-t border-slate-100 ${
                            !row.valid ? 'bg-red-50/40' : ''
                          }`}
                        >
                          <td className="px-3 py-2">
                            {row.valid ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-400" />
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {row.mapped.photoUrl ? (
                              <img
                                src={row.mapped.photoUrl}
                                alt=""
                                className="w-8 h-8 rounded-lg object-cover bg-slate-100"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.opacity = '0.3';
                                }}
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300">
                                <ImageIcon className="w-4 h-4" />
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2 font-medium text-slate-900">
                            {row.mapped.name || <span className="text-red-400 italic">missing</span>}
                          </td>
                          <td className="px-3 py-2 text-slate-600">{row.mapped.phone}</td>
                          <td className="px-3 py-2 text-slate-600">{row.mapped.firmName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedRows.length > 5 && (
                    <div className="px-3 py-2 bg-slate-50 text-center text-xs text-slate-500 border-t border-slate-100">
                      + {parsedRows.length - 5} more rows
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={validCount === 0}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="w-4 h-4" />
                  Import {validCount} Member{validCount === 1 ? '' : 's'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
