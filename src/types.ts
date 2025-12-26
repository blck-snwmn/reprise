/** 1つのループ範囲 */
export interface LoopEntry {
  id: string;
  songName: string;
  artistName: string;
  startTime: number;
  endTime: number;
  createdAt: number;
}

/** 1動画のループ設定 */
export interface VideoLoopConfig {
  videoId: string;
  videoTitle?: string;
  activeLoopId: string | null;
  loops: LoopEntry[];
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
  | { type: "ADD_LOOP"; loop: Omit<LoopEntry, "id" | "createdAt"> }
  | { type: "UPDATE_LOOP"; loop: LoopEntry }
  | { type: "DELETE_LOOP"; loopId: string }
  | { type: "ACTIVATE_LOOP"; loopId: string | null }
  | { type: "SEEK_TO_LOOP_START" };

/** レスポンス型 */
export type VideoInfoResponse = {
  videoId: string | null;
  videoTitle: string | null;
  duration: number;
  currentTime: number;
};

export type LoopsResponse = {
  videoId: string | null;
  loops: LoopEntry[];
  activeLoopId: string | null;
};

export type CurrentTimeResponse = {
  currentTime: number;
};

export type LoopOperationResponse = {
  success: boolean;
  loop?: LoopEntry;
  error?: string;
};
