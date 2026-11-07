import { describe, it, expect } from 'vitest';
import {
  escapeCsvCell,
  exportTracksToCSV,
  exportTracksToJSON,
  exportEventsToCSV,
  exportEventsToJSON,
} from '../export';
import { DetectionEvent, Track } from '@/types/detection';

describe('Export engine', () => {
  describe('escapeCsvCell', () => {
    it('returns empty string for null and undefined', () => {
      expect(escapeCsvCell(null)).toBe('');
      expect(escapeCsvCell(undefined)).toBe('');
    });

    it('returns simple strings unquoted', () => {
      expect(escapeCsvCell('person')).toBe('person');
      expect(escapeCsvCell('123')).toBe('123');
    });

    it('quotes strings containing commas', () => {
      expect(escapeCsvCell('blue, dark jacket')).toBe('"blue, dark jacket"');
    });

    it('escapes and quotes strings containing double quotes', () => {
      expect(escapeCsvCell('said "hello"')).toBe('"said ""hello"""');
    });

    it('quotes strings containing newlines', () => {
      expect(escapeCsvCell('line 1\nline 2')).toBe('"line 1\nline 2"');
      expect(escapeCsvCell('line 1\r\nline 2')).toBe('"line 1\r\nline 2"');
    });
  });

  describe('exportTracksToCSV', () => {
    const mockTracks: Track[] = [
      {
        id: 'T001',
        displayId: 'ID-001',
        classId: 'person',
        label: 'Person',
        status: 'visible',
        confidence: 0.942,
        peakConfidence: 0.985,
        firstSeen: 1700000000000,
        lastSeen: 1700000015000,
        bbox: { x: 0.1, y: 0.2, w: 0.1, h: 0.3 },
        trail: [],
        attributes: { upper: 'dark jacket, hooded', speed: 'walking' },
        description: { status: 'ready', text: 'Adult with a "hooded" jacket, moving east.' },
        thumbnail: 'data:image/jpeg;base64,12345',
        flagged: false,
      },
      {
        id: 'T002',
        displayId: 'ID-002',
        classId: 'suitcase',
        label: 'Suitcase',
        status: 'lost',
        confidence: 0.88,
        peakConfidence: 0.91,
        firstSeen: 1700000020000,
        lastSeen: 1700000025000,
        bbox: { x: 0.5, y: 0.6, w: 0.1, h: 0.1 },
        trail: [],
        attributes: { color: 'black', attended: false },
        description: { status: 'ready', text: 'Black suitcase left unattended' },
        flagged: true,
      },
    ];

    it('generates valid RFC 4180 CSV with header row', () => {
      const csv = exportTracksToCSV(mockTracks);
      const lines = csv.split('\n');

      expect(lines[0]).toBe(
        'id,displayId,classId,label,status,confidence,peakConfidence,firstSeen,lastSeen,durationSeconds,flagged,description,attributes'
      );
      expect(lines.length).toBe(3);

      // Verify row 1 escaping of description with quotes and commas
      expect(lines[1]).toContain('"Adult with a ""hooded"" jacket, moving east."');
      expect(lines[1]).toContain('15.00'); // 15s duration
      expect(lines[1]).toContain('false'); // flagged = false

      // Verify row 2 flagged
      expect(lines[2]).toContain('true'); // flagged = true
      expect(lines[2]).toContain('5.00'); // 5s duration
    });
  });

  describe('exportTracksToJSON', () => {
    const mockTracks: Track[] = [
      {
        id: 'T001',
        displayId: 'ID-001',
        classId: 'person',
        label: 'Person',
        status: 'visible',
        confidence: 0.95,
        peakConfidence: 0.95,
        firstSeen: 1700000000000,
        lastSeen: 1700000005000,
        bbox: { x: 0.1, y: 0.2, w: 0.1, h: 0.3 },
        trail: [],
        attributes: {},
        description: { status: 'ready', text: 'Person walking' },
        thumbnail: 'data:image/jpeg;base64,HUGE_IMAGE_STRING',
        flagged: false,
      },
    ];

    it('excludes thumbnail by default', () => {
      const jsonStr = exportTracksToJSON(mockTracks);
      const parsed = JSON.parse(jsonStr);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('T001');
      expect(parsed[0].thumbnail).toBeUndefined();
    });

    it('includes thumbnail when includeThumbnails=true', () => {
      const jsonStr = exportTracksToJSON(mockTracks, true);
      const parsed = JSON.parse(jsonStr);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].thumbnail).toBe('data:image/jpeg;base64,HUGE_IMAGE_STRING');
    });
  });

  describe('exportEvents', () => {
    const mockEvents: DetectionEvent[] = [
      {
        id: 'evt_1',
        ts: 1700000000000,
        type: 'track.new',
        trackId: 'T001',
        classId: 'person',
        confidence: 0.95,
      },
      {
        id: 'evt_2',
        ts: 1700000001000,
        type: 'track.flagged',
        trackId: 'T002',
        classId: 'suitcase',
        confidence: 0.89,
      },
    ];

    it('exports events to CSV properly formatted', () => {
      const csv = exportEventsToCSV(mockEvents);
      const lines = csv.split('\n');

      expect(lines[0]).toBe('id,timestamp,type,trackId,classId,confidence');
      expect(lines).toHaveLength(3);
      expect(lines[1]).toContain('track.new');
      expect(lines[2]).toContain('track.flagged');
    });

    it('exports events to JSON', () => {
      const jsonStr = exportEventsToJSON(mockEvents);
      const parsed = JSON.parse(jsonStr);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].id).toBe('evt_1');
      expect(parsed[1].type).toBe('track.flagged');
    });
  });
});
