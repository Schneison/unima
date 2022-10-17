import React, {
    CSSProperties,
    MouseEventHandler,
    PropsWithChildren,
} from 'react';
import { useDispatch } from 'react-redux';
import DeleteIcon from '@mui/icons-material/Delete';
import {
    IconButton,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    BoxProps,
    Stack,
} from '@mui/material';
import { AsyncThunk } from '@reduxjs/toolkit';
import { UseFormReturn } from 'react-hook-form';
import { Dispatch } from 'redux';
import {
    addModule,
    addVessel,
    removeModule,
    removeVessel,
    updateModule,
    updateVessel,
} from './state/reducers/moduleReducer';
import { isEditMode } from './form/helpers';

export const modalStyle: CSSProperties | BoxProps = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 310,
    bgcolor: 'background.paper',
    borderRadius: 3,
    boxShadow: '20',
    color: 'black',
    p: 2,
};

type FormModel = { title: string; id: string };

const VesselDeleteDialog: React.FC<
    {
        model: FormModel;
        open: boolean;
        handleClose: MouseEventHandler;
        handleSubmit: MouseEventHandler;
    } & PropsWithChildren
> = ({ children, model, open, handleClose, handleSubmit }) => {
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
                    Are you sure you want to delete &quot;{model.title}
                    &quot;? <br /> You can&apos;t undo this action.
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
                <Button
                    onClick={handleSubmit}
                    autoFocus
                    variant="contained"
                    color="error"
                >
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
    );
};
const addModel: { [repository: string]: AsyncThunk<any, any, any> } = {
    vessels: addVessel,
    modules: addModule,
};
const updateModel: { [repository: string]: AsyncThunk<any, any, any> } = {
    vessels: updateVessel,
    modules: updateModule,
};
const ActionRemove: { [repository: string]: AsyncThunk<any, any, any> } = {
    vessels: removeVessel,
    modules: removeModule,
};

export const handleAddSubmit = (
    dispatch: Dispatch<any>,
    mode: FormMode,
    repository: Repository,
    data: FormModel
) => {
    const actionFactory = isEditMode(mode)
        ? updateModel[repository]
        : addModel[repository];
    dispatch(
        actionFactory({
            payload: data,
            criteria: { id: data.id },
        })
    );
};

export const AddButton: React.FC<{
    mode: FormMode;
    methods: UseFormReturn<any, any>;
    repository: Repository;
    handleClose: () => void;
}> = ({
    methods: {
        handleSubmit,
        reset,
        formState: { isSubmitSuccessful, errors },
    },
    mode,
    repository,
    handleClose,
}) => {
    const dispatch = useDispatch();
    React.useEffect(() => {
        if (isSubmitSuccessful) {
            reset();
            handleClose();
        }
    }, [isSubmitSuccessful, reset, handleClose]);
    return (
        <Stack
            flexDirection="row"
            justifyContent="space-between"
            sx={{ px: 2 }}
        >
            <Button
                variant="contained"
                color="warning"
                sx={{ px: 3 }}
                onClick={() => {
                    handleClose();
                }}
            >
                Cancel
            </Button>
            <Button
                variant="contained"
                color="success"
                sx={{ px: 3 }}
                onClick={() => {
                    if (errors) {
                        console.log('submit-errors', errors);
                    }
                    handleSubmit((data) =>
                        handleAddSubmit(dispatch, mode, repository, data)
                    )();
                }}
            >
                Submit
            </Button>
        </Stack>
    );
};

export const DeleteButton: React.FC<{
    model: FormModel;
    repository: Repository;
}> = ({ model, repository }) => {
    const { id } = model;
    const dispatch = useDispatch();
    const [open, setOpen] = React.useState(false);
    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };
    const handleSubmit = () => {
        handleClose();
        const actionCreator = ActionRemove[repository];
        if (actionCreator) {
            dispatch(actionCreator({ criteria: { id } }));
        }
    };
    return (
        <div>
            <IconButton aria-label="delete" onClick={handleClickOpen}>
                <DeleteIcon style={{ fontSize: 'large' }} />
            </IconButton>
            <VesselDeleteDialog
                model={model}
                open={open}
                handleClose={handleClose}
                handleSubmit={handleSubmit}
            />
        </div>
    );
};
