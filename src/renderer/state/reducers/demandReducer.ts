import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Slice } from '@reduxjs/toolkit/dist/createSlice';
// eslint-disable-next-line import/no-cycle
import { RootState } from '../store';
import { createProcessThunk } from './ProcessThunk';
import MessageBroker from '../../bridge/MessageBroker';

export interface DemandState {
    status: AsyncStatusCancelable;
    process?: string;
    error?: string;
}

const initialState: DemandState = {
    status: 'idle',
};

export const selectDemand = (state: RootState): DemandState => state.demand;

export const isDemandLoading = (state: RootState): boolean =>
    selectDemand(state).status === 'loading';

export const isDemandLoaded = (state: RootState): boolean =>
    selectDemand(state).status === 'succeeded';

export const isDemandCanceled = (state: RootState): boolean =>
    selectDemand(state).status === 'canceled';

export const isDemandErrored = (state: RootState): boolean =>
    selectDemand(state).status === 'failed';

export const startFetching = createAsyncThunk<string, { moduleId: string }>(
    'demand/fetch',
    async (data) => {
        const { moduleId } = data;
        return window.electron.ipcRenderer
            .fetchModules(moduleId)
            .then((result) => result);
    }
);

export const fetchingProcess = createProcessThunk<void, { moduleId: string }>(
    'demand/fetching',
    async (data) => {
        const { moduleId } = data;
        return MessageBroker.fetchModules(moduleId).then((result) => [
            result,
            {},
        ]);
    }
);

const demandSlice: Slice<DemandState> = createSlice({
    name: 'demand',
    initialState,
    reducers: {
        finishFetching(state) {
            state.status = 'succeeded';
            state.process = undefined;
        },
        cancelFetching(state) {
            state.status = 'canceled';
        },
    },
    extraReducers(builder) {
        builder
            .addCase(startFetching.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(startFetching.fulfilled, (state, action) => {
                state.process = action.payload;
            })
            .addCase(startFetching.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            });
        builder
            .addCase(fetchingProcess.pending, (state, action) => {
                state.status = 'loading';
                state.process = action.payload.processId;
            })
            .addCase(fetchingProcess.cancel, (state) => {
                state.status = 'canceled';
                if (state.process) {
                    MessageBroker.killProcess(state.process);
                }
            })
            .addCase(fetchingProcess.reply, (state) => {
                state.status = 'succeeded';
            });
    },
});

export const { cancel, request } = fetchingProcess;

export default demandSlice.reducer;
