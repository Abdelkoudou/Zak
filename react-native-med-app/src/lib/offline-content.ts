// ============================================================================
// Offline Content Service - Safe Implementation with Lazy Loading
// ============================================================================

import { supabase } from './supabase';

// Lazy-loaded Platform
let _Platform: typeof import('react-native').Platform | null = null;
let _platformLoaded = false;

function getPlatformOS(): string {
  if (!_platformLoaded) {
    _platformLoaded = true;
    try {
      _Platform = require('react-native').Platform;
    } catch {
      _Platform = null;
    }
  }
  return _Platform?.OS || 'unknown';
}

/**
 * Normalize string for file path - remove accented characters and special chars
 * Must match the normalization used in db-interface/app/api/export/route.ts
 * Converts: génétique → genetique, Système → systeme, etc.
 */
function normalizeForFilePath(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')                    // Decompose accented chars (é → e + ́)
    .replace(/[\u0300-\u036f]/g, '')     // Remove diacritical marks
    .replace(/[^a-z0-9_-]/g, '_')        // Replace non-alphanumeric with underscore
    .replace(/_+/g, '_')                 // Collapse multiple underscores
    .replace(/^_|_$/g, '');              // Trim leading/trailing underscores
}

// Lazy-loaded FileSystem module to prevent crashes on app startup
let FileSystem: typeof import('expo-file-system') | null = null;
let fileSystemLoadAttempted = false;
let fileSystemAvailable = false;

// Flag to disable offline content if it causes repeated failures
let offlineContentDisabled = false;
let failureCount = 0;
const MAX_FAILURES = 3;

// Lazy load FileSystem to prevent crashes during module initialization
async function getFileSystem(): Promise<typeof import('expo-file-system') | null> {
  if (getPlatformOS() === 'web') return null;
  if (offlineContentDisabled) return null;

  if (!fileSystemLoadAttempted) {
    fileSystemLoadAttempted = true;
    try {
      FileSystem = require('expo-file-system');
      fileSystemAvailable = true;
    } catch (error) {
      if (__DEV__) {
        console.warn('[OfflineContent] Failed to load expo-file-system:', error);
      }
      fileSystemAvailable = false;
      FileSystem = null;
    }
  }

  return FileSystem;
}

// Track failures and disable if too many
function recordFailure(error: any): void {
  failureCount++;
  if (failureCount >= MAX_FAILURES) {
    offlineContentDisabled = true;
    if (__DEV__) {
      console.warn('[OfflineContent] Disabled due to repeated failures');
    }
  }
}

// Get offline directory path safely
async function getOfflineDir(): Promise<string | null> {
  const fs = await getFileSystem();
  if (!fs || !fs.documentDirectory) return null;
  return fs.documentDirectory + 'offline_content/';
}

export interface ModuleData {
  version: string;
  module: string;
  study_year: number;
  questions: any[];
}

export interface OfflineVersion {
  version: string;
  last_updated: string;
  total_questions: number;
  total_modules: number;
  modules: Record<string, {
    version: string;
    path: string;
    last_updated: string;
  }>;
  module_metadata?: any[];
}

