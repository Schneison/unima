import {
    createAsyncThunk,
    createSlice,
    PayloadAction,
    ThunkDispatch,
} from '@reduxjs/toolkit';
import { Slice } from '@reduxjs/toolkit/dist/createSlice';
// eslint-disable-next-line import/no-cycle
import { RootState } from '../store';
import MessageBroker from '../../bridge/MessageBroker';

export interface ResourceContainer {
    cache: ResourceCache;
    moduleId: string;
    // Multiple possible status enum values
    fetchStatus: AsyncStatus;
    existenceStatus: AsyncStatus;
    downloadStatus: AsyncStatus;
    deleteStatus: AsyncStatus;
    error: string | undefined;
}

const initialState = {
    fetchStatus: 'idle',
    cache: {},
} as ResourceContainer;

const select = (state: RootState): ResourceContainer => state.resources;

export const selectResource = (
    state: RootState,
    sourceId: string
): ResourceInfo => select(state).cache[sourceId];

export const selectModule = (state: RootState): string =>
    select(state).moduleId;

export const isLoadingResource = (state: RootState): boolean =>
    select(state).fetchStatus === 'loading';

export const fetchResources = createAsyncThunk<
    ResourceInfo[],
    { moduleId: string }
>('resources/fetchResources', async (data) => {
    const { moduleId } = data;
    let request = window.electron.ipcRenderer.selectResourcesByModule(moduleId);
    if (request == null) {
        request = Promise.resolve([]);
    }
    return request;
});

export const requestResources =
    (moduleId: string) =>
    (disp: ThunkDispatch<any, any, any>, getState: () => RootState) => {
        const state = getState();
        if (selectModule(state) !== moduleId && !isLoadingResource(state)) {
            disp(fetchResources({ moduleId }));
        }
    };

export const checkExistence =
    (sourceId: number, extensively: boolean) =>
    async (disp: ThunkDispatch<any, any, any>): Promise<string | undefined> => {
        return MessageBroker.checkExistence(sourceId, extensively, true).then(
            (value) => {
                disp({
                    type: 'resources/updateExistence',
                    payload: [sourceId, value],
                });
                return value;
            }
        );
    };

export const deleteFile = createAsyncThunk<
    { sourceId: number; value: boolean },
    { sourceId: number }
>('resources/deleteFile', async (data) => {
    const { sourceId } = data;
    return {
        sourceId,
        value: await MessageBroker.deleteFile(sourceId),
    };
});

const resourceSlice: Slice<ResourceContainer> = createSlice({
    name: 'resources',
    initialState,
    reducers: {
        onCheck(state, action: PayloadAction<[string, string]>) {
            const [sourceId, location] = action.payload;
            if (state.cache[sourceId] == null) {
                return;
            }

            state.cache[sourceId].downloaded = !!location;
            state.cache[sourceId].location = location ?? null;
        },
        onDownload(state, action: PayloadAction<DownloadResult[]>) {
            action.payload.forEach((result) => {
                const { element } = result;
                if (!element.path || result.error) {
                    state.cache[element.sourceId].downloaded = false;
                    state.cache[element.sourceId].location = null;
                    return;
                }
                state.cache[element.sourceId].location = element.path;
                state.cache[element.sourceId].downloaded = true;
            });
        },
        unmark(state, action: PayloadAction<number>) {
            const sourceId = action.payload;
            const source = state.cache[sourceId];
            source.marked = false;
            window.electron.ipcRenderer.editResource({
                sourceId,
                marked: false,
            });
        },
        updateExistence(state, action: PayloadAction<[string, string]>) {
            const [sourceId, value] = action.payload;
            if (state.cache[sourceId] == null) {
                return;
            }

            state.cache[sourceId].downloaded = !!value;
            state.cache[sourceId].location = value ?? null;
        },
    },
    extraReducers(builder) {
        builder
            .addCase(fetchResources.pending, (state) => {
                state.fetchStatus = 'loading';
            })
            .addCase(fetchResources.fulfilled, (state, action) => {
                state.fetchStatus = 'succeeded';

                action.payload.forEach((info) => {
                    state.cache[info.sourceId] = info;
                });
            })
            .addCase(fetchResources.rejected, (state, action) => {
                state.fetchStatus = 'failed';
                state.error = action.error.message;
            });
        builder
            .addCase(deleteFile.pending, (state) => {
                state.deleteStatus = 'loading';
            })
            .addCase(deleteFile.fulfilled, (state, action) => {
                state.deleteStatus = 'succeeded';

                if (
                    action.payload.value ||
                    state.cache[action.payload.sourceId] == null
                ) {
                    return;
                }

                state.cache[action.payload.sourceId].downloaded = false;
            })
            .addCase(deleteFile.rejected, (state, action) => {
                state.deleteStatus = 'failed';
                state.error = action.error.message;
            });
    },
});

export const { unmark } = resourceSlice.actions;

export default resourceSlice.reducer;
