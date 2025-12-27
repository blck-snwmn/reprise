import type { Track, LoopSetting, VideoLoopConfig, StorageData } from "./types";

const STORAGE_KEY = "reprise_data";
const SCHEMA_VERSION = 1;

function generateId(): string {
  return crypto.randomUUID();
}

function isVideoLoopConfig(value: unknown): value is VideoLoopConfig {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  return "tracks" in value && "loopSettings" in value;
}

function isStorageData(value: unknown): value is StorageData {
  if (
    typeof value !== "object" ||
    value === null ||
    !("videos" in value) ||
    !("version" in value)
  ) {
    return false;
  }
  const { videos } = value;
  if (typeof videos !== "object" || videos === null) {
    return false;
  }
  for (const config of Object.values(videos)) {
    if (!isVideoLoopConfig(config)) {
      return false;
    }
  }
  return true;
}

async function getStorageData(): Promise<StorageData> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const data = result[STORAGE_KEY];
  if (isStorageData(data)) {
    return data;
  }
  return { videos: {}, version: SCHEMA_VERSION };
}

async function saveStorageData(data: StorageData): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: data });
}

export async function getVideoConfig(videoId: string): Promise<VideoLoopConfig | null> {
  const data = await getStorageData();
  return data.videos[videoId] ?? null;
}

export async function saveVideoConfig(config: VideoLoopConfig): Promise<void> {
  const data = await getStorageData();
  data.videos[config.videoId] = config;
  await saveStorageData(data);
}

export async function addLoop(
  videoId: string,
  trackData: Omit<Track, "id" | "createdAt">,
  videoTitle?: string,
): Promise<{ track: Track; loopSetting: LoopSetting }> {
  const data = await getStorageData();
  let config = data.videos[videoId];

  if (!config) {
    config = {
      videoId,
      videoTitle,
      activeLoopSettingId: null,
      tracks: [],
      loopSettings: [],
    };
  }

  if (videoTitle) {
    config.videoTitle = videoTitle;
  }

  const newTrack: Track = {
    ...trackData,
    id: generateId(),
    createdAt: Date.now(),
  };

  const newLoopSetting: LoopSetting = {
    id: generateId(),
    trackId: newTrack.id,
  };

  config.tracks.push(newTrack);
  config.loopSettings.push(newLoopSetting);
  data.videos[videoId] = config;
  await saveStorageData(data);

  return { track: newTrack, loopSetting: newLoopSetting };
}

export async function updateLoop(videoId: string, track: Track): Promise<void> {
  const data = await getStorageData();
  const config = data.videos[videoId];

  if (!config) {
    throw new Error(`Video config not found: ${videoId}`);
  }

  const index = config.tracks.findIndex((t) => t.id === track.id);
  if (index === -1) {
    throw new Error(`Track not found: ${track.id}`);
  }

  config.tracks[index] = track;
  await saveStorageData(data);
}

export async function deleteLoop(videoId: string, trackId: string): Promise<void> {
  const data = await getStorageData();
  const config = data.videos[videoId];

  if (!config) {
    return;
  }

  // Find loopSettings that reference this track
  const affectedLoopSettings = config.loopSettings.filter((ls) => ls.trackId === trackId);

  // Clear activeLoopSettingId if it's one of the affected loopSettings
  if (
    config.activeLoopSettingId &&
    affectedLoopSettings.some((ls) => ls.id === config.activeLoopSettingId)
  ) {
    config.activeLoopSettingId = null;
  }

  config.tracks = config.tracks.filter((t) => t.id !== trackId);
  config.loopSettings = config.loopSettings.filter((ls) => ls.trackId !== trackId);

  await saveStorageData(data);
}

export async function setActiveLoop(
  videoId: string,
  loopSettingId: string | null,
): Promise<Track | null> {
  const data = await getStorageData();
  const config = data.videos[videoId];

  if (!config) {
    return null;
  }

  config.activeLoopSettingId = loopSettingId;
  await saveStorageData(data);

  if (loopSettingId === null) {
    return null;
  }

  const loopSetting = config.loopSettings.find((ls) => ls.id === loopSettingId);
  if (!loopSetting) {
    return null;
  }

  return config.tracks.find((t) => t.id === loopSetting.trackId) ?? null;
}

export async function getActiveLoop(videoId: string): Promise<Track | null> {
  const config = await getVideoConfig(videoId);
  if (!config || !config.activeLoopSettingId) {
    return null;
  }
  const loopSetting = config.loopSettings.find((ls) => ls.id === config.activeLoopSettingId);
  if (!loopSetting) {
    return null;
  }
  return config.tracks.find((t) => t.id === loopSetting.trackId) ?? null;
}
