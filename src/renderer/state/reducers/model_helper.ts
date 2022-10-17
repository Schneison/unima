import { createAction } from '@reduxjs/toolkit';
import { Dispatch } from 'redux';

export interface ModelPayload<Model = any> {
    models?: Model[];
    repository: Repository;
    type: ModelActionSinge;
}

export const modelAction = createAction<ModelPayload>('models/action');

export const dispatchModelAction = <K extends keyof ModelMap & Repository>(
    repository: K,
    action: ModelActionSinge,
    dispatch: Dispatch<any>
): ((result: ModelResult<K>) => Promise<ModelResult<K>>) => {
    return async (result) => {
        dispatch(
            modelAction({
                type: action,
                repository,
                models: result.payload,
            })
        );
        return result;
    };
};
