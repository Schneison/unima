import { AnySchema } from 'yup/lib/schema';
// eslint-disable-next-line import/no-cycle
import { TestContext } from 'yup';
import { store } from '../state/store';

export type DependingRecord<K extends keyof T, T> = {
    [P in K]: AnySchema<T[K] | undefined>;
};

/**
 * Creates a schema context for the given parameters.
 * @param preset Optional preset
 */
export const createSchemaContext = <P>(preset: P | null): SchemaContext => {
    return { mode: preset ? 'edit' : 'create' };
};

/**
 * Check if the given string represents the edit mode string value.
 * @param mode String which should be checked against "edit"
 */
export const isEditMode = (mode?: FormMode) => mode === 'edit';

/**
 * Check if the form is currently in edit mode
 *
 * @param context Context of the schema, provided by the useHook.
 */
const isContextEditMode = (context: TestContext<SchemaContext>) =>
    isEditMode(context.options.context?.mode);

/**
 * Check if the module id is unique.
 *
 * @param value id entered by the user, which should be checked against the database.
 * @param context Context of the schema, provided by the useHook.
 */
export const isModuleUnique = (
    value: string | undefined,
    context: TestContext<SchemaContext>
) =>
    isContextEditMode(context) ||
    (value != null && store.getState().modules.modules[value] == null);

/**
 * Check if the vessel id is unique.
 *
 * @param value id entered by the user, which should be checked against the database.
 * @param context Context of the schema, provided by the useHook.
 */
export const isVesselUnique = (
    value: string | undefined,
    context: TestContext<SchemaContext>
) =>
    isContextEditMode(context) ||
    (value != null && store.getState().modules.vessels[value] == null);

/**
 * Check if the directory is unique.
 *
 * @param value directory path entered by the user, which should be checked against the database.
 * @param context Context of the schema, provided by the useHook.
 */
export const isVesselDirectoryUnique = (
    value: string | undefined,
    context: TestContext<SchemaContext>
) =>
    isContextEditMode(context) ||
    (value != null &&
        Object.values(store.getState().modules.vessels).every(
            (vessel) => vessel.directory !== value
        ));
/**
 * Check if the vessel exists.
 *
 * @param value vessel id selected by the user, which should be checked against the database.
 */
export const isVesselExisting = (value?: string) =>
    value != null && store.getState().modules.vessels[value] !== null;