export const OfflineContentService = {
  // Check if offline content is available
  isAvailable(): boolean {
    return getPlatformOS() !== 'web' && !offlineContentDisabled && fileSystemAvailable;
  },

  // Initialize directory safely
  async init(): Promise<boolean> {
    if (getPlatformOS() === 'web' || offlineContentDisabled) return false;

    try {
      const fs = await getFileSystem();
      if (!fs) return false;

      const offlineDir = await getOfflineDir();
      if (!offlineDir) return false;

      const dirInfo = await fs.getInfoAsync(offlineDir);
      if (!dirInfo.exists) {
        await fs.makeDirectoryAsync(offlineDir, { intermediates: true });
      }
      return true;
    } catch (error) {
      recordFailure(error);
      if (__DEV__) {
        console.warn('[OfflineContent] Failed to initialize directory:', error);
      }
      return false;
    }
  },

  // Check for updates safely
  async checkForUpdates(): Promise<{ hasUpdate: boolean; remoteVersion: OfflineVersion | null; error?: string }> {
    if (getPlatformOS() === 'web' || offlineContentDisabled) {
      return { hasUpdate: false, remoteVersion: null };
    }

    try {
      const fs = await getFileSystem();
      if (!fs) {
        return { hasUpdate: false, remoteVersion: null, error: 'FileSystem not available' };
      }

      const initialized = await this.init();
      if (!initialized) {
        return { hasUpdate: false, remoteVersion: null, error: 'Failed to initialize' };
      }

      const offlineDir = await getOfflineDir();
      if (!offlineDir) {
        return { hasUpdate: false, remoteVersion: null, error: 'Directory not available' };
      }

      // Get remote version with timeout using public URL (works in React Native)
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 10000)
      );

      // Use getPublicUrl + fetch instead of download (blob.text() doesn't work in RN)
      const { data: urlData } = supabase.storage
        .from('questions')
        .getPublicUrl('version.json');

      const fetchPromise = fetch(urlData.publicUrl).then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      });

      const remoteVersion: OfflineVersion = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]) as OfflineVersion;

      // Get local version
      const versionFile = offlineDir + 'version.json';
      const localVersionInfo = await fs.getInfoAsync(versionFile);
      if (!localVersionInfo.exists) {
        return { hasUpdate: true, remoteVersion };
      }

      const localVersionContent = await fs.readAsStringAsync(versionFile);
      const localVersion: OfflineVersion = JSON.parse(localVersionContent);

      const remoteDate = new Date(remoteVersion.last_updated).getTime();
      const localDate = new Date(localVersion.last_updated).getTime();

      return { hasUpdate: remoteDate > localDate, remoteVersion };
    } catch (error: any) {
      recordFailure(error);
      if (__DEV__) {
        console.warn('[OfflineContent] Check for updates failed:', error);
      }
      return { hasUpdate: false, remoteVersion: null, error: error?.message || 'Unknown error' };
    }
  },

  // Download all updates safely
  async downloadUpdates(onProgress?: (progress: number) => void): Promise<void> {
    if (getPlatformOS() === 'web' || offlineContentDisabled) return;

    try {
      const fs = await getFileSystem();
      if (!fs) return;

      const { remoteVersion } = await this.checkForUpdates();
      if (!remoteVersion) return;

      const offlineDir = await getOfflineDir();
      if (!offlineDir) return;

      const modules = Object.values(remoteVersion.modules);
      const total = modules.length;
      let completed = 0;

      for (const mod of modules) {
        try {
          const { data: { publicUrl } } = supabase.storage
            .from('questions')
            .getPublicUrl(mod.path);

          const localPath = offlineDir + mod.path.replace(/\//g, '_');
          await fs.downloadAsync(publicUrl, localPath);

          completed++;
          if (onProgress) onProgress(completed / total);
        } catch (moduleError) {
          // Skip failed modules but continue with others
          if (__DEV__) {
            console.warn(`[OfflineContent] Failed to download module ${mod.path}:`, moduleError);
          }
        }
      }

      // Save new version file
      const versionFile = offlineDir + 'version.json';
      await fs.writeAsStringAsync(versionFile, JSON.stringify(remoteVersion));
    } catch (error) {
      recordFailure(error);
      if (__DEV__) {
        console.warn('[OfflineContent] Download updates failed:', error);
      }
    }
  },

  // Get content for a specific module safely
  async getModuleContent(moduleName: string, year?: number): Promise<ModuleData | null> {
    if (getPlatformOS() === 'web' || offlineContentDisabled) return null;

    try {
      const fs = await getFileSystem();
      if (!fs) return null;

      const offlineDir = await getOfflineDir();
      if (!offlineDir) return null;

      const normalizedModuleName = normalizeForFilePath(moduleName);
      let filename = '';

      if (year) {
        filename = `year${year}_${normalizedModuleName}.json`;
      } else {
        const initialized = await this.init();
        if (!initialized) return null;

        const files = await fs.readDirectoryAsync(offlineDir);
        const match = files.find(f => f.includes(`_${normalizedModuleName}.json`));
        if (!match) return null;
        filename = match;
      }

      const localPath = offlineDir + filename;
      const info = await fs.getInfoAsync(localPath);
      if (!info.exists) return null;

      const content = await fs.readAsStringAsync(localPath);
      return JSON.parse(content);
    } catch (error) {
      if (__DEV__) {
        console.warn(`[OfflineContent] Failed to load module ${moduleName}:`, error);
      }
      return null;
    }
  },

  // Get local version safely
  async getLocalVersion(): Promise<OfflineVersion | null> {
    if (getPlatformOS() === 'web' || offlineContentDisabled) return null;

    try {
      const fs = await getFileSystem();
      if (!fs) return null;

      const offlineDir = await getOfflineDir();
      if (!offlineDir) return null;

      const versionFile = offlineDir + 'version.json';
      const info = await fs.getInfoAsync(versionFile);
      if (!info.exists) return null;

      const content = await fs.readAsStringAsync(versionFile);
      return JSON.parse(content);
    } catch (error) {
      if (__DEV__) {
        console.warn('[OfflineContent] Failed to get local version:', error);
      }
      return null;
    }
  },

  // Build module metadata from downloaded content files
  async buildModuleMetadataFromFiles(): Promise<any[]> {
    if (getPlatformOS() === 'web' || offlineContentDisabled) return [];

    try {
      const fs = await getFileSystem();
      if (!fs) return [];

      const initialized = await this.init();
      if (!initialized) return [];

      const offlineDir = await getOfflineDir();
      if (!offlineDir) return [];

      const files = await fs.readDirectoryAsync(offlineDir);
      const moduleFiles = files.filter(f => f.endsWith('.json') && f !== 'version.json');

      const modules: any[] = [];

      for (const filename of moduleFiles) {
        try {
          const content = await fs.readAsStringAsync(offlineDir + filename);
          const data = JSON.parse(content);

          if (data.module && data.study_year) {
            const id = `offline_${data.module.toLowerCase().replace(/\s+/g, '_')}`;
            modules.push({
              id: id,
              name: data.module,
              year: String(data.study_year),
              type: 'module',
              question_count: data.questions?.length || 0,
              _filename: filename
            });
          }
        } catch (e) {
          // Skip invalid files
        }
      }

      return modules;
    } catch (error) {
      if (__DEV__) {
        console.warn('[OfflineContent] Failed to build module metadata:', error);
      }
      return [];
    }
  },

  // Get Module Metadata by ID
  async getModuleById(id: string): Promise<any | null> {
    if (getPlatformOS() === 'web' || offlineContentDisabled) return null;

    try {
      const version = await this.getLocalVersion();

      if (version?.module_metadata && version.module_metadata.length > 0) {
        const moduleById = version.module_metadata.find((m: any) => m.id === id);
        if (moduleById) return moduleById;

        const moduleByName = version.module_metadata.find((m: any) =>
          m.name === id ||
          m.name?.toLowerCase().replace(/\s+/g, '_') === id.toLowerCase() ||
          id.includes(m.id)
        );
        if (moduleByName) return moduleByName;
      }

      const builtModules = await this.buildModuleMetadataFromFiles();
      if (builtModules.length > 0) {
        const found = builtModules.find((m: any) =>
          m.id === id ||
          m.name === id ||
          m.name?.toLowerCase().replace(/\s+/g, '_') === id.toLowerCase()
        );
        if (found) return found;
      }

      return null;
    } catch (error) {
      return null;
    }
  },

  // Get All Modules Metadata
  async getAllModules(): Promise<any[]> {
    if (getPlatformOS() === 'web' || offlineContentDisabled) return [];

    try {
      const version = await this.getLocalVersion();

      if (version?.module_metadata && version.module_metadata.length > 0) {
        return version.module_metadata;
      }

      return await this.buildModuleMetadataFromFiles();
    } catch (error) {
      return [];
    }
  },

  // Get Modules by Year
  async getModulesByYear(year: string): Promise<any[]> {
    if (getPlatformOS() === 'web' || offlineContentDisabled) return [];

    try {
      const version = await this.getLocalVersion();

      if (version?.module_metadata && version.module_metadata.length > 0) {
        return version.module_metadata.filter((m: any) => String(m.year) === String(year));
      }

      const builtModules = await this.buildModuleMetadataFromFiles();
      return builtModules.filter((m: any) => String(m.year) === String(year));
    } catch (error) {
      return [];
    }
  }
};
