/** トラック定義（曲の区間） */
export interface Track {
  id: string;
  songName: string;
  artistName: string;
  startTime: number;
  endTime: number;
  createdAt: number;
}

/** ループ設定（どのトラックを再生するか） */
export interface LoopSetting {
  id: string;
  trackId: string;
}

/** 1動画のループ設定 */
export interface VideoLoopConfig {
  videoId: string;
  videoTitle?: string;
  activeLoopSettingId: string | null;
  tracks: Track[];
  loopSettings: LoopSetting[];
}

/** ストレージ構造 */
export interface StorageData {
  videos: Record<string, VideoLoopConfig>;
  version: number;
}

/** メッセージ型 */
export type Message =
  | { type: "GET_VIDEO_INFO" }
  | { type: "GET_CURRENT_TIME" }
  | { type: "GET_LOOPS" }
  | { type: "ADD_LOOP"; track: Omit<Track, "id" | "createdAt"> }
  | { type: "UPDATE_LOOP"; track: Track }
  | { type: "DELETE_LOOP"; trackId: string }
  | { type: "ACTIVATE_LOOP"; loopSettingId: string | null }
  | { type: "SEEK_TO_LOOP_START" }
  | { type: "VIDEO_CHANGED"; videoId: string | null };

/** レスポンス型 */
export type VideoInfoResponse = {
  videoId: string | null;
  videoTitle: string | null;
  duration: number;
  currentTime: number;
};

export type LoopsResponse = {
  videoId: string | null;
  tracks: Track[];
  loopSettings: LoopSetting[];
  activeLoopSettingId: string | null;
};

export type CurrentTimeResponse = {
  currentTime: number;
};

export type LoopOperationResponse = {
  success: boolean;
  track?: Track;
  loopSetting?: LoopSetting;
  error?: string;
};
