import type { Track, LoopSetting, VideoLoopConfig, StorageMeta } from "./types";

const META_KEY = "reprise_meta";
const VIDEO_KEY_PREFIX = "reprise_v_";
const SCHEMA_VERSION = 2;

function generateId(): string {
  return crypto.randomUUID();
}

function videoKey(videoId: string): string {
  return `${VIDEO_KEY_PREFIX}${videoId}`;
}

function isStorageMeta(value: unknown): value is StorageMeta {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  if (!("videoIds" in value) || !("version" in value)) {
    return false;
  }
  const { videoIds } = value;
  return Array.isArray(videoIds);
}

function isVideoLoopConfig(value: unknown): value is VideoLoopConfig {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  return "videoId" in value && "tracks" in value && "loopSettings" in value;
}

async function getMeta(): Promise<StorageMeta> {
  const result = await chrome.storage.local.get(META_KEY);
  const data = result[META_KEY];
  if (isStorageMeta(data)) {
    return data;
  }
  return { videoIds: [], version: SCHEMA_VERSION };
}

async function saveMeta(meta: StorageMeta): Promise<void> {
  await chrome.storage.local.set({ [META_KEY]: meta });
}

export async function getVideoConfig(videoId: string): Promise<VideoLoopConfig | null> {
  const key = videoKey(videoId);
  const result = await chrome.storage.local.get(key);
  const data = result[key];
  if (isVideoLoopConfig(data)) {
    return data;
  }
  return null;
}

async function saveVideoConfig(config: VideoLoopConfig): Promise<void> {
  const key = videoKey(config.videoId);
  const meta = await getMeta();

  if (!meta.videoIds.includes(config.videoId)) {
    meta.videoIds.push(config.videoId);
    await saveMeta(meta);
  }

  await chrome.storage.local.set({ [key]: config });
}

export async function addLoop(
  videoId: string,
  trackData: Omit<Track, "id" | "createdAt">,
  videoTitle?: string,
  channelName?: string,
): Promise<{ track: Track; loopSetting: LoopSetting }> {
  let config = await getVideoConfig(videoId);

  if (!config) {
    config = {
      videoId,
      videoTitle,
      channelName,
      activeLoopSettingId: null,
      tracks: [],
      loopSettings: [],
    };
  }

  if (videoTitle) {
    config.videoTitle = videoTitle;
  }
  if (channelName) {
    config.channelName = channelName;
  }

  const newTrack: Track = {
    ...trackData,
    id: generateId(),
    createdAt: Date.now(),
    videoTitle,
    channelName,
  };

  const newLoopSetting: LoopSetting = {
    id: generateId(),
    trackId: newTrack.id,
  };

  config.tracks.push(newTrack);
  config.loopSettings.push(newLoopSetting);
  await saveVideoConfig(config);

  return { track: newTrack, loopSetting: newLoopSetting };
}

export async function updateLoop(videoId: string, track: Track): Promise<void> {
  const config = await getVideoConfig(videoId);

  if (!config) {
    throw new Error(`Video config not found: ${videoId}`);
  }

  const index = config.tracks.findIndex((t) => t.id === track.id);
  if (index === -1) {
    throw new Error(`Track not found: ${track.id}`);
  }

  config.tracks[index] = track;
  await saveVideoConfig(config);
}

export async function deleteLoop(videoId: string, trackId: string): Promise<void> {
  const config = await getVideoConfig(videoId);

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

  await saveVideoConfig(config);
}

export async function setActiveLoop(
  videoId: string,
  loopSettingId: string | null,
): Promise<Track | null> {
  const config = await getVideoConfig(videoId);

  if (!config) {
    return null;
  }

  config.activeLoopSettingId = loopSettingId;
  await saveVideoConfig(config);

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
