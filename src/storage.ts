import type { LoopEntry, VideoLoopConfig, StorageData } from "./types";

const STORAGE_KEY = "reprise_data";
const SCHEMA_VERSION = 1;

function generateId(): string {
  return crypto.randomUUID();
}

function isStorageData(value: unknown): value is StorageData {
  return typeof value === "object" && value !== null && "videos" in value && "version" in value;
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
  loopData: Omit<LoopEntry, "id" | "createdAt">,
  videoTitle?: string,
): Promise<LoopEntry> {
  const data = await getStorageData();
  let config = data.videos[videoId];

  if (!config) {
    config = {
      videoId,
      videoTitle,
      activeLoopId: null,
      loops: [],
    };
  }

  if (videoTitle) {
    config.videoTitle = videoTitle;
  }

  const newLoop: LoopEntry = {
    ...loopData,
    id: generateId(),
    createdAt: Date.now(),
  };

  config.loops.push(newLoop);
  data.videos[videoId] = config;
  await saveStorageData(data);

  return newLoop;
}

export async function updateLoop(videoId: string, loop: LoopEntry): Promise<void> {
  const data = await getStorageData();
  const config = data.videos[videoId];

  if (!config) {
    throw new Error(`Video config not found: ${videoId}`);
  }

  const index = config.loops.findIndex((l) => l.id === loop.id);
  if (index === -1) {
    throw new Error(`Loop not found: ${loop.id}`);
  }

  config.loops[index] = loop;
  await saveStorageData(data);
}

export async function deleteLoop(videoId: string, loopId: string): Promise<void> {
  const data = await getStorageData();
  const config = data.videos[videoId];

  if (!config) {
    return;
  }

  config.loops = config.loops.filter((l) => l.id !== loopId);

  if (config.activeLoopId === loopId) {
    config.activeLoopId = null;
  }

  await saveStorageData(data);
}

export async function setActiveLoop(
  videoId: string,
  loopId: string | null,
): Promise<LoopEntry | null> {
  const data = await getStorageData();
  const config = data.videos[videoId];

  if (!config) {
    return null;
  }

  config.activeLoopId = loopId;
  await saveStorageData(data);

  if (loopId === null) {
    return null;
  }

  return config.loops.find((l) => l.id === loopId) ?? null;
}

export async function getActiveLoop(videoId: string): Promise<LoopEntry | null> {
  const config = await getVideoConfig(videoId);
  if (!config || !config.activeLoopId) {
    return null;
  }
  return config.loops.find((l) => l.id === config.activeLoopId) ?? null;
}
