import React from 'react';
import {
    InfoCircleOutlined,
    SettingOutlined,
    BookOutlined,
    ArrowLeftOutlined,
    CarOutlined,
    DesktopOutlined,
    RotateRightOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';
import { Layout, Menu, Modal, Spin, message } from 'antd';
import IConnection from '../../device/high-level/Connection';
import BafangUartMotor from '../../device/high-level/BafangUartMotor';
import { DocPages } from '../../docs/document_resolver';
import InterfaceType from '../../types/InterfaceType';
import BafangCanSystem from '../../device/high-level/BafangCanSystem';
import { DeviceName } from '../../types/DeviceType';
import i18n from '../../i18n/i18n';

const BafangUartMotorSettingsSimplifiedView = React.lazy(
    () =>
        import(
            '../panels/bafang/uart/simplified/BafangUartMotorSettingsSimplifiedView'
        ),
);
const BafangUartMotorInfoView = React.lazy(
    () => import('../panels/bafang/uart/full/BafangUartMotorInfoView'),
);
const BafangUartMotorSettingsView = React.lazy(
    () => import('../panels/bafang/uart/full/BafangUartMotorSettingsView'),
);
const BafangCanSystemInfoView = React.lazy(
    () => import('../panels/bafang/can/full/BafangCanSystemInfoView'),
);
const BafangCanMotorSettingsView = React.lazy(
    () => import('../panels/bafang/can/full/BafangCanMotorSettingsView'),
);
const BafangCanDisplaySettingsView = React.lazy(
    () => import('../panels/bafang/can/full/BafangCanDisplaySettingsView'),
);
const BafangCanSensorSettingsView = React.lazy(
    () => import('../panels/bafang/can/full/BafangCanSensorSettingsView'),
);
const BafangCanBatteryView = React.lazy(
    () => import('../panels/bafang/can/full/BafangCanBatteryView'),
);
const DocumentationView = React.lazy(
    () => import('../panels/common/DocumentationView'),
);

const { Sider } = Layout;

type MainProps = {
    connection: IConnection;
    interfaceType: InterfaceType;
    backHook: () => void;
};

type MainState = {
    tab: string;
    loading: boolean;
};

const initial_tab_table = {
    bafang_uart_motor: {
        simplified: 'bafang_uart_motor_settings_simplified',
        full: 'bafang_uart_motor_info',
    },
    bafang_uart_display: {
        simplified: 'bafang_motor_manual',
        full: 'bafang_motor_manual',
    },
    bafang_can_system: {
        simplified: 'bafang_motor_manual',
        full: 'bafang_can_system_info',
    },
};

class MainView extends React.Component<MainProps, MainState> {
    private loadingTimeout?: ReturnType<typeof setTimeout>;

    constructor(props: MainProps) {
        super(props);
        this.state = {
            tab: initial_tab_table[props.connection.deviceName][
                props.interfaceType
            ],
            loading: true,
        };
        this.switchTab = this.switchTab.bind(this);
        this.menuItems = this.menuItems.bind(this);
        this.onDisconnection = this.onDisconnection.bind(this);
        this.onReadFinish = this.onReadFinish.bind(this);
        this.clearLoadingTimeout = this.clearLoadingTimeout.bind(this);
        this.startLoadingWatchdog = this.startLoadingWatchdog.bind(this);
    }

    componentDidMount(): void {
        const { connection } = this.props;
        connection.emitter.on('disconnection', this.onDisconnection);
        connection.emitter.once('read-finish', this.onReadFinish);
        this.startLoadingWatchdog();
        connection.loadData();
    }

    componentWillUnmount(): void {
        const { connection } = this.props;
        connection.emitter.removeListener('disconnection', this.onDisconnection);
        connection.emitter.removeListener('read-finish', this.onReadFinish);
        this.clearLoadingTimeout();
    }

    private clearLoadingTimeout(): void {
        if (this.loadingTimeout) {
            clearTimeout(this.loadingTimeout);
            this.loadingTimeout = undefined;
        }
    }

    private startLoadingWatchdog(): void {
        this.clearLoadingTimeout();
        this.loadingTimeout = setTimeout(() => {
            if (this.state.loading) {
                this.setState({ loading: false });
                message.warning(i18n.t('loading_error'));
            }
        }, 120000);
    }

    private onDisconnection(): void {
        this.clearLoadingTimeout();
        this.setState({ loading: false });
        Modal.error({
            title: 'Connection error',
            content: i18n.t('device_disconnected'),
            onOk: this.props.backHook,
        });
    }

    private onReadFinish(
        readedSuccessfully: number,
        readedUnsuccessfully: number,
    ): void {
        this.clearLoadingTimeout();
        message.open({
            key: 'loading',
            type: 'info',
            content: i18n.t('loaded_x_parameters', {
                successfully: readedSuccessfully,
                nonSuccessfully: readedUnsuccessfully,
            }),
            duration: 5,
        });
        this.setState({ loading: false });
    }

    menuItems() {
        return {
            bafang_uart_motor: {
                simplified: [
                    {
                        key: 'back',
                        icon: <ArrowLeftOutlined />,
                        label: i18n.t('back'),
                    },
                    {
                        key: 'bafang_uart_motor_settings_simplified',
                        icon: <SettingOutlined />,
                        label: i18n.t('parameters_tab'),
                    },
                    {
                        key: 'bafang_uart_motor_manual',
                        icon: <BookOutlined />,
                        label: i18n.t('manual'),
                        children: [
                            {
                                key: `manual_${DocPages.BafangUartMotorGeneralManualDocument}`,
                                label: i18n.t('general_manual'),
                            },
                            {
                                key: `manual_${DocPages.BafangUartMotorParamsSimplifiedDocument}`,
                                label: i18n.t('parameters_manual'),
                            },
                        ],
                    },
                ],
                full: [
                    {
                        key: 'back',
                        icon: <ArrowLeftOutlined />,
                        label: i18n.t('controller'),
                    },
                    {
                        key: 'bafang_uart_motor_info',
                        icon: <InfoCircleOutlined />,
                        label: i18n.t('uart_main_tab_title'),
                    },
                    {
                        key: 'bafang_uart_motor_settings',
                        icon: <SettingOutlined />,
                        label: i18n.t('parameters_tab'),
                    },
                    {
                        key: 'bafang_uart_motor_manual',
                        icon: <BookOutlined />,
                        label: i18n.t('manual'),
                        children: [
                            {
                                key: `manual_${DocPages.BafangUartMotorGeneralManualDocument}`,
                                label: i18n.t('general_manual'),
                            },
                            {
                                key: `manual_${DocPages.BafangUartMotorParamsDocument}`,
                                label: i18n.t('parameters_manual'),
                            },
                            {
                                key: `manual_${DocPages.BafangUartMotorAPIDocument}`,
                                label: i18n.t('uart_motor_protocol_manual'),
                            },
                            {
                                key: `manual_${DocPages.BafangUartProtocolDocument}`,
                                label: i18n.t('uart_protocol_manual'),
                            },
                        ],
                    },
                ],
            },
            bafang_uart_display: {
                simplified: [
                    {
                        key: 'back',
                        icon: <ArrowLeftOutlined />,
                        label: i18n.t('controller'),
                    },
                    {
                        key: 'bafang_motor_manual',
                        icon: <BookOutlined />,
                        label: i18n.t('manual'),
                        children: [
                            {
                                key: `manual_${DocPages.BafangUartMotorGeneralManualDocument}`,
                                label: i18n.t('general_manual'),
                            },
                        ],
                    },
                ],
                full: [
                    {
                        key: 'back',
                        icon: <ArrowLeftOutlined />,
                        label: i18n.t('controller'),
                    },
                    {
                        key: 'bafang_motor_manual',
                        icon: <BookOutlined />,
                        label: i18n.t('manual'),
                        children: [
                            {
                                key: `manual_${DocPages.BafangUartMotorGeneralManualDocument}`,
                                label: i18n.t('general_manual'),
                            },
                        ],
                    },
                ],
            },
            bafang_can_system: {
                simplified: [
                    {
                        key: 'back',
                        icon: <ArrowLeftOutlined />,
                        label: i18n.t('controller'),
                    },
                    {
                        key: 'bafang_motor_manual',
                        icon: <BookOutlined />,
                        label: i18n.t('manual'),
                        children: [
                            {
                                key: `manual_${DocPages.BafangUartMotorGeneralManualDocument}`,
                                label: i18n.t('general_manual'),
                            },
                        ],
                    },
                ],
                full: [
                    {
                        key: 'back',
                        icon: <ArrowLeftOutlined />,
                        label: i18n.t('controller'),
                    },
                    {
                        key: 'bafang_can_system_info',
                        icon: <InfoCircleOutlined />,
                        label: i18n.t('can_main_tab_title'),
                    },
                    {
                        key: 'bafang_can_motor_settings',
                        icon: <CarOutlined />,
                        label: i18n.t('controller'),
                        disabled:
                            this.props.connection.deviceName ===
                                DeviceName.BafangCanSystem &&
                            !(this.props.connection as BafangCanSystem)
                                .controller.available,
                    },
                    {
                        key: 'bafang_can_display_settings',
                        icon: <DesktopOutlined />,
                        label: i18n.t('display'),
                        disabled:
                            this.props.connection.deviceName ===
                                DeviceName.BafangCanSystem &&
                            !(this.props.connection as BafangCanSystem).display
                                .available,
                    },
                    {
                        key: 'bafang_can_sensor_settings',
                        icon: <RotateRightOutlined />,
                        label: i18n.t('sensor'),
                        disabled:
                            this.props.connection.deviceName ===
                                DeviceName.BafangCanSystem &&
                            !(this.props.connection as BafangCanSystem).sensor
                                .available,
                    },
                    {
                        key: 'bafang_can_battery',
                        icon: <ThunderboltOutlined />,
                        label: i18n.t('battery'),
                        disabled:
                            this.props.connection.deviceName ===
                                DeviceName.BafangCanSystem &&
                            !(this.props.connection as BafangCanSystem).battery
                                ?.available,
                    },
                    {
                        key: 'bafang_can_motor_manual',
                        icon: <BookOutlined />,
                        label: i18n.t('manual'),
                        children: [
                            {
                                key: `manual_${DocPages.BafangUartMotorGeneralManualDocument}`,
                                label: i18n.t('general_manual'),
                            },
                        ],
                    },
                ],
            },
        };
    }

    switchTab(event: { key: string }) {
        if (event.key === 'back') {
            const { backHook } = this.props;
            backHook();
            return;
        }
        this.setState({ tab: event.key });
    }

    render() {
        const { connection, interfaceType } = this.props;
        const { tab, loading } = this.state;
        const loadingElement = (
            <Spin
                spinning
                style={{ height: '100%', width: '100%', marginTop: '100px' }}
            />
        );
        return (
            <Layout hasSider style={{ minHeight: '100vh' }}>
                <Spin spinning={loading} fullscreen />
                <Sider
                    width={240}
                    breakpoint="lg"
                    collapsedWidth={0}
                    style={{
                        overflow: 'auto',
                        paddingTop: '20px',
                    }}
                >
                    <div className="demo-logo-vertical" />
                    <Menu
                        theme="dark"
                        mode="inline"
                        defaultSelectedKeys={[
                            this.menuItems()[connection.deviceName][
                                interfaceType
                            ][1].key,
                        ]}
                        items={
                            this.menuItems()[connection.deviceName][
                                interfaceType
                            ]
                        }
                        onSelect={this.switchTab}
                    />
                </Sider>
                <Layout style={{ backgroundColor: 'white' }}>
                    {tab === 'bafang_uart_motor_settings_simplified' && (
                        <React.Suspense fallback={loadingElement}>
                            <BafangUartMotorSettingsSimplifiedView
                                connection={connection as BafangUartMotor}
                            />
                        </React.Suspense>
                    )}
                    {tab === 'bafang_uart_motor_info' && (
                        <React.Suspense fallback={loadingElement}>
                            <BafangUartMotorInfoView
                                connection={connection as BafangUartMotor}
                            />
                        </React.Suspense>
                    )}
                    {tab === 'bafang_uart_motor_settings' && (
                        <React.Suspense fallback={loadingElement}>
                            <BafangUartMotorSettingsView
                                connection={connection as BafangUartMotor}
                            />
                        </React.Suspense>
                    )}
                    {tab === 'bafang_can_system_info' && (
                        <React.Suspense fallback={loadingElement}>
                            <BafangCanSystemInfoView
                                connection={connection as BafangCanSystem}
                            />
                        </React.Suspense>
                    )}
                    {tab === 'bafang_can_motor_settings' && (
                        <React.Suspense fallback={loadingElement}>
                            <BafangCanMotorSettingsView
                                connection={connection as BafangCanSystem}
                            />
                        </React.Suspense>
                    )}
                    {tab === 'bafang_can_display_settings' && (
                        <React.Suspense fallback={loadingElement}>
                            <BafangCanDisplaySettingsView
                                connection={connection as BafangCanSystem}
                            />
                        </React.Suspense>
                    )}
                    {tab === 'bafang_can_sensor_settings' && (
                        <React.Suspense fallback={loadingElement}>
                            <BafangCanSensorSettingsView
                                connection={connection as BafangCanSystem}
                            />
                        </React.Suspense>
                    )}
                    {tab === 'bafang_can_battery' && (
                        <React.Suspense fallback={loadingElement}>
                            <BafangCanBatteryView
                                connection={connection as BafangCanSystem}
                            />
                        </React.Suspense>
                    )}
                    {tab.indexOf('manual') === 0 && (
                        <React.Suspense fallback={loadingElement}>
                            <DocumentationView page={tab.substring(7)} />
                        </React.Suspense>
                    )}
                </Layout>
            </Layout>
        );
    }
}

export default MainView;
