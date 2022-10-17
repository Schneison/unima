import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Slice } from '@reduxjs/toolkit/dist/createSlice';
import { dispatchModelAction, modelAction } from './model_helper';

export interface ModuleState {
    modules: ModuleContainer;
    modulesByVessel: Record<string, string[]>;
    vessels: VesselContainer;
    modulesStatus: AsyncStatus;
    vesselsStatus: AsyncStatus;
    error: string | undefined;
}

export interface ModuleContainer {
    [moduleId: string]: Module;
}

export interface VesselContainer {
    [vesselId: string]: ModuleVessel;
}

const initialState = {
    modulesStatus: 'idle',
    vesselsStatus: 'idle',
    modulesByVessel: {},
    modules: {},
    vessels: {},
} as ModuleState;

export const fetchVessels = createAsyncThunk<ModuleVessel[]>(
    'module/fetchVessels',
    async () => {
        return window.electron.ipcRenderer
            .applyAction({
                repository: 'vessels',
                type: 'select',
            })
            .then((result) => result.payload ?? []);
    }
);

export const addVessel = createAsyncThunk<
    ModelResult<'vessels'>,
    { payload: ModuleVessel }
>('modules/addVessel', async (data, thunkAPI) => {
    const { payload } = data;
    return window.electron.ipcRenderer
        .applyAction({
            repository: 'vessels',
            type: 'insert',
            payload,
        })
        .then(dispatchModelAction('vessels', 'insert', thunkAPI.dispatch));
});

export const updateVessel = createAsyncThunk<
    ModelResult<'vessels'>,
    { payload: Partial<ModuleVessel>; criteria?: Criteria<ModuleVessel> }
>('modules/updateVessel', async (data, thunkAPI) => {
    const { payload, criteria } = data;
    return window.electron.ipcRenderer
        .applyAction({
            repository: 'vessels',
            type: 'update',
            payload,
            criteria,
        })
        .then(dispatchModelAction('vessels', 'update', thunkAPI.dispatch));
});

export const removeVessel = createAsyncThunk<
    ModelResult<'vessels'>,
    { criteria?: Criteria<ModuleVessel> }
>('module/removeVessel', async (data, thunkAPI) => {
    const { criteria } = data;
    return window.electron.ipcRenderer
        .applyAction({
            repository: 'vessels',
            type: 'delete',
            criteria,
        })
        .then(dispatchModelAction('vessels', 'delete', thunkAPI.dispatch));
});

export const fetchModules = createAsyncThunk<Module[]>(
    'modules/fetchModules',
    async () => {
        return window.electron.ipcRenderer
            .applyAction({
                repository: 'modules',
                type: 'select',
            })
            .then((result) => result.payload ?? []);
    }
);

export const addModule = createAsyncThunk<
    ModelResult<'modules'>,
    { payload: Module }
>('modules/addModule', async (data, thunkAPI) => {
    const { payload } = data;
    return window.electron.ipcRenderer
        .applyAction({
            repository: 'modules',
            type: 'insert',
            payload,
        })
        .then(dispatchModelAction('modules', 'insert', thunkAPI.dispatch));
});

export const updateModule = createAsyncThunk<
    ModelResult<'modules'>,
    { payload: Partial<Module>; criteria?: Criteria<Module> }
>('modules/updateModule', async (data, thunkAPI) => {
    const { payload, criteria } = data;
    return window.electron.ipcRenderer
        .applyAction({
            repository: 'modules',
            type: 'update',
            payload,
            criteria,
        })
        .then(dispatchModelAction('modules', 'update', thunkAPI.dispatch));
});

export const removeModule = createAsyncThunk<
    ModelResult<'modules'>,
    { criteria?: Criteria<Module> }
>('modules/removeModule', async (data, thunkAPI) => {
    const { criteria } = data;
    return window.electron.ipcRenderer
        .applyAction({
            repository: 'modules',
            type: 'delete',
            criteria,
        })
        .then(dispatchModelAction('modules', 'delete', thunkAPI.dispatch));
});

