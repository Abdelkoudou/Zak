import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { supabase } from './supabase';

const OFFLINE_DIR = FileSystem.documentDirectory + 'offline_content/';
const VERSION_FILE = OFFLINE_DIR + 'version.json';

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
        path: string; // Remote path
        last_updated: string;
    }>;
}

export const OfflineContentService = {
    // Initialize directory
    async init() {
        if (Platform.OS === 'web') return;
        const dirInfo = await FileSystem.getInfoAsync(OFFLINE_DIR);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(OFFLINE_DIR, { intermediates: true });
        }
    },

    // Check for updates
    async checkForUpdates(): Promise<{ hasUpdate: boolean; remoteVersion: OfflineVersion | null; error?: string }> {
        if (Platform.OS === 'web') return { hasUpdate: false, remoteVersion: null, error: 'Not available on web' };
        try {
            await this.init();

            // Get remote version
            const { data, error } = await supabase.storage
                .from('questions')
                .download('version.json');

            if (error) throw error;

            const text = await data.text();
            const remoteVersion: OfflineVersion = JSON.parse(text);

            // Get local version
            const localVersionInfo = await FileSystem.getInfoAsync(VERSION_FILE);
            if (!localVersionInfo.exists) {
                return { hasUpdate: true, remoteVersion };
            }

            const localVersionContent = await FileSystem.readAsStringAsync(VERSION_FILE);
            const localVersion: OfflineVersion = JSON.parse(localVersionContent);

            // Compare dates or versions
            // Simple comparison: if remote last_updated is newer than local
            const remoteDate = new Date(remoteVersion.last_updated).getTime();
            const localDate = new Date(localVersion.last_updated).getTime();

            return { hasUpdate: remoteDate > localDate, remoteVersion };
        } catch (error: any) {
            console.error('Check for updates failed:', error);
            return { hasUpdate: false, remoteVersion: null, error: error.message || 'Unknown error' };
        }
    },

    // Download all updates
    async downloadUpdates(onProgress?: (progress: number) => void): Promise<void> {
        if (Platform.OS === 'web') return;
        try {
            const { remoteVersion } = await this.checkForUpdates();
            if (!remoteVersion) return;

            const modules = Object.values(remoteVersion.modules);
            const total = modules.length;
            let completed = 0;

            for (const mod of modules) {
                // Construct the public URL for the file
                // Or leverage supabase.storage.download if we want to handle auth, but this bucket is public
                // We can use createSignedUrl if private, or getPublicUrl if public.
                // Assuming public for instant access as per plan.
                const { data: { publicUrl } } = supabase.storage
                    .from('questions')
                    .getPublicUrl(mod.path);

                // Define local path (sanitize path just in case, though mod.path is usually safe 'year/mod.json')
                const localPath = OFFLINE_DIR + mod.path.replace(/\//g, '_');

                // Download
                await FileSystem.downloadAsync(publicUrl, localPath);

                completed++;
                if (onProgress) onProgress(completed / total);
            }

            // Save new version file
            await FileSystem.writeAsStringAsync(VERSION_FILE, JSON.stringify(remoteVersion));
        } catch (error) {
            console.error('Download updates failed:', error);
            throw error;
        }
    },

    // Get content for a specific module
    async getModuleContent(moduleName: string, year?: number): Promise<ModuleData | null> {
        if (Platform.OS === 'web') return null;

        try {
            const normalizedModuleName = moduleName.toLowerCase().replace(/\s+/g, '_');
            let filename = '';

            if (year) {
                filename = `year${year}_${normalizedModuleName}.json`;
            } else {
                // Search for file
                await this.init();
                const files = await FileSystem.readDirectoryAsync(OFFLINE_DIR);
                const match = files.find(f => f.includes(`_${normalizedModuleName}.json`));
                if (!match) return null;
                filename = match;
            }

            const localPath = OFFLINE_DIR + filename;
            const info = await FileSystem.getInfoAsync(localPath);
            if (!info.exists) return null;

            const content = await FileSystem.readAsStringAsync(localPath);
            return JSON.parse(content);
        } catch (error) {
            console.error(`Failed to load local module ${moduleName}:`, error);
            return null;
        }
    },

    // Get all locally available modules
    async getLocalVersion(): Promise<OfflineVersion | null> {
        if (Platform.OS === 'web') return null;

        try {
            const info = await FileSystem.getInfoAsync(VERSION_FILE);
            if (!info.exists) return null;
            const content = await FileSystem.readAsStringAsync(VERSION_FILE);
            return JSON.parse(content);
        } catch (e) {
            return null;
        }
    }
};
