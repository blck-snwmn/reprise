import { useState, useEffect, useRef } from "react";
import type { Message, StateResponse } from "../types";

function parseTime(mmss: string): number {
  const parts = mmss.split(":");
  if (parts.length !== 2) return 0;
  const min = Number(parts[0]);
  const sec = Number(parts[1]);
  if (isNaN(min) || isNaN(sec)) return 0;
  return min * 60 + sec;
}

function formatTime(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

async function sendMessage(message: Message): Promise<StateResponse | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  return chrome.tabs.sendMessage(tab.id, message);
}

export default function App() {
  const [startInput, setStartInput] = useState("0:00");
  const [endInput, setEndInput] = useState("0:00");
  const [enabled, setEnabled] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    sendMessage({ type: "GET_STATE" }).then((state) => {
      if (state) {
        setStartInput(formatTime(state.start));
        setEndInput(formatTime(state.end || state.duration));
        setEnabled(state.enabled);
        setDuration(state.duration);
      }
    });
  }, []);

  const validate = (start: number, end: number): string | null => {
    if (start < 0) return "Start time cannot be negative";
    if (end > duration) return "End time exceeds video duration";
    if (start >= end) return "Start must be before end";
    return null;
  };

  const applyLoop = async (startStr: string, endStr: string) => {
    const start = parseTime(startStr);
    const end = parseTime(endStr);
    const err = validate(start, end);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    await sendMessage({ type: "SET_LOOP", start, end });
  };

  // Debounce: 入力が止まってから300ms後に反映
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      applyLoop(startInput, endInput);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [startInput, endInput]);

  const handleToggle = async () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    await sendMessage({ type: "SET_ENABLED", enabled: newEnabled });
  };

  return (
    <div className="w-64 p-4 bg-gray-900 text-white">
      <h1 className="text-lg font-bold mb-4">Reprise</h1>

      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Start (mm:ss)</label>
          <input
            type="text"
            value={startInput}
            onChange={(e) => setStartInput(e.target.value)}
            className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white"
            placeholder="0:00"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">End (mm:ss)</label>
          <input
            type="text"
            value={endInput}
            onChange={(e) => setEndInput(e.target.value)}
            className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white"
            placeholder="0:00"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex items-center justify-between">
          <span className="text-sm">Loop</span>
          <button
            onClick={handleToggle}
            className={`w-12 h-6 rounded-full transition-colors ${
              enabled ? "bg-green-500" : "bg-gray-600"
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full transition-transform ${
                enabled ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {duration > 0 && (
          <p className="text-xs text-gray-500">
            Duration: {formatTime(duration)}
          </p>
        )}
      </div>
    </div>
  );
}
