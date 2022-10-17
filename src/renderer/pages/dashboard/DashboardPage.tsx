import React, { useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { Box, Button, Card, Stack } from '@mui/material';
import { useAppSelector } from '../../state/hooks';
import {
    fetchModules,
    fetchVessels,
    ModuleContainer,
    VesselContainer,
} from '../../state/reducers/moduleReducer';
import { fetchSettings } from '../../state/reducers/settingsReducer';
import SettingsView from '../settings/SettingsView';
import MessageBroker from '../../bridge/MessageBroker';
import DetectButton from '../detected/DetectPage';
import DashboardSegment from './DashboardSegment';
import DashboardAction from './DashboardAction';

const ButtonHeader = () => {
    return (
        <Card sx={{ p: 1, mb: 3, backgroundColor: 'lightgray' }}>
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
            >
                <SettingsView />
                <DetectButton />
                <Button
                    variant="contained"
                    onClick={() => MessageBroker.openLogin()}
                >
                    Login / Logout
                </Button>
            </Stack>
        </Card>
    );
};

const DashboardPage: React.FC = () => {
    const dispatch = useDispatch();
    const needsLoading = useAppSelector(
        (state) =>
            state.modules.modulesStatus === 'idle' ||
            state.modules.vesselsStatus === 'idle'
    );
    const loadingVessels: boolean = useAppSelector(
        (state) => state.modules.vesselsStatus === 'loading'
    );
    const vessels: VesselContainer = useAppSelector(
        (state) => state.modules.vessels
    );
    const modulesByVessel: Record<string, string[]> = useAppSelector(
        (state) => state.modules.modulesByVessel
    );
    const modules: ModuleContainer = useAppSelector(
        (state) => state.modules.modules
    );
    const vesselNames = useMemo(() => {
        return loadingVessels ? [] : Object.getOwnPropertyNames(vessels);
    }, [vessels, loadingVessels]);
    const loadingModules: boolean = useAppSelector(
        (state) => state.modules.modulesStatus === 'loading'
    );
    const settings = useAppSelector((state) => state.settings.info);
    useEffect(() => {
        if (
            settings == null ||
            Object.getOwnPropertyNames(settings).length === 0
        ) {
            dispatch(fetchSettings());
        }
        if (needsLoading) {
            dispatch(fetchModules());
            dispatch(fetchVessels());
        }
    }, [dispatch, settings, needsLoading]);
    return (
        <div
            style={{
                minWidth: 600,
                height: 'auto',
                paddingTop: '30px',
                paddingBottom: '30px',
            }}
        >
            <ButtonHeader />
            {!loadingModules && !loadingVessels && (
                <div>
                    {vesselNames.map((vesselName) => (
                        <Box sx={{ pb: 3 }} key={vesselName}>
                            <DashboardSegment
                                vessel={vessels[vesselName]}
                                modulesByVessel={modulesByVessel}
                                modules={modules}
                            />
                        </Box>
                    ))}
                </div>
            )}
            <DashboardAction />
        </div>
    );
};

export default DashboardPage;
