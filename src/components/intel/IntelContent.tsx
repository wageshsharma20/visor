import React from 'react';
import {
  Crosshair,
  Sparkles,
  ListFilter,
  EyeOff,
  ShieldAlert,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  StatusDot,
  Pill,
  MetaChip,
} from '@/components/ui';
import { PipelineDebug } from '@/components/live/PipelineDebug';
import { useDetectionStore } from '@/stores/detectionStore';
import { useUiStore } from '@/stores/uiStore';
import { Track } from '@/types/detection';

export const IntelContent: React.FC = () => {
  const { visibleTracks, tracks } = useDetectionStore();
  const { selectedTrackId, setSelectedTrackId } = useUiStore();

  const isDebug =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('debug') === '1';

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
    <div className="flex flex-col gap-4 w-full h-full select-none">
      {/* Dev Debug Card (visible when ?debug=1 in URL) */}
      {isDebug && <PipelineDebug />}

      {/* 1. CURRENT DETECTION CARD */}
      <Card className="flex flex-col shrink-0">
        <CardHeader
          title={
            selectedTrack ? (
              <div className="flex items-center gap-2">
                <span className="uppercase font-semibold text-text-1">
                  {selectedTrack.classId}
                </span>
                <span className="font-mono text-data text-accent">
                  {selectedTrack.displayId}
                </span>
              </div>
            ) : (
              'Current Detection'
            )
          }
          icon={<Crosshair className="w-3.5 h-3.5 text-text-2" />}
          statusDot={
            selectedTrack ? (
              <Pill
                variant={selectedTrack.flagged ? 'flagged' : selectedTrack.status}
                dot
              >
                {selectedTrack.flagged ? 'FLAGGED' : selectedTrack.status.toUpperCase()}
              </Pill>
            ) : (
              <StatusDot state="idle" />
            )
          }
        />
        <div className="p-3">
          {selectedTrack ? (
            <div className="space-y-3">
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
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center bg-bg-3/50 border border-line-1 rounded-control">
              <div className="w-8 h-8 rounded-control bg-bg-3 border border-line-2 flex items-center justify-center text-text-3 mb-2">
                <EyeOff className="w-4 h-4" />
              </div>
              <div className="text-body-strong text-text-1 mb-0.5">No Object Selected</div>
              <div className="text-small text-text-3 max-w-[200px]">
                Select an object in the feed or the list.
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* 2. AI DESCRIPTION CARD */}
      <Card className="flex flex-col shrink-0">
        <CardHeader
          title="AI Description"
          icon={<Sparkles className="w-3.5 h-3.5 text-text-2" />}
          statusDot={<StatusDot state={selectedTrack?.description ? 'live' : 'idle'} />}
        />
        <div className="p-3">
          {selectedTrack?.description?.text ? (
            <div className="p-3 bg-bg-3 border border-line-1 rounded-control text-small text-text-1 leading-relaxed">
              <div className="flex items-center gap-1.5 text-data font-mono text-text-3 uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3 text-accent" />
                <span>Attribute Synthesis</span>
              </div>
              <p>{selectedTrack.description.text}</p>
            </div>
          ) : selectedTrack?.description?.status === 'pending' ? (
            <div className="p-3 bg-bg-3 border border-line-1 rounded-control text-small text-text-3 italic flex items-center justify-center">
              Analyzing visual attributes…
            </div>
          ) : (
            <div className="p-3 bg-bg-3 border border-line-1 rounded-control text-small text-text-3 leading-relaxed min-h-[64px] flex items-center justify-center text-center">
              {selectedTrack ? 'No description available for this object.' : 'Select an object to generate visual description.'}
            </div>
          )}
        </div>
      </Card>

      {/* 3. RECENT DETECTIONS CARD */}
      <Card className="flex flex-col flex-1 min-h-[220px] overflow-hidden">
        <CardHeader
          title="Recent Detections"
          icon={<ListFilter className="w-3.5 h-3.5 text-text-2" />}
          statusDot={
            <span className="font-mono text-data text-text-3 px-1.5 py-0.5 rounded-chip bg-bg-3 border border-line-1">
              {displayTracks.length}
            </span>
          }
        />
        <div className="flex-1 p-2 overflow-y-auto space-y-1.5">
          {displayTracks.length > 0 ? (
            displayTracks.map((track) => {
              const isSelected = track.id === selectedTrackId;
              return (
                <div
                  key={track.id}
                  data-track-item={track.id}
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
            })
          ) : (
            <div className="h-full flex items-center justify-center text-center p-4">
              <span className="text-small text-text-3">
                No objects detected in the current session.
              </span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
