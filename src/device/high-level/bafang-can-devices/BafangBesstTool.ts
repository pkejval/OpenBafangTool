import EventEmitter from 'events';
import {
    getBesstHVDemo,
    getBesstSNDemo,
    getBesstSVDemo,
} from '../../../utils/can/demo_object_provider';
import BesstDevice from '../../besst/besst';

export default class BafangBesstTool {
    private besstDevice?: BesstDevice;

    public emitter: EventEmitter;

    private readingInProgress: boolean = false;

    private demo: boolean;

    private serial_number: string | null = null;

    private hardware_version: string | null = null;

    private software_version: string | null = null;

    private onDeviceDisconnect: () => void;

    constructor(demo: boolean, besstDevice?: BesstDevice) {
        if (demo) {
            this.serial_number = getBesstSNDemo();
            this.software_version = getBesstSVDemo();
            this.hardware_version = getBesstHVDemo();
        }
        this.demo = demo;
        this.besstDevice = besstDevice;
        this.emitter = new EventEmitter();
        this.onDeviceDisconnect = this.onDeviceDisconnectImpl.bind(this);
    }

    public connect() {
        this.detachDeviceListeners();
        this.besstDevice?.emitter.on('disconnection', this.onDeviceDisconnect);
    }

    private detachDeviceListeners(): void {
        this.besstDevice?.emitter.removeListener(
            'disconnection',
            this.onDeviceDisconnect,
        );
    }

    private onDeviceDisconnectImpl(): void {
        this.detachDeviceListeners();
        this.besstDevice = undefined;
        this.readingInProgress = false;
    }

    public loadData(): void {
        if (this.demo) {
            console.log('Demo mode: blank data loaded');
            this.emitter.emit('read-finish', 3, 0);
            return;
        }
        if (this.readingInProgress) return;
        this.readingInProgress = true;
        let finishedSuccessfull = 0,
            finishedNonSuccessfull = 0;
        if (!this.besstDevice) {
            this.readingInProgress = false;
            this.emitter.emit('read-finish', 0, 3);
            return;
        }
        const finish = (success: boolean) => {
            if (success) finishedSuccessfull++;
            else finishedNonSuccessfull++;
            if (finishedSuccessfull + finishedNonSuccessfull >= 3) {
                this.readingInProgress = false;
                this.emitter.emit(
                    'read-finish',
                    finishedSuccessfull,
                    finishedNonSuccessfull,
                );
            }
        };
        this.besstDevice
            ?.getSerialNumber()
            .then((serial_number: string) => {
                if (serial_number === undefined) return;
                this.serial_number = serial_number;
                this.emitter.emit('data-sn', serial_number);
                finish(true);
            })
            .catch(() => {
                finish(false);
            });
        this.besstDevice
            ?.getSoftwareVersion()
            .then((software_version: string) => {
                if (software_version === undefined) return;
                this.software_version = software_version;
                this.emitter.emit('data-sv', software_version);
                finish(true);
            })
            .catch(() => {
                finish(false);
            });
        this.besstDevice
            ?.getHardwareVersion()
            .then((hardware_version: string) => {
                if (hardware_version === undefined) return;
                this.hardware_version = hardware_version;
                this.emitter.emit('data-hv', hardware_version);
                finish(true);
            })
            .catch(() => {
                finish(false);
            });
    }

    public get serialNumber(): string | null {
        return this.serial_number;
    }

    public get hardwareVersion(): string | null {
        return this.hardware_version;
    }

    public get softwareVersion(): string | null {
        return this.software_version;
    }
}
