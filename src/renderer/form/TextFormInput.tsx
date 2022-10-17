import React from 'react';
import { Controller } from 'react-hook-form';
import TextField from '@mui/material/TextField';
import FormInputProps from './FormInputProps';

const TextFormInput: React.FC<FormInputProps> = ({
    name,
    control,
    label,
    style,
    disabled,
    type,
}: FormInputProps) => {
    return (
        <Controller
            name={name}
            control={control}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
                <TextField
                    helperText={error ? error.message : null}
                    size="small"
                    error={!!error}
                    onChange={onChange}
                    value={value}
                    disabled={disabled}
                    fullWidth
                    label={label}
                    variant="outlined"
                    style={style}
                    type={type}
                />
            )}
        />
    );
};

export default TextFormInput;
