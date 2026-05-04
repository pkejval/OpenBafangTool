/* eslint-disable no-else-return */
import React from 'react';
import { Button, Result, Spin } from 'antd';
import IConnection from '../device/high-level/Connection';
import InterfaceType from '../types/InterfaceType';

const DeviceSelectionView = React.lazy(
    () => import('./views/DeviceSelectionView'),
);
const MainView = React.lazy(() => import('./views/MainView'));

type AppProps = {};

type AppState = {
    view: string;
    connection: IConnection | null;
    interfaceType: InterfaceType | null;
    connectionError: string | null;
};

class App extends React.Component<AppProps, AppState> {
    constructor(props: any) {
        super(props);
        this.state = {
            view: 'device_selector',
            connection: null,
            interfaceType: null,
            connectionError: null,
        };
        this.deviceSelectionHook = this.deviceSelectionHook.bind(this);
        this.toDeviceSelector = this.toDeviceSelector.bind(this);
    }

    async deviceSelectionHook(
        newConnection: IConnection,
        interfaceType: InterfaceType,
    ): Promise<boolean> {
        const { connection } = this.state;
        if (connection) {
            connection.disconnect();
        }
        try {
            const connected = await newConnection.connect();
            if (!connected) {
                this.setState({
                    view: 'connection_error',
                    connection: null,
                    interfaceType: null,
                    connectionError: 'Connection could not be established.',
                });
                return false;
            }
            this.setState({
                view: 'main_view',
                connection: newConnection,
                interfaceType,
                connectionError: null,
            });
            return true;
        } catch (error) {
            this.setState({
                view: 'connection_error',
                connection: null,
                interfaceType: null,
                connectionError:
                    error instanceof Error
                        ? error.message
                        : 'Connection could not be established.',
            });
            return false;
        }
    }

    toDeviceSelector() {
        const { connection } = this.state;
        if (connection) {
            connection.disconnect();
        }
        this.setState({
            view: 'device_selector',
            connection: null,
            interfaceType: null,
            connectionError: null,
        });
    }

    render() {
        const { view } = this.state;
        const { connection, interfaceType } = this.state;
        const loading = (
            <Spin
                spinning
                style={{ height: '100%', width: '100%', marginTop: '100px' }}
            />
        );
        if (view === 'device_selector') {
            return (
                <React.Suspense fallback={loading}>
                    <DeviceSelectionView
                        deviceSelectionHook={this.deviceSelectionHook}
                    />
                </React.Suspense>
            );
        } else if (view === 'main_view') {
            return (
                <React.Suspense fallback={loading}>
                    <MainView
                        connection={connection as IConnection}
                        interfaceType={interfaceType as InterfaceType}
                        backHook={this.toDeviceSelector}
                    />
                </React.Suspense>
            );
        } else if (view === 'connection_error') {
            return (
                <Result
                    status="error"
                    title="Connection failed"
                    subTitle={
                        this.state.connectionError ||
                        'The device could not be opened.'
                    }
                    extra={[
                        <Button key="back" onClick={this.toDeviceSelector}>
                            Back to device selection
                        </Button>,
                    ]}
                />
            );
        } else {
            return <div>Unknown error</div>; // TODO add error page
        }
    }
}

export default App;
