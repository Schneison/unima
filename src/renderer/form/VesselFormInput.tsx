import React, { useMemo } from 'react';
import { Controller } from 'react-hook-form';
import {
    CardActionArea,
    Stack,
    Box,
    Card,
    Typography,
    Tooltip,
} from '@mui/material';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import FormInputProps from './FormInputProps';
import { VesselContainer } from '../state/reducers/moduleReducer';
import { useAppSelector } from '../state/hooks';
import { FormButton } from '../pages/vessel/VesselEditModal';

const VesselFormInput: React.FC<FormInputProps> = ({
    name,
    control,
    disabled,
    style,
    label,
}: FormInputProps) => {
    const vesselContainer: VesselContainer = useAppSelector(
        (state) => state.modules.vessels
    );
    const vessels = useMemo(
        () => Object.values(vesselContainer) as ModuleVessel[],
        [vesselContainer]
    );
    return (
        <Box>
            <Stack
                direction="row"
                flexWrap="nowrap"
                spacing={2}
                alignItems="center"
            >
                <Typography
                    style={{
                        fontWeight: 500,
                        fontSize: 18,
                        paddingBottom: 1,
                    }}
                >
                    {label}
                </Typography>
                <FormButton mode="create">
                    <Tooltip title="Create New Vessel">
                        <NoteAddIcon />
                    </Tooltip>
                </FormButton>
            </Stack>
            <Controller
                name={name}
                control={control}
                render={({
                    field: { onChange, value },
                    fieldState: { error },
                }) => (
                    <Box>
                        <Box style={{ overflowX: 'auto', ...style }}>
                            <Stack
                                direction="row"
                                alignItems="stretch"
                                spacing={1}
                                sx={{
                                    minWidth: 'min-content',
                                }}
                            >
                                {vessels.map((vessel) => (
                                    <Card
                                        style={{
                                            background:
                                                value === vessel.id
                                                    ? vessel.color
                                                    : 'lightgray',
                                            margin: 8,
                                            flex: 1,
                                            alignItems: 'stretch',
                                            display: 'flex',
                                        }}
                                        key={vessel.id}
                                    >
                                        <CardActionArea
                                            onClick={() => onChange(vessel.id)}
                                            disabled={disabled}
                                            style={{
                                                padding: 8,
                                                paddingBottom: 10,
                                                alignItems: 'center',
                                                display: 'flex',
                                            }}
                                        >
                                            <Typography
                                                // noWrap
                                                style={{
                                                    fontWeight: 600,
                                                    textAlign: 'center',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}
                                            >
                                                {vessel.title}
                                            </Typography>
                                        </CardActionArea>
                                    </Card>
                                ))}
                            </Stack>
                        </Box>
                        <Typography
                            paragraph={!error}
                            style={{
                                paddingBottom: 1,
                                color: 'red',
                            }}
                            variant="subtitle2"
                        >
                            {error ? error.message : null}
                        </Typography>
                    </Box>
                )}
            />
        </Box>
    );
};

export default VesselFormInput;
