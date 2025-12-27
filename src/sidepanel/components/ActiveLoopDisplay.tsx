import type { Track } from "../../types";
import { formatTime } from "../../utils";

interface ActiveLoopDisplayProps {
  track: Track | null;
  onStop: () => void;
}

export function ActiveLoopDisplay({ track, onStop }: ActiveLoopDisplayProps) {
  if (!track) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
        <p className="text-sm text-gray-500 text-center">No active loop</p>
      </div>
    );
  }

  const displayName = track.songName || `Loop ${formatTime(track.startTime)}`;
  const timeRange = `${formatTime(track.startTime)} - ${formatTime(track.endTime)}`;

  return (
    <div className="p-4 bg-green-900/30 rounded-lg border border-green-600">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{displayName}</p>
            {track.artistName && (
              <p className="text-xs text-gray-400 truncate">{track.artistName}</p>
            )}
            <p className="text-xs text-gray-500">{timeRange}</p>
          </div>
        </div>
        <button
          onClick={onStop}
          className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors flex-shrink-0"
        >
          Stop
        </button>
      </div>
    </div>
  );
}
