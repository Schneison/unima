import React, { CSSProperties } from 'react';
import { Controller } from 'react-hook-form';
import { BlockPicker } from 'react-color';
import { Box, Stack, Typography } from '@mui/material';
import { SxProps } from '@mui/system';
import { Theme } from '@mui/material/styles';
import FormInputProps from './FormInputProps';

const buttonStyle: { [name: string]: CSSProperties & SxProps<Theme> } = {
    swatch: {
        padding: '5px',
        background: '#fff',
        borderRadius: '1px',
        boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
        display: 'inline-block',
        cursor: 'pointer',
    },
    popover: {
        position: 'absolute',
        zIndex: '2',
    },
    colorPicker: {
        transform: 'translate(-42%, 0)',
    },
    cover: {
        position: 'fixed',
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px',
    },
};

export const FormInputColorTest: React.FC<FormInputProps> = ({
    name,
    control,
    style,
}: FormInputProps) => {
    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    return (
        <Box
            sx={{
                p: 1,
                borderRadius: 1,
                borderColor: 'rgba(0, 0, 0, 0.23)',
                borderWidth: '1px',
                borderStyle: 'solid',
                marginBottom: 1.5,
            }}
        >
            <Stack direction="row" alignItems="center" spacing={2}>
                <Typography>Color: </Typography>
                <div style={style}>
                    <Controller
                        name={name}
                        control={control}
                        render={({ field: { onChange, value } }) => (
                            <div style={buttonStyle.swatch}>
                                <Box
                                    style={{
                                        width: '26px',
                                        height: '26px',
                                        borderRadius: '2px',
                                        background: `${value}`,
                                    }}
                                    onClick={handleOpen}
                                />
                                {open ? (
                                    <div style={buttonStyle.popover}>
                                        <Box
                                            style={buttonStyle.cover}
                                            onClick={handleClose}
                                        />
                                        <div style={buttonStyle.colorPicker}>
                                            <BlockPicker
                                                onChange={(result) =>
                                                    onChange(result.hex)
                                                }
                                                color={value}
                                            />
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        )}
                    />
                </div>
            </Stack>
        </Box>
    );
};

const ColorFormInput: React.FC<FormInputProps> = ({
    name,
    control,
    style,
}: FormInputProps) => {
    return (
        <div style={style}>
            <Controller
                name={name}
                control={control}
                render={({ field: { onChange, value } }) => (
                    <BlockPicker
                        onChange={(result) => onChange(result.hex)}
                        color={value}
                    />
                )}
            />
        </div>
    );
};

export default ColorFormInput;
