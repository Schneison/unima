import { AnyAction, Action } from 'redux';
import { AsyncThunkAction } from '@reduxjs/toolkit';

export type DispatchAction = AnyAction & {
    asyncDispatch: (action: Action | AsyncThunkAction<any, any, any>) => void;
};

export function isDispatch(pet: Action): pet is DispatchAction {
    return (pet as DispatchAction).asyncDispatch !== undefined;
}