const moduleSlice: Slice<ModuleState> = createSlice({
    name: 'modules',
    initialState,
    reducers: {},
    extraReducers(builder) {
        builder.addCase(addVessel.fulfilled, (state, action) => {
            const { payload, status } = action.payload;
            if (status === 'succeeded' && payload && payload.length > 0) {
                const first = payload[0];
                state.vessels[first.id] = first;
            }
        });
        builder.addCase(updateVessel.fulfilled, (state, action) => {
            const { payload, status } = action.payload;
            if (status === 'succeeded' && payload && payload.length > 0) {
                const first = payload[0];
                state.vessels[first.id] = first;
            }
        });
        builder.addCase(removeVessel.fulfilled, (state, action) => {
            const { payload, status } = action.payload;
            if (status === 'succeeded' && payload && payload.length > 0) {
                const first = payload[0];
                delete state.vessels[first.id];
            }
        });
        builder.addCase(addModule.fulfilled, (state, action) => {
            const { payload, status } = action.payload;
            if (status === 'succeeded' && payload && payload.length > 0) {
                const first = payload[0];
                state.modules[first.id] = first;
            }
        });
        builder.addCase(updateModule.fulfilled, (state, action) => {
            const { payload, status } = action.payload;
            if (status === 'succeeded' && payload && payload.length > 0) {
                const first = payload[0];
                state.modules[first.id] = first;
            }
        });
        builder.addCase(removeModule.fulfilled, (state, action) => {
            const { payload, status } = action.payload;
            if (status === 'succeeded' && payload && payload.length > 0) {
                const first = payload[0];
                delete state.modules[first.id];
            }
        });
        builder
            .addCase(fetchModules.pending, (state) => {
                state.modulesStatus = 'loading';
            })
            .addCase(fetchModules.fulfilled, (state, action) => {
                state.modulesStatus = 'succeeded';

                const container: ModuleContainer = {};
                action.payload.forEach((module) => {
                    container[module.id] = module;
                    const newModules = new Set(
                        state.modulesByVessel[module.vessel]
                    );
                    newModules.add(module.id);
                    state.modulesByVessel[module.vessel] =
                        Array.from(newModules);
                });
                state.modules = container;
            })
            .addCase(fetchModules.rejected, (state, action) => {
                state.modulesStatus = 'failed';
                state.error = action.error.message;
            });
        builder
            .addCase(fetchVessels.pending, (state) => {
                state.vesselsStatus = 'loading';
            })
            .addCase(fetchVessels.fulfilled, (state, action) => {
                state.vesselsStatus = 'succeeded';

                const container: VesselContainer = {};
                action.payload.forEach((vessel) => {
                    container[vessel.id] = vessel;
                });
                state.vessels = container;
            })
            .addCase(fetchVessels.rejected, (state, action) => {
                state.vesselsStatus = 'failed';
                state.error = action.error.message;
            })
            .addCase(modelAction, (state, action) => {
                const { repository, type, models } = action.payload;
                const model: Module =
                    models && models.length > 0 ? models[0] : undefined;
                if (!model) {
                    return;
                }
                if (repository !== 'modules') {
                    return;
                }
                const oldModule = state.modules[model.id];
                if (type === 'delete') {
                    delete state.modules[model.id];
                } else {
                    state.modules[model.id] = model;
                }
                if (
                    oldModule != null &&
                    (oldModule.vessel !== model.vessel || type === 'delete')
                ) {
                    const oldModules = new Set(
                        state.modulesByVessel[oldModule.vessel]
                    );
                    oldModules.delete(oldModule.id);
                    state.modulesByVessel[oldModule.vessel] =
                        Array.from(oldModules);
                }

                if (type !== 'delete') {
                    const newModules = new Set(
                        state.modulesByVessel[model.vessel]
                    );
                    newModules.add(model.id);
                    state.modulesByVessel[model.vessel] =
                        Array.from(newModules);
                }
            });
    },
});

export default moduleSlice.reducer;
