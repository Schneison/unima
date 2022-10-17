import { ActionCreator, PayloadAction, ThunkAction } from '@reduxjs/toolkit';

export interface ProcessState {
    state: AsyncStatusCancelable;
    processId?: string;
}

export type RequestActionCreator<RequestArg, RequestReturned> = (
    arg: RequestArg
) => ThunkAction<Promise<[string, RequestReturned]>, any, any, any>;

export type PendingActionCreator<RequestResult> = ((
    result: RequestResult
) => PayloadAction<RequestResult>) & {
    type: string;
};
export type ReplyActionCreator<Returned> = ((
    result: Returned
) => PayloadAction<Returned>) & {
    type: string;
};

export interface ProcessThunk<
    Returned,
    RequestArg = void,
    RequestReturned = Record<string, never>
> {
    pending: PendingActionCreator<RequestResult>;
    reply: ReplyActionCreator<Returned>;
    request: RequestActionCreator<RequestArg, RequestReturned>;
    cancel: ActionCreator<any> & {
        type: string;
    };
    canceled: ActionCreator<any> & {
        type: string;
    };
    typePrefix: string;
}

export interface RequestResult {
    processId: string;
}

export type ProcessRequest<Arg, Returned> = (
    arg: Arg
) => Promise<[string, Returned]>;

export function createProcessThunk<
    Returned,
    RequestArg,
    RequestReturned = Record<string, never>
>(
    typePrefix: string,
    requestCallback: ProcessRequest<RequestArg, RequestReturned>
): ProcessThunk<Returned, RequestArg, RequestReturned> {
    const pending: PendingActionCreator<RequestResult> = (result) => {
        return {
            payload: result,
            type: `${typePrefix}/pending`,
        };
    };
    pending.type = `${typePrefix}/pending`;
    const reply: ReplyActionCreator<Returned> = (result) => {
        return {
            payload: result,
            type: `${typePrefix}/reply`,
        };
    };
    reply.type = `${typePrefix}/reply`;
    const request: RequestActionCreator<RequestArg, RequestReturned> =
        (arg: RequestArg) => async (dispatch) => {
            const result = await requestCallback(arg);
            const [processId] = result;
            dispatch(
                pending({
                    processId,
                })
            );
            return result;
        };
    const cancel = () => {
        return { type: `${typePrefix}/cancel` };
    };
    cancel.type = `${typePrefix}/cancel`;
    const canceled = () => {
        return { type: `${typePrefix}/canceled` };
    };
    canceled.type = `${typePrefix}/canceled`;
    return {
        typePrefix,
        reply,
        pending,
        cancel,
        request,
        canceled,
    };
}
