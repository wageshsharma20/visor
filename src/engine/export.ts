import { DetectionEvent, Track } from '@/types/detection';

/**
 * Escapes a cell value for standard RFC 4180 CSV compliance.
 * If the value contains commas, quotes, or newlines, it is enclosed in double quotes
 * and internal double quotes are escaped as `""`.
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);

  // If contains delimiter, quote, or newline, escape it
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Converts an array of Tracks into a properly quoted CSV string.
 */
export function exportTracksToCSV(tracks: Track[]): string {
  const headers = [
    'id',
    'displayId',
    'classId',
    'label',
    'status',
    'confidence',
    'peakConfidence',
    'firstSeen',
    'lastSeen',
    'durationSeconds',
    'flagged',
    'description',
    'attributes',
  ];

  const rows = tracks.map((t) => {
    const duration = ((t.lastSeen - t.firstSeen) / 1000).toFixed(2);
    const attrString = Object.entries(t.attributes || {})
      .map(([k, v]) => `${k}:${v}`)
      .join('; ');

    return [
      escapeCsvCell(t.id),
      escapeCsvCell(t.displayId),
      escapeCsvCell(t.classId),
      escapeCsvCell(t.label),
      escapeCsvCell(t.status),
      escapeCsvCell(t.confidence.toFixed(3)),
      escapeCsvCell(t.peakConfidence.toFixed(3)),
      escapeCsvCell(new Date(t.firstSeen).toISOString()),
      escapeCsvCell(new Date(t.lastSeen).toISOString()),
      escapeCsvCell(duration),
      escapeCsvCell(t.flagged ? 'true' : 'false'),
      escapeCsvCell(t.description?.text || ''),
      escapeCsvCell(attrString),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Converts an array of Tracks into formatted JSON.
 * Optionally strips thumbnail data URLs to minimize size.
 */
export function exportTracksToJSON(
  tracks: Track[],
  includeThumbnails = false
): string {
  const sanitized = tracks.map((t) => {
    if (includeThumbnails) {
      return t;
    }
    const { thumbnail: _thumb, ...rest } = t;
    return rest;
  });

  return JSON.stringify(sanitized, null, 2);
}

/**
 * Converts an array of DetectionEvents into CSV.
 */
export function exportEventsToCSV(events: DetectionEvent[]): string {
  const headers = ['id', 'timestamp', 'type', 'trackId', 'classId', 'confidence'];

  const rows = events.map((e) => [
    escapeCsvCell(e.id),
    escapeCsvCell(new Date(e.ts).toISOString()),
    escapeCsvCell(e.type),
    escapeCsvCell(e.trackId),
    escapeCsvCell(e.classId),
    escapeCsvCell(e.confidence.toFixed(3)),
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Converts an array of DetectionEvents into formatted JSON.
 */
export function exportEventsToJSON(events: DetectionEvent[]): string {
  return JSON.stringify(events, null, 2);
}
