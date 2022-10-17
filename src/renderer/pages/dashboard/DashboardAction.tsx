import * as React from 'react';
import Box from '@mui/material/Box';
import Backdrop from '@mui/material/Backdrop';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import { VesselEditModal } from '../vessel/VesselEditModal';
import { ModuleEdit } from '../module/ModuleEditModal';

const actions = [
    { icon: <ModuleEdit />, name: 'Module' },
    { icon: <VesselEditModal />, name: 'Section' },
];

const DashboardAction: React.FC = () => {
    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    return (
        <Box>
            <Backdrop open={open} />
            <SpeedDial
                ariaLabel="SpeedDial add items"
                sx={{ position: 'absolute', bottom: 24, right: 24 }}
                icon={<SpeedDialIcon />}
                onClose={handleClose}
                onOpen={handleOpen}
                open={open}
            >
                {actions.map((action) => (
                    <SpeedDialAction
                        key={action.name}
                        icon={action.icon}
                        tooltipTitle={action.name}
                        tooltipOpen
                        onClick={handleClose}
                    />
                ))}
            </SpeedDial>
        </Box>
    );
};

export default DashboardAction;
