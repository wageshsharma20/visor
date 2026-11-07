import React from 'react';
import {
  Crosshair,
  Sparkles,
  ListFilter,
  ShieldAlert,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  Pill,
  MetaChip,
} from '@/components/ui';
import { useDetectionStore } from '@/stores/detectionStore';
import { useUiStore } from '@/stores/uiStore';
import { PipelineDebug } from '@/components/live/PipelineDebug';
import { Track } from '@/types/detection';

export const IntelContent: React.FC = () => {
  const { visibleTracks, tracks } = useDetectionStore();
  const { selectedTrackId, setSelectedTrackId } = useUiStore();

  // Find currently selected track
  const allTracks = tracks.length > 0 ? tracks : visibleTracks;
  const selectedTrack = allTracks.find((t) => t.id === selectedTrackId);

  const displayTracks = visibleTracks.length > 0 ? visibleTracks : tracks;

  const handleSelectTrack = (track: Track) => {
    if (selectedTrackId === track.id) {
      setSelectedTrackId(null);
    } else {
      setSelectedTrackId(track.id);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full h-full select-none">
      {/* Debug card (only renders if ?debug=1 in URL) */}
      <PipelineDebug />

      {/* CARD 1: Selected Object (Rendered ONLY when an object is selected per DESIGN.md §5.1) */}
      {selectedTrack && (
        <Card
          data-testid="selected-object-card"
          className="flex flex-col shrink-0 transition-all duration-base"
        >
          <CardHeader
            title={
              <div className="flex items-center gap-2">
                <span className="uppercase font-semibold text-text-1">
                  {selectedTrack.classId}
                </span>
                <span className="font-mono text-data text-accent">
                  {selectedTrack.displayId}
                </span>
              </div>
            }
            icon={<Crosshair className="w-3.5 h-3.5 text-accent" />}
            statusDot={
              <Pill
                variant={selectedTrack.flagged ? 'flagged' : selectedTrack.status}
                dot
              >
                {selectedTrack.flagged ? 'FLAGGED' : selectedTrack.status.toUpperCase()}
              </Pill>
            }
          />
          <div className="p-3 space-y-3">
            {/* Confidence metric & bar */}
            <div>
              <div className="flex items-center justify-between text-small mb-1">
                <span className="text-text-3 font-mono uppercase">Confidence</span>
                <span className="text-metric font-mono text-text-1">
                  {(selectedTrack.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-bg-4 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-fast"
                  style={{ width: `${(selectedTrack.confidence * 100).toFixed(0)}%` }}
                />
              </div>
            </div>

            {/* Meta chips: first seen · time in view */}
            <div className="flex flex-wrap items-center gap-1.5">
              <MetaChip>
                First seen {Math.max(1, Math.round((Date.now() - selectedTrack.firstSeen) / 1000))}s ago
              </MetaChip>
              <MetaChip>
                Duration {Math.max(1, Math.round((selectedTrack.lastSeen - selectedTrack.firstSeen) / 1000))}s
              </MetaChip>
              {selectedTrack.flagged && (
                <MetaChip className="text-amber bg-amber/10 border border-amber/20">
                  <ShieldAlert className="w-3 h-3 text-amber mr-1 inline" />
                  Unattended
                </MetaChip>
              )}
            </div>

            {/* Embedded AI Description inside Selected Object Card per SPEC.md §8 */}
            <div className="p-2.5 bg-bg-3 border border-line-1 rounded-control text-small text-text-2 leading-relaxed">
              <div className="flex items-center gap-1.5 text-data font-mono text-text-3 uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3 text-accent" />
                <span>AI Attribute Description</span>
              </div>
              {selectedTrack.description?.text ? (
                <p className="text-text-1">{selectedTrack.description.text}</p>
              ) : selectedTrack.description?.status === 'pending' ? (
                <p className="text-text-3 italic">Analyzing visual attributes…</p>
              ) : (
                <p className="text-text-3">Visual attributes processing…</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* CARD 2: Detections Card (Takes full panel height if nothing selected) */}
      <Card
        data-testid="detections-card"
        className="flex flex-col flex-1 min-h-[220px] overflow-hidden"
      >
        <CardHeader
          title="Detections"
          icon={<ListFilter className="w-3.5 h-3.5 text-text-2" />}
        />
        <div className="flex-1 p-2 overflow-y-auto space-y-1.5">
          {displayTracks.map((track) => {
            const isSelected = track.id === selectedTrackId;
            return (
              <div
                key={track.id}
                data-testid="track-row"
                onClick={() => handleSelectTrack(track)}
                className={`p-2 rounded-control border cursor-pointer transition-colors duration-fast flex items-center justify-between gap-2 ${
                  isSelected
                    ? 'bg-bg-3 border-accent/40 shadow-glow-accent/20'
                    : 'bg-bg-2 hover:bg-bg-3 border-line-1'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-data text-accent font-medium shrink-0">
                    {track.displayId}
                  </span>
                  <span className="text-small text-text-1 uppercase font-medium truncate">
                    {track.classId}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-data text-text-2">
                    {(track.confidence * 100).toFixed(0)}%
                  </span>
                  <Pill
                    variant={track.flagged ? 'flagged' : track.status}
                    dot
                  >
                    {track.flagged ? 'FLAG' : track.status.toUpperCase()}
                  </Pill>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
