import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type {
  Track,
  LoopSetting,
  Message,
  VideoInfoResponse,
  LoopsResponse,
  CurrentTimeResponse,
  LoopOperationResponse,
} from "../types";
import { sendMessage, formatTime } from "../utils";
import { LoopList } from "./components/LoopList";
import { LoopEditor } from "./components/LoopEditor";
import { ActiveLoopDisplay } from "./components/ActiveLoopDisplay";
import { ConfirmModal } from "./components/ConfirmModal";

type EditorMode = { type: "closed" } | { type: "add" } | { type: "edit"; track: Track };

export default function App() {
  const [videoInfo, setVideoInfo] = useState<VideoInfoResponse | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loopSettings, setLoopSettings] = useState<LoopSetting[]>([]);
  const [activeLoopSettingId, setActiveLoopSettingId] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>({ type: "closed" });
  const [error, setError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const info = await sendMessage<VideoInfoResponse>({ type: "GET_VIDEO_INFO" });
      setVideoInfo(info ?? null);

      const loopsData = await sendMessage<LoopsResponse>({ type: "GET_LOOPS" });
      if (loopsData) {
        setTracks(loopsData.tracks);
        setLoopSettings(loopsData.loopSettings);
        setActiveLoopSettingId(loopsData.activeLoopSettingId);
      }
      setError(null);
    } catch {
      setError("Failed to connect to YouTube tab");
    }
  }, []);

  const loadDataTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedLoadData = useCallback(() => {
    if (loadDataTimerRef.current) {
      clearTimeout(loadDataTimerRef.current);
    }
    loadDataTimerRef.current = setTimeout(() => {
      void loadData();
      loadDataTimerRef.current = null;
    }, 50);
  }, [loadData]);

  useEffect(() => {
    debouncedLoadData();

    const handleMessage = (message: Message) => {
      if (message.type === "VIDEO_CHANGED") {
        debouncedLoadData();
      }
    };

    const handleTabActivated = () => {
      debouncedLoadData();
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    chrome.tabs.onActivated.addListener(handleTabActivated);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
      chrome.tabs.onActivated.removeListener(handleTabActivated);
      if (loadDataTimerRef.current) {
        clearTimeout(loadDataTimerRef.current);
      }
    };
  }, [debouncedLoadData]);

  const handleActivate = async (loopSettingId: string | null) => {
    const result = await sendMessage<LoopOperationResponse>({
      type: "ACTIVATE_LOOP",
      loopSettingId,
    });
    if (result?.success) {
      setActiveLoopSettingId(loopSettingId);
    }
  };

  const handleAddLoop = async (data: {
    songName: string;
    artistName: string;
    startTime: number;
    endTime: number;
  }) => {
    const result = await sendMessage<LoopOperationResponse>({
      type: "ADD_LOOP",
      track: data,
    });
    if (result?.success && result.track && result.loopSetting) {
      const newTrack = result.track;
      const newLoopSetting = result.loopSetting;
      setTracks((prev) => [...prev, newTrack]);
      setLoopSettings((prev) => [...prev, newLoopSetting]);
      setEditorMode({ type: "closed" });
    }
  };

  const handleUpdateLoop = async (
    trackId: string,
    data: {
      songName: string;
      artistName: string;
      startTime: number;
      endTime: number;
    },
  ) => {
    if (editorMode.type !== "edit") return;

    const updatedTrack: Track = {
      ...editorMode.track,
      ...data,
    };

    const result = await sendMessage<LoopOperationResponse>({
      type: "UPDATE_LOOP",
      track: updatedTrack,
    });

    if (result?.success) {
      setTracks((prev) => prev.map((t) => (t.id === trackId ? updatedTrack : t)));
      setEditorMode({ type: "closed" });
    }
  };

  const handleDeleteTrack = (trackId: string) => {
    setDeleteTargetId(trackId);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;

    // Find the loopSetting that references this track
    const affectedLoopSetting = loopSettings.find((ls) => ls.trackId === deleteTargetId);

    const result = await sendMessage<LoopOperationResponse>({
      type: "DELETE_LOOP",
      trackId: deleteTargetId,
    });

    if (result?.success) {
      setTracks((prev) => prev.filter((t) => t.id !== deleteTargetId));
      setLoopSettings((prev) => prev.filter((ls) => ls.trackId !== deleteTargetId));
      if (affectedLoopSetting && activeLoopSettingId === affectedLoopSetting.id) {
        setActiveLoopSettingId(null);
      }
    }
    setDeleteTargetId(null);
  };

  const getCurrentTime = async (): Promise<number> => {
    const result = await sendMessage<CurrentTimeResponse>({
      type: "GET_CURRENT_TIME",
    });
    return result?.currentTime ?? 0;
  };

  const activeTrack = useMemo(() => {
    if (!activeLoopSettingId) return null;
    const loopSetting = loopSettings.find((ls) => ls.id === activeLoopSettingId);
    if (!loopSetting) return null;
    return tracks.find((t) => t.id === loopSetting.trackId) ?? null;
  }, [activeLoopSettingId, loopSettings, tracks]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="text-center py-8">
          <p className="text-red-400 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Open a YouTube video and try again</p>
          <button
            onClick={loadData}
            className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!videoInfo?.videoId) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="text-center py-8">
          <p className="text-gray-400">No video detected</p>
          <p className="text-sm text-gray-500 mt-2">Open a YouTube video to use Reprise</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-lg font-bold">Reprise</h1>
        <p className="text-sm text-gray-400 truncate mt-1">
          {videoInfo.videoTitle || "YouTube Video"}
        </p>
        <p className="text-xs text-gray-500">Duration: {formatTime(videoInfo.duration)}</p>
      </div>

      <div className="p-4">
        <h2 className="text-sm font-medium text-gray-400 mb-2">Now Playing</h2>
        <ActiveLoopDisplay track={activeTrack} onStop={() => handleActivate(null)} />
      </div>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-400">Tracks</h2>
          {editorMode.type === "closed" && (
            <button
              onClick={() => setEditorMode({ type: "add" })}
              className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded transition-colors"
            >
              + Add Track
            </button>
          )}
        </div>

        {editorMode.type !== "closed" ? (
          <LoopEditor
            track={editorMode.type === "edit" ? editorMode.track : undefined}
            duration={videoInfo.duration}
            onSave={(data) => {
              if (editorMode.type === "edit") {
                void handleUpdateLoop(editorMode.track.id, data);
              } else {
                void handleAddLoop(data);
              }
            }}
            onCancel={() => setEditorMode({ type: "closed" })}
            onGetCurrentTime={getCurrentTime}
          />
        ) : (
          <LoopList
            tracks={tracks}
            loopSettings={loopSettings}
            activeLoopSettingId={activeLoopSettingId}
            onActivate={handleActivate}
            onEdit={(track) => setEditorMode({ type: "edit", track })}
            onDelete={handleDeleteTrack}
          />
        )}
      </div>

      {deleteTargetId && (
        <ConfirmModal
          title="Delete Track"
          message="Are you sure you want to delete this track?"
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </div>
  );
}
