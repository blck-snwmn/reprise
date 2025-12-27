import { useState } from "react";
import { TimeInput } from "./TimeInput";
import { parseTime, formatTime } from "../../utils";
import type { Track } from "../../types";

interface LoopEditorProps {
  track?: Track;
  duration: number;
  onSave: (data: {
    songName: string;
    artistName: string;
    startTime: number;
    endTime: number;
  }) => void;
  onCancel: () => void;
  onGetCurrentTime: () => Promise<number>;
}

export function LoopEditor({
  track,
  duration,
  onSave,
  onCancel,
  onGetCurrentTime,
}: LoopEditorProps) {
  const [songName, setSongName] = useState(track?.songName ?? "");
  const [artistName, setArtistName] = useState(track?.artistName ?? "");
  const [startInput, setStartInput] = useState(track ? formatTime(track.startTime) : "0:00");
  const [endInput, setEndInput] = useState(
    track ? formatTime(track.endTime) : formatTime(duration),
  );
  const [errors, setErrors] = useState<{
    start?: string;
    end?: string;
    general?: string;
  }>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    const start = parseTime(startInput);
    const end = parseTime(endInput);

    if (isNaN(start)) {
      newErrors.start = "Invalid format (use m:ss)";
    } else if (start < 0) {
      newErrors.start = "Must be positive";
    }

    if (isNaN(end)) {
      newErrors.end = "Invalid format (use m:ss)";
    } else if (duration > 0 && end > duration) {
      newErrors.end = `Max: ${formatTime(duration)}`;
    }

    if (!isNaN(start) && !isNaN(end) && start >= end) {
      newErrors.general = "Start must be before end";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      songName: songName.trim(),
      artistName: artistName.trim(),
      startTime: parseTime(startInput),
      endTime: parseTime(endInput),
    });
  };

  const handleGetCurrentTime = async (setter: (value: string) => void) => {
    const time = await onGetCurrentTime();
    setter(formatTime(time));
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
      <h3 className="text-sm font-medium text-white mb-4">{track ? "Edit Loop" : "Add Loop"}</h3>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">Song Name (optional)</label>
          <input
            type="text"
            value={songName}
            onChange={(e) => setSongName(e.target.value)}
            placeholder="Enter song name"
            className="px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">Artist (optional)</label>
          <input
            type="text"
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            placeholder="Enter artist name"
            className="px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <TimeInput
          label="Start"
          value={startInput}
          onChange={setStartInput}
          onGetCurrentTime={() => handleGetCurrentTime(setStartInput)}
          duration={duration}
          error={errors.start}
        />
        <TimeInput
          label="End"
          value={endInput}
          onChange={setEndInput}
          onGetCurrentTime={() => handleGetCurrentTime(setEndInput)}
          duration={duration}
          error={errors.end}
        />

        {errors.general && <p className="text-sm text-red-400">{errors.general}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded transition-colors"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
