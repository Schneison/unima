import React, { PropsWithChildren, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CardActions,
    Box,
    Card,
    CardActionArea,
    Divider,
    Typography,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { NavigateFunction } from 'react-router/dist/lib/hooks';
import { useDispatch } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import SyncIcon from '@mui/icons-material/Sync';
import { DeleteButton } from '../../FormCommon';
import { useAppSelector } from '../../state/hooks';
import {
    cancel,
    isDemandCanceled,
    isDemandLoaded,
    isDemandLoading,
    request,
} from '../../state/reducers/demandReducer';
import { RootState } from '../../state/store';
import { FormButton } from '../module/ModuleEditModal';

function onClick(navigate: NavigateFunction, module: Module) {
    // window.electron.ipcRenderer.openBrowser('moodle');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    navigate(`/module/${module.id}`);
}

const FetchingDialog: React.FC<
    {
        open: boolean;
        handleClose: () => void;
    } & PropsWithChildren
> = ({ children, open, handleClose }) => {
    const loading = useAppSelector(isDemandLoading);
    const loaded = useAppSelector(isDemandLoaded);
    useEffect(() => {
        if (loaded) {
            handleClose();
        }
    }, [loaded, handleClose]);
    return (
        <Dialog
            open={open}
            onClose={handleClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">Confirm delete</DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    {loading
                        ? 'Currently fetching sources from moodle.'
                        : 'Waiting for fetching...'}
                </DialogContentText>
                {children}
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={handleClose}
                    variant="contained"
                    color="success"
                >
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const FetchingButton: React.FC<{
    moduleId: string;
}> = ({ moduleId }) => {
    const dispatch = useDispatch();
    const [open, setOpen] = React.useState(false);
    const handleOpen = () => {
        setOpen(true);
        dispatch(
            (disp: ThunkDispatch<any, any, any>, getState: () => RootState) => {
                if (!isDemandLoading(getState())) {
                    disp(request({ moduleId }));
                }
            }
        );
    };
    const handleClose = () => {
        setOpen(false);
        dispatch(
            (disp: ThunkDispatch<any, any, any>, getState: () => RootState) => {
                if (
                    !isDemandLoaded(getState()) &&
                    !isDemandCanceled(getState())
                ) {
                    disp(cancel());
                }
            }
        );
    };
    return (
        <div>
            <IconButton onClick={handleOpen}>
                <SyncIcon style={{ fontSize: 'large' }} />
            </IconButton>
            <FetchingDialog open={open} handleClose={handleClose} />
        </div>
    );
};

const DashboardCard: React.FC<{ module: Module } & PropsWithChildren> = ({
    children,
    module,
}) => {
    const navigate: NavigateFunction = useNavigate();
    return (
        <Stack>
            <Card
                sx={{
                    m: 1,
                    boxShadow: 4,
                }}
            >
                <CardActionArea
                    onClick={() => onClick(navigate, module)}
                    sx={{
                        backgroundColor: module.color,
                        boxShadow: 'inset 0 -10px 12px -12px #555555',
                    }}
                >
                    <Box
                        sx={{
                            p: 1,
                            px: 2,
                            display: 'flex',
                            textAlign: 'center',
                            height: 40,

                            flexDirection: 'column',
                        }}
                    >
                        <Typography
                            style={{
                                fontSize: '1.1em',
                                textOverflow: 'ellipsis',
                                wordWrap: 'break-word',
                                overflowWrap: 'break-word',
                                textAlign: 'center',
                                overflow: 'hidden',
                            }}
                        >
                            {module.title}
                        </Typography>
                        {children && (
                            <Divider
                                style={{ marginTop: 4, marginBottom: 4 }}
                            />
                        )}
                        {children}
                    </Box>
                </CardActionArea>
                <CardActions disableSpacing style={{}}>
                    <FormButton mode="edit" preset={module}>
                        <EditIcon style={{ fontSize: 'large' }} />
                    </FormButton>
                    <DeleteButton model={module} repository="modules" />
                    <FetchingButton moduleId={module.id} />
                </CardActions>
            </Card>
        </Stack>
    );
};

export default DashboardCard;
