import { parseTime, formatTime } from "../../utils";

interface TimeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onGetCurrentTime: () => void;
  duration: number;
  error?: string;
}

export function TimeInput({
  label,
  value,
  onChange,
  onGetCurrentTime,
  duration,
  error,
}: TimeInputProps) {
  const currentSeconds = parseTime(value);
  const sliderValue = isNaN(currentSeconds) ? 0 : currentSeconds;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seconds = Number(e.target.value);
    onChange(formatTime(seconds));
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-gray-400">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0:00"
          className={`w-20 px-3 py-2 bg-gray-800 border rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
            error ? "border-red-500" : "border-gray-600"
          }`}
        />
        <button
          type="button"
          onClick={onGetCurrentTime}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded text-white text-sm transition-colors"
          title="Get current time"
        >
          now
        </button>
      </div>
      <input
        type="range"
        min={0}
        max={Math.floor(duration)}
        step={1}
        value={sliderValue}
        onChange={handleSliderChange}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
