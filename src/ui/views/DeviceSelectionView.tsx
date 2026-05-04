import React from 'react';
import { Button, Form, Select, Typography, Space, message } from 'antd';
import { SerialPort } from 'serialport';
import HID from 'node-hid';
import IConnection from '../../device/high-level/Connection';
import BafangUartMotor from '../../device/high-level/BafangUartMotor';
import BafangCanSystem from '../../device/high-level/BafangCanSystem';
import {
    DeviceBrand,
    DeviceInterface,
    DeviceType,
} from '../../types/DeviceType';
import InterfaceType from '../../types/InterfaceType';
import filterPorts from '../../device/serial/serial-patcher';
import { listBesstDevices } from '../../device/besst/besst';
import i18n from '../../i18n/i18n';

const { Option } = Select;

type DeviceSelectionProps = {
    deviceSelectionHook: (
        connection: IConnection,
        interfaceType: InterfaceType,
    ) => Promise<boolean>;
};

type DeviceSelectionState = {
    portList: string[];
    besstDeviceList: HID.Device[];
    connectionChecked: boolean;
    connection: IConnection | null;
    interfaceType: InterfaceType | null;
    deviceBrand: DeviceBrand | null;
    deviceInterface: DeviceInterface | null;
    deviceType: DeviceType | null;
    devicePort: string | null;
    checkingConnection: boolean;
};

class DeviceSelectionView extends React.Component<
    DeviceSelectionProps,
    DeviceSelectionState
