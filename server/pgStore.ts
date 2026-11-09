import { neon } from '@neondatabase/serverless';
import { DEFAULT_MODEL, DetectionFrame, DetectionRecord, ModelConfig } from './contract';
import { DetectionQuery, Store } from './store';

type Sql = ReturnType<typeof neon>;
type Row = Record<string, unknown>;

/** Rows older than this are pruned on ingest so the table never grows forever. */
export const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS visor_detections (
     track_id        text PRIMARY KEY,
     class_id        text NOT NULL,
     first_seen      bigint NOT NULL,
     last_seen       bigint NOT NULL,
     confidence      real NOT NULL,
     peak_confidence real NOT NULL,
     bbox            jsonb NOT NULL,
     frames          integer NOT NULL DEFAULT 1
   )`,
  `CREATE INDEX IF NOT EXISTS visor_detections_last_seen ON visor_detections (last_seen DESC)`,
  `CREATE TABLE IF NOT EXISTS visor_latest_frame (
     id       smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
     frame_id bigint NOT NULL,
     frame    jsonb NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS visor_model (
     id     smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
     config jsonb NOT NULL
   )`,
];

function toRecord(r: Row): DetectionRecord {
  return {
    trackId: String(r.track_id),
    classId: String(r.class_id),
    firstSeen: Number(r.first_seen),
    lastSeen: Number(r.last_seen),
    confidence: Number(r.confidence),
    peakConfidence: Number(r.peak_confidence),
    bbox: r.bbox as DetectionRecord['bbox'],
    frames: Number(r.frames),
  };
}

export class PgStore implements Store {
  private sql: Sql;
  private ready: Promise<void> | null = null;

  constructor(url: string) {
    this.sql = neon(url);
  }

  private q(text: string, params: unknown[] = []): Promise<Row[]> {
    return this.sql.query(text, params) as Promise<Row[]>;
  }

  private init(): Promise<void> {
    if (!this.ready) {
      this.ready = (async () => {
        for (const stmt of SCHEMA) await this.q(stmt);
      })().catch((e) => {
        this.ready = null;
        throw e;
      });
    }
    return this.ready;
  }

  async ingestFrame(frame: DetectionFrame): Promise<void> {
    await this.init();
    await this.q(
      `INSERT INTO visor_latest_frame (id, frame_id, frame) VALUES (1, $1, $2)
       ON CONFLICT (id) DO UPDATE SET frame_id = EXCLUDED.frame_id, frame = EXCLUDED.frame
       WHERE visor_latest_frame.frame_id <= EXCLUDED.frame_id`,
      [frame.frameId, JSON.stringify(frame)],
    );
    if (frame.detections.length === 0) return;

    // One statement for the whole frame: unnest parallel arrays.
    const ids: string[] = [];
    const classes: string[] = [];
    const confs: number[] = [];
    const boxes: string[] = [];
    for (const d of frame.detections) {
      ids.push(d.trackId);
      classes.push(d.classId);
      confs.push(d.confidence);
      boxes.push(JSON.stringify(d.bbox));
    }
    await this.q(
      `INSERT INTO visor_detections
         (track_id, class_id, first_seen, last_seen, confidence, peak_confidence, bbox, frames)
       SELECT t.id, t.cls, $5, $5, t.conf, t.conf, t.box::jsonb, 1
       FROM unnest($1::text[], $2::text[], $3::real[], $4::text[]) AS t(id, cls, conf, box)
       ON CONFLICT (track_id) DO UPDATE SET
         class_id        = EXCLUDED.class_id,
         last_seen       = GREATEST(visor_detections.last_seen, EXCLUDED.last_seen),
         confidence      = EXCLUDED.confidence,
         peak_confidence = GREATEST(visor_detections.peak_confidence, EXCLUDED.peak_confidence),
         bbox            = EXCLUDED.bbox,
         frames          = visor_detections.frames + 1`,
      [ids, classes, confs, boxes, frame.ts],
    );

    // Cheap, occasional retention sweep.
    if (frame.frameId % 100 === 0) {
      await this.q(`DELETE FROM visor_detections WHERE last_seen < $1`, [frame.ts - RETENTION_MS]);
    }
  }

  async latestFrame(): Promise<DetectionFrame | null> {
    await this.init();
    const rows = await this.q(`SELECT frame FROM visor_latest_frame WHERE id = 1`);
    return rows[0] ? (rows[0].frame as DetectionFrame) : null;
  }

  async listDetections(q: DetectionQuery): Promise<DetectionRecord[]> {
    await this.init();
    const rows = await this.q(
      `SELECT * FROM visor_detections
       WHERE ($1::text IS NULL OR class_id = $1)
         AND ($2::bigint IS NULL OR last_seen < $2)
       ORDER BY last_seen DESC
       LIMIT $3`,
      [q.classId ?? null, q.before ?? null, q.limit],
    );
    return rows.map(toRecord);
  }

  async clearDetections(): Promise<number> {
    await this.init();
    const rows = await this.q(`DELETE FROM visor_detections RETURNING track_id`);
    await this.q(`DELETE FROM visor_latest_frame`);
    return rows.length;
  }

  async getModel(): Promise<ModelConfig> {
    await this.init();
    const rows = await this.q(`SELECT config FROM visor_model WHERE id = 1`);
    return rows[0] ? { ...DEFAULT_MODEL, ...(rows[0].config as ModelConfig) } : DEFAULT_MODEL;
  }

  async updateModel(patch: Partial<ModelConfig>): Promise<ModelConfig> {
    const next: ModelConfig = { ...(await this.getModel()), ...patch, updatedAt: Date.now() };
    await this.q(
      `INSERT INTO visor_model (id, config) VALUES (1, $1)
       ON CONFLICT (id) DO UPDATE SET config = EXCLUDED.config`,
      [JSON.stringify(next)],
    );
    return next;
  }
}
