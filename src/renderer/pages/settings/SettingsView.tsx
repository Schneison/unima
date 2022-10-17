import React, { useEffect } from 'react';
import {
    Box,
    Button,
    IconButton,
    Modal,
    Stack,
    Typography,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import FolderIcon from '@mui/icons-material/Folder';
import { useDispatch } from 'react-redux';
import { SxProps } from '@mui/system';
import { Theme } from '@mui/material/styles';
import { useAppSelector } from '../../state/hooks';
import { fetchSettings } from '../../state/reducers/settingsReducer';

const style: SxProps<Theme> = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    borderRadius: 9,
    boxShadow: 24,
    color: 'black',
    p: 4,
};

const SettingsView: React.FC = () => {
    const dispatch = useDispatch();
    const settings = useAppSelector((state) => state.settings.info);
    useEffect(() => {
        if (
            settings == null ||
            Object.getOwnPropertyNames(settings).length === 0
        ) {
            dispatch(fetchSettings());
        }
    }, [dispatch, settings]);
    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    return (
        <>
            <Button
                variant="contained"
                onClick={handleOpen}
                startIcon={<SettingsIcon />}
            >
                Settings
            </Button>

            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style}>
                    <Typography
                        id="modal-modal-title"
                        variant="h6"
                        component="h2"
                    >
                        Edit Settings
                    </Typography>
                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={2}
                        style={{ marginBottom: 10 }}
                    >
                        <Box
                            sx={{
                                borderRadius: 7,
                                bgcolor: 'lightgrey',
                                padding: 3,
                                paddingLeft: 8,
                                paddingRight: 8,
                                flex: 1,
                                minWidth: 0,
                            }}
                        >
                            <Typography
                                style={{
                                    marginTop: 2,
                                    maxLines: 1,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                E:\Projects\App\basilisk
                            </Typography>
                        </Box>
                        <IconButton
                            onClick={() =>
                                window.electron.ipcRenderer.openDirectoryDialog()
                            }
                            color="default"
                        >
                            <FolderIcon />
                        </IconButton>
                    </Stack>
                </Box>
            </Modal>
        </>
    );
};

export default SettingsView;
