import { AutoDetectTypes } from '@serialport/bindings-cpp';
import { SerialPort } from 'serialport';
import filterPorts from './serial-patcher';

const ports: {
    [id: string]: SerialPort<AutoDetectTypes>;
} = {};

export async function getSerialPorts(): Promise<string[]> {
    return filterPorts(
        (await SerialPort.list()).map((port) => port.path),
        true,
    );
}

export function openPort(
    path: string,
    baudRate: number,
    onOpen: () => void,
    onError: (err: Error | null) => void,
    onData: (path: string, data: Buffer) => void,
): Promise<boolean> {
    if (ports[path]?.isOpen) {
        return Promise.resolve(true);
    }
    if (ports[path]) {
        try {
            ports[path].removeAllListeners();
            ports[path].close();
        } catch (error) {
            delete ports[path];
        }
    }
    ports[path] = new SerialPort({ path, baudRate, autoOpen: false });
    return new Promise<boolean>((resolve) => {
        const port = ports[path];
        if (!port) {
            resolve(false);
            return;
        }
        port.once('open', () => {
            onOpen();
            resolve(true);
        });
        port.once('error', (err) => {
            onError(err as Error);
            delete ports[path];
            resolve(false);
        });
        port.on('readable', () => {
            const chunk = port.read();
            if (chunk) onData(path, chunk);
        });
        port.open((err) => {
            if (err) {
                onError(err);
                delete ports[path];
                resolve(false);
            }
        });
    });
}

export async function writeToPort(
    path: string,
    message: Buffer,
): Promise<void> {
    ports[path]?.write(message);
}

export function closePort(path: string): void {
    if (ports[path]?.isOpen) {
        ports[path]?.close();
        delete ports[path];
    }
}
