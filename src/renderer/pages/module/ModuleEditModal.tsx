import React from 'react';
import { Modal, Box, IconButton, Typography } from '@mui/material';
import BookOutlinedIcon from '@mui/icons-material/BookOutlined';
import { useForm, UseFormReturn } from 'react-hook-form';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import TextFormInput from '../../form/TextFormInput';
import { FormInputColorTest } from '../../form/ColorFormInput';
import VesselFormInput from '../../form/VesselFormInput';
import {
    createSchemaContext,
    DependingRecord,
    isEditMode,
    isModuleUnique,
    isVesselExisting,
} from '../../form/helpers';
import { AddButton, modalStyle } from '../../FormCommon';

export const defaultValues: Module = {
    title: '',
    id: '',
    url: '',
    directory: '',
    color: '#8ED1FC',
    vessel: '',
    sectionTitles: [],
    structure: 'compact',
    internalId: -1,
};

const moduleSchema = Yup.object().shape({
    title: Yup.string().required('Title is required').trim(),
    id: Yup.string()
        .required('Id is required')
        .trim()
        .test('exists', 'Id already used', isModuleUnique),
    url: Yup.string().required('URL is required').url(),
    color: Yup.string()
        .required('Color is required')
        .matches(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, {
            name: 'hex',
            message: 'color must be a valid',
            excludeEmptyString: false,
        }),
    vessel: Yup.string()
        .required('No vessel selected')
        .test(
            'exists',
            'Internal Error: ${path} does not exist',
            isVesselExisting
        ),
    directory: Yup.string().required('Directory is required').trim(),
    structure: Yup.string().default('compact'),
    sectionTitles: Yup.array().default([]),
    internalId: Yup.number().default(0),
} as DependingRecord<keyof Module, Module>);

/**
 * Helper function which call the useForm hook with the needed schema.
 * @param preset Preset for form values.
 */
export const useModuleForm = (preset?: ModuleVessel) =>
    useForm<Module>({
        defaultValues: preset ?? defaultValues,
        resolver: yupResolver(moduleSchema),
        context: createSchemaContext(preset),
    });

interface ModuleFormProps {
    mode: FormMode;
    handleClose: () => void;
    methods: UseFormReturn<Module>;
    includeAdd?: boolean;
}

export const ModuleForm: React.FC<ModuleFormProps> = ({
    methods,
    mode,
    handleClose,
    includeAdd,
}) => {
    const { control } = methods;
    return (
        <Box>
            <TextFormInput
                name="id"
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
            <TextFormInput
                name="url"
                control={control}
                label="Url"
                style={{ marginBottom: 10 }}
            />
            <FormInputColorTest name="color" control={control} />
            <VesselFormInput name="vessel" control={control} label="Vessels" />
            {includeAdd && (
                <AddButton
                    handleClose={handleClose}
                    methods={methods}
                    repository="modules"
                    mode={mode}
                />
            )}
        </Box>
    );
};
ModuleForm.defaultProps = {
    includeAdd: true,
};

const FormModal: React.FC<FormModalProps<Module>> = ({
    mode,
    handleClose,
    open,
    preset,
}) => {
    const methods = useModuleForm(preset);
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
                    {isEditMode(mode) ? 'Edit Module' : 'Create Module'}
                </Typography>
                <ModuleForm
                    mode={mode}
                    handleClose={handleClose}
                    methods={methods}
                />
            </Box>
        </Modal>
    );
};
FormModal.defaultProps = {
    // eslint-disable-next-line react/default-props-match-prop-types
    preset: defaultValues,
};

export const FormButton: React.FC<FormButtonProps<Module>> = ({
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
            <FormModal
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

export const ModuleEdit: React.FC = () => (
    <FormButton mode="create">
        <BookOutlinedIcon />
    </FormButton>
);
