/**
 * Context for schema validation of module and vessel form
 */
type SchemaContext = {
    /**
     * Edit mode of the form
     */
    mode?: FormMode;
};

/**
 * Defines if the form is used to update an existing model or create a new
 */
type FormMode = 'edit' | 'create';

interface BaseFormProps<P> {
    mode: FormMode;
    preset?: P;
}

interface FormModalProps<P> extends BaseFormProps<P> {
    open: boolean;
    handleClose: () => void;
}

interface FormButtonProps<P> extends BaseFormProps<P> {
    children: React.ReactNode | undefined;
}
