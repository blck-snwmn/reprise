import { useMemo } from "react";
import type { LoopEntry } from "../../types";
import { LoopItem } from "./LoopItem";

interface LoopListProps {
  loops: LoopEntry[];
  activeLoopId: string | null;
  onActivate: (loopId: string | null) => void;
  onEdit: (loop: LoopEntry) => void;
  onDelete: (loopId: string) => void;
}

export function LoopList({
  loops,
  activeLoopId,
  onActivate,
  onEdit,
  onDelete,
}: LoopListProps) {
  const sortedLoops = useMemo(
    () => [...loops].sort((a, b) => a.startTime - b.startTime),
    [loops]
  );

  if (loops.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">No loops yet</p>
        <p className="text-xs mt-1">Add a loop to get started</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {sortedLoops.map((loop) => (
        <LoopItem
          key={loop.id}
          loop={loop}
          isActive={loop.id === activeLoopId}
          onActivate={() =>
            onActivate(loop.id === activeLoopId ? null : loop.id)
          }
          onEdit={() => onEdit(loop)}
          onDelete={() => onDelete(loop.id)}
        />
      ))}
    </div>
  );
}
