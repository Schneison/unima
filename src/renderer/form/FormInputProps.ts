import * as React from 'react';

export default interface FormInputProps {
    name: string;
    control: any;
    label?: string;
    setValue?: any;
    disabled?: boolean;
    style?: React.CSSProperties;
    type?: React.InputHTMLAttributes<unknown>['type'];
}
