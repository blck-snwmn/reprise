import type { LoopEntry } from "../../types";
import { formatTime } from "../../utils";

interface LoopItemProps {
  loop: LoopEntry;
  isActive: boolean;
  onActivate: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function LoopItem({
  loop,
  isActive,
  onActivate,
  onEdit,
  onDelete,
}: LoopItemProps) {
  const displayName = loop.songName || `Loop ${formatTime(loop.startTime)}`;
  const timeRange = `${formatTime(loop.startTime)} - ${formatTime(loop.endTime)}`;

  return (
    <div
      className={`p-3 rounded-lg border transition-colors cursor-pointer ${
        isActive
          ? "bg-green-900/30 border-green-600"
          : "bg-gray-800 border-gray-700 hover:border-gray-600"
      }`}
      onClick={onActivate}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-3 h-3 rounded-full flex-shrink-0 ${
              isActive ? "bg-green-500" : "bg-gray-600"
            }`}
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {displayName}
            </p>
            {loop.artistName && (
              <p className="text-xs text-gray-400 truncate">{loop.artistName}</p>
            )}
            <p className="text-xs text-gray-500">{timeRange}</p>
          </div>
        </div>

        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="px-2 py-1 text-xs text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
