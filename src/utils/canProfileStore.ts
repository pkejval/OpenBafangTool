import fs from 'fs';
import path from 'path';
import log from 'electron-log/renderer';
import { deepCopy } from 'deep-copy-ts';
import {
    BafangCanControllerParameter1,
    BafangCanControllerParameter2,
    BafangCanControllerSpeedParameters,
} from '../types/BafangCanSystemTypes';

export const CAN_CONTROLLER_PROFILE_KIND = 'open-bafang-tool.can-controller-profile';
const CAN_CONTROLLER_PROFILE_VERSION = 1;
const CAN_CONTROLLER_PROFILE_DIR = path.join(
    process.cwd(),
    'profiles',
    'can-controller',
);

export type CanControllerProfileState = {
    parameter1: BafangCanControllerParameter1 | null;
    parameter2: BafangCanControllerParameter2 | null;
    parameter3: BafangCanControllerSpeedParameters | null;
    manufacturer: string | null;
};

export type CanControllerProfileFile = {
    kind: string;
    version: number;
    name: string;
    savedAt: string;
    controller: CanControllerProfileState;
};

export type CanControllerProfileSummary = {
    fileName: string;
    name: string;
    savedAt: string;
};

function ensureProfileDir(): void {
    if (!fs.existsSync(CAN_CONTROLLER_PROFILE_DIR)) {
        fs.mkdirSync(CAN_CONTROLLER_PROFILE_DIR, { recursive: true });
    }
}

function normalizeProfileName(profileName: string): string {
    const trimmed = profileName.trim();
    const sanitized = trimmed
        .replace(/\.json$/i, '')
        .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
        .replace(/\s+/g, ' ')
        .trim();
    return sanitized || 'profile';
}

function profileFilePath(fileName: string): string {
    return path.join(CAN_CONTROLLER_PROFILE_DIR, `${fileName}.json`);
}

export function listCanControllerProfiles(): CanControllerProfileSummary[] {
    try {
        ensureProfileDir();
        return fs
            .readdirSync(CAN_CONTROLLER_PROFILE_DIR)
            .filter((file) => file.toLowerCase().endsWith('.json'))
            .map((fileName) => {
                try {
                    const filePath = path.join(
                        CAN_CONTROLLER_PROFILE_DIR,
                        fileName,
                    );
                    const parsed = JSON.parse(
                        fs.readFileSync(filePath, 'utf-8'),
                    ) as Partial<CanControllerProfileFile>;
                    if (
                        parsed.kind !== CAN_CONTROLLER_PROFILE_KIND ||
                        !parsed.name ||
                        !parsed.savedAt
                    ) {
                        return null;
                    }
                    return {
                        fileName: fileName.replace(/\.json$/i, ''),
                        name: parsed.name,
                        savedAt: parsed.savedAt,
                    };
                } catch (error) {
                    log.error('Failed to read CAN controller profile', error);
                    return null;
                }
            })
            .filter(
                (
                    profile,
                ): profile is CanControllerProfileSummary => profile !== null,
            )
            .sort(
                (left, right) =>
                    new Date(right.savedAt).getTime() -
                    new Date(left.savedAt).getTime(),
            );
    } catch (error) {
        log.error('Failed to list CAN controller profiles', error);
        return [];
    }
}

export function readCanControllerProfile(
    fileName: string,
): CanControllerProfileFile {
    ensureProfileDir();
    const profile = JSON.parse(
        fs.readFileSync(profileFilePath(fileName), 'utf-8'),
    ) as CanControllerProfileFile;
    if (profile.kind !== CAN_CONTROLLER_PROFILE_KIND || !profile.controller) {
        throw new Error('Invalid profile type.');
    }
    return profile;
}

export function saveCanControllerProfile(
    name: string,
    controller: CanControllerProfileState,
): CanControllerProfileSummary {
    const displayName = name.trim();
    const normalizedName = normalizeProfileName(name);
    const savedAt = new Date().toISOString();
    const profile: CanControllerProfileFile = {
        kind: CAN_CONTROLLER_PROFILE_KIND,
        version: CAN_CONTROLLER_PROFILE_VERSION,
        name: displayName,
        savedAt,
        controller: deepCopy(controller),
    };

    ensureProfileDir();
    fs.writeFileSync(
        profileFilePath(normalizedName),
        JSON.stringify(profile, null, 2),
        'utf-8',
    );

    return {
        fileName: normalizedName,
        name: displayName,
        savedAt,
    };
}
