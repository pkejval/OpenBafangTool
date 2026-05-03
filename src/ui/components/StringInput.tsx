import { Input } from 'antd';
import React from 'react';
import i18n from '../../i18n/i18n';

type StringInputProps = {
    value: string | null;
    onNewValue: (value: string) => void;
};

type StringInputState = {
    value: string | null;
};

class StringInputComponent extends React.Component<
    StringInputProps,
    StringInputState
> {
    constructor(props: any) {
        super(props);
        const { value } = this.props;
        this.state = { value };
    }

    static getDerivedStateFromProps(
        props: StringInputProps,
        state: StringInputState,
    ) {
        if (props.value !== state.value) {
            return {
                value: props.value,
            };
        }
        return null;
    }

    render() {
        const { value } = this.state;
        const { onNewValue } = this.props;
        if (value === null) return i18n.t('not_available');
        return (
            <Input
                value={value as string}
                style={{ minWidth: '150px' }}
                onChange={(e) => {
                    this.setState({
                        value: e.target.value,
                    });
                    onNewValue(e.target.value);
                }}
            />
        );
    }
}

export default StringInputComponent;
