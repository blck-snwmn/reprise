import { useMemo } from "react";
import type { Track, LoopSetting } from "../../types";
import { LoopItem } from "./LoopItem";

interface LoopListProps {
  tracks: Track[];
  loopSettings: LoopSetting[];
  activeLoopSettingId: string | null;
  onActivate: (loopSettingId: string | null) => void;
  onEdit: (track: Track) => void;
  onDelete: (trackId: string) => void;
}

export function LoopList({
  tracks,
  loopSettings,
  activeLoopSettingId,
  onActivate,
  onEdit,
  onDelete,
}: LoopListProps) {
  const sortedTracks = useMemo(
    () => [...tracks].sort((a, b) => a.startTime - b.startTime),
    [tracks],
  );

  if (tracks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">No loops yet</p>
        <p className="text-xs mt-1">Add a loop to get started</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {sortedTracks.map((track) => {
        const loopSetting = loopSettings.find((ls) => ls.trackId === track.id);
        const isActive = loopSetting?.id === activeLoopSettingId;
        return (
          <LoopItem
            key={track.id}
            track={track}
            isActive={isActive}
            onActivate={() => onActivate(isActive ? null : (loopSetting?.id ?? null))}
            onEdit={() => onEdit(track)}
            onDelete={() => onDelete(track.id)}
          />
        );
      })}
    </div>
  );
}
