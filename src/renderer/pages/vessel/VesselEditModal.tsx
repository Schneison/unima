import React from 'react';
import { Modal, Box, IconButton, Typography } from '@mui/material';
import { useForm, UseFormReturn } from 'react-hook-form';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import LibraryBooksOutlinedIcon from '@mui/icons-material/LibraryBooksOutlined';
import TextFormInput from '../../form/TextFormInput';
import { FormInputColorTest } from '../../form/ColorFormInput';
import {
    createSchemaContext,
    DependingRecord,
    isEditMode,
    isVesselDirectoryUnique,
    isVesselUnique,
} from '../../form/helpers';
import { AddButton, modalStyle } from '../../FormCommon';

const defaultValues: ModuleVessel = {
    title: '',
    id: '',
    directory: '',
    color: '#8ED1FC',
};

const vesselSchema = Yup.object().shape({
    title: Yup.string().required('Title is required').trim(),
    id: Yup.string()
        .required('Id is required')
        .trim()
        .test('exists', 'Id already used', isVesselUnique),
    color: Yup.string()
        .required('Color is required')
        .matches(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, {
            name: 'hex',
            message: 'color must be a valid',
            excludeEmptyString: false,
        }),
    directory: Yup.string()
        .required('Directory is required')
        .trim()
        .test(
            'exists_directory',
            'Directory already used',
            isVesselDirectoryUnique
        ),
} as DependingRecord<keyof ModuleVessel, ModuleVessel>);
export const useVesselForm = (preset?: ModuleVessel) =>
    useForm<ModuleVessel>({
        defaultValues: preset ?? defaultValues,
        resolver: yupResolver(vesselSchema),
        context: createSchemaContext(preset),
    });

export const VesselForm: React.FC<{
    mode: FormMode;
    handleClose: () => void;
    methods: UseFormReturn<ModuleVessel>;
    includeAdd?: boolean;
}> = ({ methods, handleClose, mode, includeAdd }) => {
    const { control } = methods;
    return (
        <Box>
            <TextFormInput
                name="id"
                disabled={mode === 'edit'}
                control={control}
                label="Unique Identifier"
                style={{ marginBottom: 10 }}
            />
            <TextFormInput
                name="title"
                control={control}
                label="Title"
                style={{ marginBottom: 10 }}
            />
            <TextFormInput
                name="directory"
                control={control}
                label="Directory Name"
                style={{ marginBottom: 10 }}
            />
            <FormInputColorTest name="color" control={control} />
            {includeAdd && (
                <AddButton
                    handleClose={handleClose}
                    methods={methods}
                    repository="vessels"
                    mode={mode}
                />
            )}
        </Box>
    );
};
VesselForm.defaultProps = {
    includeAdd: true,
};

const ModalForm: React.FC<FormModalProps<ModuleVessel>> = ({
    mode,
    handleClose,
    open,
    preset,
}) => {
    const methods = useVesselForm(preset);
    return (
        <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <Box sx={modalStyle}>
                <Typography
                    id="modal-modal-title"
                    variant="h6"
                    component="h2"
                    style={{ marginBottom: 20 }}
                    align="center"
                >
                    {isEditMode(mode) ? 'Edit Section' : 'Create Section'}
                </Typography>
                <VesselForm
                    mode={mode}
                    handleClose={handleClose}
                    methods={methods}
                />
            </Box>
        </Modal>
    );
};
ModalForm.defaultProps = {
    // eslint-disable-next-line react/default-props-match-prop-types
    preset: defaultValues,
};

export const FormButton: React.FC<FormButtonProps<ModuleVessel>> = ({
    preset,
    mode,
    children,
}) => {
    const [open, setOpen] = React.useState(false);
    const handleClickOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    return (
        <div>
            <IconButton aria-label="edit" onClick={handleClickOpen}>
                {children}
            </IconButton>
            <ModalForm
                preset={preset}
                mode={mode}
                open={open}
                handleClose={handleClose}
            />
        </div>
    );
};
FormButton.defaultProps = {
    // eslint-disable-next-line react/default-props-match-prop-types
    preset: defaultValues,
};

export const VesselEditModal: React.FC = () => (
    <FormButton mode="create">
        <LibraryBooksOutlinedIcon />
    </FormButton>
);
