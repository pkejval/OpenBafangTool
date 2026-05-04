import fs from 'fs';
import path from 'path';
import log from 'electron-log/renderer';
import { deepCopy } from 'deep-copy-ts';
import {
    BafangUartMotorBasicParameters,
    BafangUartMotorInfo,
    BafangUartMotorPedalParameters,
    BafangUartMotorThrottleParameters,
} from '../types/BafangUartMotorTypes';

const UART_PROFILE_KIND = 'open-bafang-tool.uart-motor-profile';
const UART_PROFILE_VERSION = 1;
const UART_PROFILE_DIR = path.join(process.cwd(), 'profiles', 'uart-motor');

export type UartMotorProfileState = {
    info: BafangUartMotorInfo;
    basic_parameters: BafangUartMotorBasicParameters;
    pedal_parameters: BafangUartMotorPedalParameters;
    throttle_parameters: BafangUartMotorThrottleParameters;
    oldStyle: boolean;
};

export type UartMotorProfileFile = {
    kind: string;
    version: number;
    name: string;
    savedAt: string;
    motor: UartMotorProfileState;
};

export type UartMotorProfileSummary = {
    fileName: string;
    name: string;
    savedAt: string;
};

function ensureProfileDir(): void {
    if (!fs.existsSync(UART_PROFILE_DIR)) {
        fs.mkdirSync(UART_PROFILE_DIR, { recursive: true });
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
    return path.join(UART_PROFILE_DIR, `${fileName}.json`);
}

export function listUartMotorProfiles(): UartMotorProfileSummary[] {
    try {
        ensureProfileDir();
        return fs
            .readdirSync(UART_PROFILE_DIR)
            .filter((file) => file.toLowerCase().endsWith('.json'))
            .map((fileName) => {
                try {
                    const filePath = path.join(UART_PROFILE_DIR, fileName);
                    const parsed = JSON.parse(
                        fs.readFileSync(filePath, 'utf-8'),
                    ) as Partial<UartMotorProfileFile>;
                    if (
                        parsed.kind !== UART_PROFILE_KIND ||
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
                    log.error('Failed to read UART profile', error);
                    return null;
                }
            })
            .filter((profile): profile is UartMotorProfileSummary => profile !== null)
            .sort(
                (left, right) =>
                    new Date(right.savedAt).getTime() -
                    new Date(left.savedAt).getTime(),
            );
    } catch (error) {
        log.error('Failed to list UART profiles', error);
        return [];
    }
}

export function readUartMotorProfile(fileName: string): UartMotorProfileFile {
    ensureProfileDir();
    const profile = JSON.parse(
        fs.readFileSync(profileFilePath(fileName), 'utf-8'),
    ) as UartMotorProfileFile;
    if (profile.kind !== UART_PROFILE_KIND || !profile.motor) {
        throw new Error('Invalid profile type.');
    }
    return profile;
}

export function saveUartMotorProfile(
    name: string,
    motor: UartMotorProfileState,
): UartMotorProfileSummary {
    const displayName = name.trim();
    const normalizedName = normalizeProfileName(name);
    const savedAt = new Date().toISOString();
    const profile: UartMotorProfileFile = {
        kind: UART_PROFILE_KIND,
        version: UART_PROFILE_VERSION,
        name: displayName,
        savedAt,
        motor: deepCopy(motor),
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
