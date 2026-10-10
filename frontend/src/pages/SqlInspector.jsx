import React, { useState, useEffect } from 'react';
import { Database, Play, CheckCircle2, AlertTriangle, Table, Clock, Layers, Sparkles, Terminal, FileCode2, Copy, Check } from 'lucide-react';
import { getSqlPresets, executeSql } from '../api/client';
import { playUiSound } from '../utils/audioFeedback';

export default function SqlInspector() {
  const [presets, setPresets] = useState([]);
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [queryText, setQueryText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getSqlPresets()
      .then((data) => {
        setPresets(data);
        if (data.length > 0) {
          setSelectedPresetId(data[0].id);
          setQueryText(data[0].sql);
          runQuery(data[0].sql);
        }
      })
      .catch((err) => {
        console.error('Failed to load SQL presets:', err);
      });
  }, []);

  const runQuery = async (sqlToRun) => {
    const q = sqlToRun || queryText;
    if (!q.trim()) return;

    playUiSound('click');
    setLoading(true);
    setError(null);

    try {
      const res = await executeSql(q);
      setResult(res);
      playUiSound('success');
    } catch (err) {
      setError(err.message);
      setResult(null);
      playUiSound('alert');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (p) => {
    setSelectedPresetId(p.id);
    setQueryText(p.sql);
    runQuery(p.sql);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(queryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activePreset = presets.find((p) => p.id === selectedPresetId);

  return (
    <div className="p-5 space-y-5 max-w-7xl mx-auto page-enter font-sans">
      {/* Header */}
      <div className="panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-1">
        <div>
          <p className="augen-label-preamble font-mono">Academic Evaluation / Database Engine</p>
          <div className="flex items-center gap-3">
            <h1 className="text-lg md:text-xl font-normal text-ink-primary tracking-tight flex items-center gap-2">
              <Database className="w-5 h-5 text-signal-info" />
              LIVE SQL &amp; RELATIONAL QUERY INSPECTOR
            </h1>
            <span className="augen-tag">
              <span className="w-1.5 h-1.5 rounded-full bg-signal-info animate-pulse" />
              LIVE ENGINE CONNECTED
            </span>
          </div>
          <p className="text-xs text-ink-secondary mt-0.5">
            Real-Time Query Console Demonstrating Multi-Table Joins, Nested Subqueries, Aggregations, Database Views, &amp; Triggers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-3 py-1.5 rounded bg-surface-2 border border-line text-ink-secondary">
            Engine: <b className="text-cyan-400">Prisma (SQLite/PostgreSQL 3NF)</b>
          </span>
        </div>
      </div>

      {/* Preset Query Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => handleSelectPreset(p)}
            className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              selectedPresetId === p.id
                ? 'bg-signal-info text-white font-semibold shadow-sm'
                : 'bg-surface-1 border border-line text-ink-secondary hover:text-ink-primary hover:border-signal-info/40'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{p.name}</span>
          </button>
        ))}
      </div>

      {/* SQL Editor Panel */}
      <div className="panel p-4 bg-surface-1 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-line">
          <div className="flex items-center gap-2 text-xs font-mono text-ink-primary">
            <FileCode2 className="w-4 h-4 text-signal-info" />
            <span className="font-semibold">{activePreset?.name || 'Custom SQL Query'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-1 px-2.5 rounded bg-surface-2 hover:bg-surface-3 border border-line text-[11px] font-mono text-ink-secondary hover:text-ink-primary flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-signal-stable" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy SQL'}</span>
            </button>
            <button
              onClick={() => runQuery()}
              disabled={loading || !queryText.trim()}
              className="btn-primary-action text-xs font-mono flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{loading ? 'Executing...' : 'Run Query (Live)'}</span>
            </button>
          </div>
        </div>

        {activePreset?.description && (
          <div className="p-2.5 rounded bg-surface-0 border border-line text-xs font-mono text-ink-secondary leading-relaxed">
            <span className="text-cyan-400 font-bold uppercase tracking-wider text-[10px] block mb-0.5">Academic Evaluation Context:</span>
            {activePreset.description}
          </div>
        )}

        <div className="relative">
          <textarea
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            rows={7}
            className="w-full p-3 font-mono text-xs bg-surface-0 text-ink-primary border border-line rounded-lg focus:outline-none focus:border-signal-info focus:ring-1 focus:ring-signal-info leading-relaxed"
            placeholder="Type any raw SELECT query here..."
          />
        </div>
      </div>

      {/* Query Result / Feedback */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/40 text-xs font-mono text-rose-300 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <div>
            <p className="font-bold">SQL Execution Error</p>
            <p className="mt-0.5 opacity-90">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="panel p-4 bg-surface-1 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-line text-xs font-mono">
            <div className="flex items-center gap-3">
              <span className="text-signal-stable flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-4 h-4" /> Query Executed Successfully
              </span>
              <span className="text-ink-secondary">
                Rows: <b className="text-ink-primary">{result.rowCount}</b>
              </span>
              <span className="text-ink-secondary">
                Latency: <b className="text-cyan-400">{result.executionTimeMs}ms</b>
              </span>
            </div>

            <span className="text-[10px] text-ink-secondary uppercase">
              Database Table: <b className="text-ink-primary font-mono">{selectedPresetId.toUpperCase()}</b>
            </span>
          </div>

          {/* Results Table */}
          {result.data && result.data.length > 0 ? (
            <div className="overflow-x-auto rounded border border-line max-h-96">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-surface-2 text-ink-secondary uppercase text-[10px] tracking-wider sticky top-0 border-b border-line">
                  <tr>
                    {result.columns.map((col) => (
                      <th key={col} className="p-2.5 px-3 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60 bg-surface-1">
                  {result.data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-surface-2/60 transition-colors">
                      {result.columns.map((col) => {
                        const val = row[col];
                        const isNumeric = typeof val === 'number';
                        return (
                          <td key={col} className="p-2.5 px-3 whitespace-nowrap text-ink-primary">
                            {val === null || val === undefined ? (
                              <span className="text-ink-secondary/40 italic">NULL</span>
                            ) : typeof val === 'boolean' ? (
                              <span className={val ? 'text-signal-stable font-bold' : 'text-signal-critical font-bold'}>
                                {String(val)}
                              </span>
                            ) : (
                              <span className={isNumeric ? 'text-cyan-400 font-semibold tabular-nums' : ''}>
                                {String(val)}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs font-mono text-ink-secondary bg-surface-0 rounded">
              Zero records returned by query.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
