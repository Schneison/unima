import React, { useMemo } from 'react';

import {
    Box,
    Card,
    CardActionArea,
    Divider,
    Stack,
    Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { DeleteButton } from '../../FormCommon';
import { FormButton } from '../vessel/VesselEditModal';
import { ModuleContainer } from '../../state/reducers/moduleReducer';
import DashboardCard from './DashboardCard';

const DashboardSegment: React.FC<{
    vessel: ModuleVessel;
    modulesByVessel: Record<string, string[]>;
    modules: ModuleContainer;
}> = ({ vessel, modulesByVessel, modules }) => {
    const vesselModules = useMemo(
        () =>
            (modulesByVessel[vessel.id] ?? []).map(
                (moduleId) => modules[moduleId]
            ),
        [modulesByVessel, vessel.id, modules]
    );
    return (
        <Stack direction="column" spacing={1}>
            <Box sx={{ display: 'flex', px: 10 }}>
                <Card
                    sx={{
                        p: 1,
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'row',
                        width: 50,
                    }}
                >
                    <Stack alignItems="center">
                        <FormButton mode="edit" preset={vessel}>
                            <EditIcon style={{ fontSize: 'large' }} />
                        </FormButton>
                    </Stack>
                    <Divider sx={{ mx: 1 }} orientation="vertical" />
                    <CardActionArea
                        sx={{
                            backgroundColor: vessel.color,
                            borderRadius: 1,
                            boxShadow: 2,
                        }}
                    >
                        <Typography
                            style={{
                                fontWeight: 700,
                                textAlign: 'center',
                                overflow: 'clip',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {vessel.title}
                        </Typography>
                    </CardActionArea>
                    <Divider sx={{ mx: 1 }} orientation="vertical" />
                    <Stack alignItems="center">
                        <DeleteButton model={vessel} repository="vessels" />
                    </Stack>
                </Card>
            </Box>
            <div
                style={{
                    flex: 1,
                    display: 'grid',
                    gridGap: '8px',
                    gridTemplateColumns: 'repeat(auto-fill, 186px)',
                    justifyContent: 'space-around',
                }}
            >
                {vesselModules.map((module) => (
                    <DashboardCard module={module} key={module.id} />
                ))}
            </div>
        </Stack>
    );
};

export default DashboardSegment;
