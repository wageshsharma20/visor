import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Download, FileSpreadsheet, Radio, RefreshCw } from 'lucide-react';
import { Card, CardHeader, Button, IconButton, Input, Select } from '@/components/ui';
import { API_BASE } from '@/sources/apiPollingSource';

interface DetectionRecord {
  trackId: string;
  classId: string;
  firstSeen: number;
  lastSeen: number;
  confidence: number;
  peakConfidence: number;
  frames: number;
}

type LoadState = 'loading' | 'ready' | 'offline';

const PAGE_SIZE = 200;

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

function toCsv(rows: DetectionRecord[]): string {
  const head = 'track_id,class,first_seen,last_seen,peak_confidence,frames';
  const body = rows.map((r) =>
    [r.trackId, r.classId, new Date(r.firstSeen).toISOString(), new Date(r.lastSeen).toISOString(), r.peakConfidence.toFixed(3), r.frames]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(','),
  );
  return [head, ...body].join('\n');
}

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<DetectionRecord[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');

  const load = useCallback(async () => {
    setState('loading');
    try {
      const res = await fetch(`${API_BASE}/detections?limit=${PAGE_SIZE}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(String(res.status));
      const body = (await res.json()) as { items: DetectionRecord[] };
      setRows(body.items);
      setState('ready');
    } catch {
      setRows([]);
      setState('offline');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const classes = useMemo(() => [...new Set(rows.map((r) => r.classId))].sort(), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (classFilter === 'all' || r.classId === classFilter) &&
        (!q || r.trackId.toLowerCase().includes(q) || r.classId.toLowerCase().includes(q)),
    );
  }, [rows, search, classFilter]);

  const exportCsv = () => {
    const blob = new Blob([toCsv(filtered)], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visor-detections-${new Date().toISOString().slice(0, 19)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasRows = rows.length > 0;

  return (
    <div className="flex flex-col gap-5 max-w-6xl mx-auto w-full pb-16 sm:pb-8">
      <div className="flex items-center justify-between gap-3 min-h-8">
        <p className="text-small text-text-2">Every object the backend has tracked, newest first.</p>
        {hasRows && (
          <div className="flex items-center gap-2">
            <IconButton
              icon={<RefreshCw className="w-4 h-4" />}
              label="Refresh"
              size={32}
              onClick={() => void load()}
            />
            <Button
              variant="secondary"
              size={32}
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={exportCsv}
              disabled={filtered.length === 0}
            >
              Export CSV
            </Button>
          </div>
        )}
      </div>

      {hasRows && (
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search by class or track ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-44">
            <Select
              value={classFilter}
              onChange={setClassFilter}
              options={[
                { label: 'All classes', value: 'all' },
                ...classes.map((c) => ({ label: c, value: c })),
              ]}
            />
          </div>
        </div>
      )}

      <Card className="flex flex-col overflow-hidden">
        <CardHeader
          title="Detections"
          icon={<Clock className="w-3.5 h-3.5 text-text-2" />}
          action={
            hasRows ? (
              <span className="font-mono text-data text-text-3">
                {filtered.length === rows.length ? rows.length : `${filtered.length} / ${rows.length}`}
              </span>
            ) : undefined
          }
        />

        {hasRows ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-line-1 text-label text-text-3 font-mono uppercase tracking-wider">
                  <th className="py-2.5 px-4 font-medium">Track</th>
                  <th className="py-2.5 px-4 font-medium">Class</th>
                  <th className="py-2.5 px-4 font-medium">First seen</th>
                  <th className="py-2.5 px-4 font-medium">Duration</th>
                  <th className="py-2.5 px-4 font-medium text-right">Peak conf</th>
                  <th className="py-2.5 px-4 font-medium text-right">Frames</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.trackId}
                    className="border-b border-line-1 last:border-b-0 hover:bg-bg-3 transition-colors duration-fast"
                  >
                    <td className="py-2.5 px-4 font-mono text-data text-accent">{r.trackId}</td>
                    <td className="py-2.5 px-4 text-body text-text-1 capitalize">{r.classId}</td>
                    <td className="py-2.5 px-4 font-mono text-data text-text-2">{formatTime(r.firstSeen)}</td>
                    <td className="py-2.5 px-4 font-mono text-data text-text-2">
                      {formatDuration(r.lastSeen - r.firstSeen)}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-data text-text-1 text-right">
                      {Math.round(r.peakConfidence * 100)}%
                    </td>
                    <td className="py-2.5 px-4 font-mono text-data text-text-3 text-right">{r.frames}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-small text-text-3">
                      No detections match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 px-6 flex flex-col items-center text-center max-w-sm mx-auto">
            <div className="w-9 h-9 rounded-control bg-bg-3 border border-line-2 flex items-center justify-center text-text-3 mb-3">
              {state === 'loading' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
            </div>
            <div className="text-body-strong text-text-1 mb-1">
              {state === 'loading' ? 'Loading' : state === 'offline' ? 'Backend not reachable' : 'No detections yet'}
            </div>
            <p className="text-small text-text-3 mb-4 leading-relaxed">
              {state === 'offline'
                ? 'History is stored by the VISOR API. Check that it is deployed and try again.'
                : 'When a model sends frames to the backend, each tracked object appears here.'}
            </p>
            {state === 'offline' ? (
              <Button variant="secondary" size={32} icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={() => void load()}>
                Try again
              </Button>
            ) : state === 'ready' ? (
              <Button variant="primary" size={32} icon={<Radio className="w-3.5 h-3.5" />} onClick={() => navigate('/live')}>
                Go to Live
              </Button>
            ) : null}
          </div>
        )}
      </Card>
    </div>
  );
};
