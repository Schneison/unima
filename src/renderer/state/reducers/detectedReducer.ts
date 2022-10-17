import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Slice } from '@reduxjs/toolkit/dist/createSlice';
// eslint-disable-next-line import/no-cycle
import { RootState } from '../store';
import { isDispatch } from '../actionDispatch';
import { dispatchModelAction, modelAction } from './model_helper';
import MessageBroker from '../../bridge/MessageBroker';

export interface ProcessingState {
    detected?: DetectedVessel;
    model?: ModuleVessel;
}

export interface DetectedState {
    processing: ProcessingState;
    modules: Record<number, DetectedModule>;
    vessels: Record<number, DetectedVessel>;
    moduleCache: Record<string, Partial<Module>>;
    vesselCache: Record<string, Partial<ModuleVessel>>;
    status: AsyncStatus;
    error?: string;
}

const initialState = {
    processing: {},
    status: 'idle',
    modules: {},
    vessels: {},
    moduleCache: {},
    vesselCache: {},
} as DetectedState;

export const fetchDetected = createAsyncThunk<
    [DetectedModule[], DetectedVessel[]]
>('detected/fetch', async () => {
    await MessageBroker.detectModules();
    return window.electron.ipcRenderer
        .applyAction({
            repository: 'detected_modules',
            type: 'select',
            criteria: { marked: true },
        })
        .then((result) => result.payload ?? [])
        .then(async (result) => {
            return [
                result,
                await window.electron.ipcRenderer.prepareDetection(),
            ];
        });
});

export const updateDetected = createAsyncThunk<
    ModelResult<'detected_modules'>,
    { payload: Partial<DetectedModule>; criteria?: Criteria<DetectedModule> }
>('detected/update', async (data, thunkAPI) => {
    const { payload, criteria } = data;
    return window.electron.ipcRenderer
        .applyAction({
            repository: 'detected_modules',
            type: 'update',
            payload,
            criteria,
        })
        .then(
            dispatchModelAction('detected_modules', 'update', thunkAPI.dispatch)
        );
});

export const removeDetected = createAsyncThunk<
    ModelResult<'detected_modules'>,
    { criteria?: Criteria<DetectedModule> }
>('detected/remove', async (data, thunkAPI) => {
    const { criteria } = data;
    return window.electron.ipcRenderer
        .applyAction({
            repository: 'detected_modules',
            type: 'delete',
            criteria,
        })
        .then(
            dispatchModelAction('detected_modules', 'delete', thunkAPI.dispatch)
        );
});

export const updateDetectedVessel = createAsyncThunk<
    ModelResult<'detected_vessels'>,
    { payload: Partial<DetectedVessel>; criteria?: Criteria<DetectedVessel> }
>('detected/update', async (data, thunkAPI) => {
    const { payload, criteria } = data;
    return window.electron.ipcRenderer
        .applyAction({
            repository: 'detected_vessels',
            type: 'update',
            payload,
            criteria,
        })
        .then(
            dispatchModelAction('detected_vessels', 'update', thunkAPI.dispatch)
        );
});

interface CachePayload {
    model: Partial<Module | ModuleVessel>;
    cacheId: string;
    repository: Repository;
}

const moduleSlice: Slice<DetectedState> = createSlice({
    name: 'detected',
    initialState,
    reducers: {
        startProcess(
            state,
            action: PayloadAction<[DetectedVessel, ModuleVessel]>
        ) {
            const [detected, model] = action.payload;
            state.processing = {
                model,
                detected,
            };
        },
        endProcess(state) {
            state.processing = {};
        },
        cacheModel(state, action: PayloadAction<CachePayload>) {
            const { repository, model, cacheId } = action.payload;
            switch (repository) {
                case 'modules':
                    state.moduleCache[cacheId] = model;
                    break;
                case 'vessels':
                    state.vesselCache[cacheId] = model;
                    break;
                default:
                    break;
            }
        },
    },
    extraReducers(builder) {
        builder.addCase(modelAction, (state, action) => {
            const { type, models, repository } = action.payload;
            const model = models && models.length > 0 ? models[0] : undefined;
            if (!model) {
                return;
            }
            if (repository === 'detected_vessels') {
                state.vessels[model.id] = model;
                return;
            }
            if (
                repository !== 'vessels' ||
                !state.processing ||
                state.processing?.model?.id !== model.id ||
                !isDispatch(action)
            ) {
                return;
            }
            if (type === 'insert' || type === 'update') {
                const { detected } = state.processing;
                if (!detected) {
                    return;
                }
                window.electron.ipcRenderer.applyAction({
                    repository: 'detected_vessels',
                    type: 'update',
                    criteria: {
                        id: detected.id,
                    },
                    payload: {
                        instanceId: model.id,
                    },
                });
                action.asyncDispatch(
                    updateDetectedVessel({
                        criteria: {
                            id: detected.id,
                        },
                        payload: {
                            instanceId: model.id,
                        },
                    })
                );
                action.asyncDispatch({ type: 'detected/endProcess' });
            }
        });
        builder.addCase(updateDetected.fulfilled, (state, action) => {
            const { payload, status } = action.payload;
            if (status === 'succeeded' && payload && payload.length > 0) {
                const first = payload[0];
                state.modules[first.id] = first;
            }
        });
        builder.addCase(removeDetected.fulfilled, (state, action) => {
            const { payload, status } = action.payload;
            if (status === 'succeeded' && payload && payload.length > 0) {
                const first = payload[0];
                delete state.modules[first.id];
            }
        });
        builder
            .addCase(fetchDetected.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchDetected.fulfilled, (state, action) => {
                state.status = 'succeeded';
                const [modules, vessels] = action.payload;
                const moduleContainer: Record<string, DetectedModule> = {};
                const vesselContainer: Record<string, DetectedVessel> = {};
                modules.forEach((detected) => {
                    moduleContainer[detected.id] = detected;
                });
                vessels.forEach((detected) => {
                    vesselContainer[detected.id] = detected;
                });
                state.modules = moduleContainer;
                state.vessels = vesselContainer;
            })
            .addCase(fetchDetected.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            });
    },
});

// export const increment = createAction<SourceArgs>(hide);
export const { startProcess, endProcess, cacheModel } = moduleSlice.actions;
export default moduleSlice.reducer;

const select = (state: RootState): DetectedState => state.detected;

export const selectModuleCache = (
    state: RootState
): Record<string, Partial<Module>> => select(state).moduleCache;

export const selectVesselCache = (
    state: RootState
): Record<string, Partial<ModuleVessel>> => select(state).vesselCache;

export const selectVessels = (
    state: RootState
): Record<string, DetectedVessel> => select(state).vessels;

export const selectModules = (
    state: RootState
): Record<string, DetectedModule> => select(state).modules;
