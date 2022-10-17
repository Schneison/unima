import React from 'react';
import AdapterDateFns from '@mui/x-date-pickers/AdapterDateFns';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import { Controller } from 'react-hook-form';
import { DesktopDatePicker } from '@mui/x-date-pickers';
import { TextField } from '@mui/material';
import FormInputProps from './FormInputProps';

const DATE_FORMAT = 'dd-MMM-yy';

// https://mui.com/x/react-date-pickers/date-picker/
// https://material-ui-pickers.dev/api/KeyboardDatePicker
const DateFormInput: React.FC<FormInputProps> = ({
    name,
    control,
    label,
    style,
}: FormInputProps) => {
    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Controller
                name={name}
                control={control}
                render={({ field: { onChange, onBlur, value, ref } }) => (
                    <DesktopDatePicker
                        /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
                        // @ts-ignore
                        fullWidth
                        /* eslint-disable-next-line react/jsx-props-no-spreading */
                        renderInput={(params) => <TextField {...params} />}
                        id={`date-${Math.random()}`}
                        label={label}
                        rifmFormatter={(val: string) =>
                            val.replace(/[^[a-zA-Z0-9-]*$]+/gi, '')
                        }
                        refuse={/[^[a-zA-Z0-9-]*$]+/gi}
                        autoOk
                        InputAdornmentProps={{
                            'aria-label': 'change date',
                        }}
                        inputFormat={DATE_FORMAT}
                        onChange={onChange}
                        onBlur={onBlur}
                        value={value}
                        name={name}
                        ref={ref}
                        style={style}
                        date={new Date()}
                        openPicker={() => <div />}
                        rawValue={new Date()}
                    />
                )}
            />
        </LocalizationProvider>
    );
};

export default DateFormInput;