> {
    private pollTimer?: ReturnType<typeof setInterval>;

    private isMounted = false;

    constructor(props: DeviceSelectionProps) {
        super(props);
        this.state = {
            portList: [],
            besstDeviceList: [],
            connectionChecked: false,
            connection: null,
            interfaceType: null,
            deviceBrand: DeviceBrand.Bafang,
            deviceInterface: null,
            deviceType: null,
            devicePort: null,
            checkingConnection: false,
        };
    }

    componentDidMount(): void {
        this.isMounted = true;
        void this.refreshDeviceLists();
        this.pollTimer = setInterval(() => {
            void this.refreshDeviceLists();
        }, 1000);
    }

    componentWillUnmount(): void {
        this.isMounted = false;
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = undefined;
        }
    }

    private async refreshDeviceLists(): Promise<void> {
        try {
            const ports = await SerialPort.list();
            if (!this.isMounted) return;
            this.setState({
                portList: filterPorts(
                    ports.map((port) => port.path),
                    true,
                ),
                besstDeviceList: listBesstDevices(),
            });
        } catch (error) {
            if (!this.isMounted) return;
            this.setState({
                portList: [],
                besstDeviceList: [],
            });
        }
    }

    render() {
        const { deviceSelectionHook } = this.props;
        const {
            portList,
            besstDeviceList,
            connectionChecked,
            checkingConnection,
            connection,
            interfaceType,
            deviceBrand,
            deviceInterface,
            deviceType,
            devicePort,
        } = this.state;

        const portComponents = portList.map((item) => {
            return (
                <Option value={item} key={item}>
                    {item}
                </Option>
            );
        });

        return (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Form
                    name="device-selection"
                    onFinish={async () => {
                        await deviceSelectionHook(
                            connection as IConnection,
                            interfaceType as InterfaceType,
                        );
                    }}
                >
                    <Typography.Title level={3}>
                        {i18n.t('select_device')}
                    </Typography.Title>
                    <Form.Item
                        name="device_interface"
                        label={i18n.t('device_protocol')}
                        rules={[
                            {
                                required: true,
                                message: i18n.t('protocol_required'),
                            },
                        ]}
                    >
                        <Select
                            onChange={(value: DeviceInterface) => {
                                if (value === DeviceInterface.CAN) {
                                    this.setState({
                                        deviceInterface: value,
                                        interfaceType: InterfaceType.Full,
                                        connectionChecked: false,
                                    });
                                } else {
                                    this.setState({
                                        deviceInterface: value,
                                        interfaceType: null,
                                        connectionChecked: false,
                                    });
                                }
                                this.setState({
                                    deviceType: DeviceType.Motor,
                                    connectionChecked: false,
                                });
                            }}
                            allowClear
                            style={{ minWidth: '150px' }}
                        >
                            <Option value={DeviceInterface.UART}>UART</Option>
                            <Option value={DeviceInterface.CAN}>CAN</Option>
                        </Select>
                    </Form.Item>
                    {deviceInterface === DeviceInterface.UART && (
                        <Form.Item
                            name="interface_type"
                            label={i18n.t('interface_type')}
                            rules={[
                                {
                                    required: true,
                                    message: i18n.t('interface_type_required'),
                                },
                            ]}
                        >
                            <Select
                                onChange={(value: InterfaceType) => {
                                    this.setState({
                                        interfaceType: value,
                                        connectionChecked: false,
                                    });
                                }}
                                allowClear
                                style={{ minWidth: '150px' }}
                            >
                                <Option value={InterfaceType.Simplified}>
                                    {i18n.t('simplified_ui')}
                                </Option>
                                <Option value={InterfaceType.Full}>
                                    {i18n.t('full_featured_ui')}
                                </Option>
                            </Select>
                        </Form.Item>
                    )}
                    {deviceInterface === DeviceInterface.UART && (
                        <Form.Item
                            name="port"
                            label={i18n.t('serial_port')}
                            rules={[
                                {
                                    required: true,
                                    message: i18n.t('port_required'),
                                },
                            ]}
                        >
                            <Select
                                onChange={(value: string) => {
                                    this.setState({
                                        devicePort: value,
                                        connectionChecked: false,
                                    });
                                }}
                                allowClear
                                style={{ minWidth: '150px' }}
                            >
                                <Option value="demo">
                                    {i18n.t('demo_device')}
                                </Option>
                                {portComponents}
                            </Select>
                        </Form.Item>
                    )}
                    {deviceInterface === DeviceInterface.CAN && (
                        <Form.Item
                            name="usb_device"
                            label={i18n.t('usb_device')}
                            rules={[
                                {
                                    required: true,
                                    message: i18n.t('usb_required'),
                                },
                            ]}
                        >
                            <Select
                                onChange={(value: string) => {
                                    this.setState({
                                        devicePort: value,
                                        connectionChecked: false,
                                    });
                                }}
                                allowClear
                                style={{ minWidth: '150px' }}
                            >
                                <Option value="demo">
                                    {i18n.t('demo_device')}
                                </Option>
                                {besstDeviceList.map((item) => {
                                    return (
                                        <Option
                                            value={item.path}
                                            key={item.path}
                                        >
                                            {item.product}
                                        </Option>
                                    );
                                })}
                            </Select>
                        </Form.Item>
                    )}
                    <Form.Item>
                        <Space>
                            <Button
                                type="primary"
                                loading={checkingConnection}
                                onClick={async () => {
                                    let newConnection: IConnection;
                                    if (checkingConnection) return;
                                    this.setState({
                                        checkingConnection: true,
                                        connectionChecked: false,
                                    });
                                    if (
                                        deviceBrand === DeviceBrand.Bafang &&
                                        deviceInterface ===
                                            DeviceInterface.UART &&
                                        deviceType === DeviceType.Motor &&
                                        devicePort !== null
                                    ) {
                                        newConnection = new BafangUartMotor(
                                            devicePort,
                                        );
                                    } else if (
                                        deviceBrand === DeviceBrand.Bafang &&
                                        deviceInterface ===
                                            DeviceInterface.CAN &&
                                        devicePort !== null
                                    ) {
                                        newConnection = new BafangCanSystem(
                                            devicePort,
                                        );
                                    } else {
                                        message.info(
                                            'This kind of device is not supported yet',
                                        );
                                        this.setState({
                                            checkingConnection: false,
                                        });
                                        return;
                                    }
                                    try {
                                        const result = await newConnection.testConnection();
                                        if (result) {
                                            this.setState({
                                                connection: newConnection,
                                                connectionChecked: true,
                                                checkingConnection: false,
                                            });
                                        } else {
                                            message.error('Connection error!');
                                            this.setState({
                                                connectionChecked: false,
                                                checkingConnection: false,
                                            });
                                        }
                                    } catch (error) {
                                        this.setState({
                                            connectionChecked: false,
                                            checkingConnection: false,
                                        });
                                        message.error('Connection error!');
                                    }
                                }}
                                disabled={
                                    deviceBrand === null ||
                                    devicePort === null ||
                                    deviceInterface === null ||
                                    (deviceBrand === DeviceBrand.Bafang &&
                                        deviceInterface ===
                                            DeviceInterface.UART &&
                                        deviceType === null) ||
                                    interfaceType === null ||
                                    checkingConnection
                                }
                            >
                                {i18n.t('check_connection')}
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                disabled={!connectionChecked}
                            >
                                {i18n.t('select')}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </div>
        );
    }
}

export default DeviceSelectionView;
