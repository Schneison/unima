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

export interface StructureContainer {
    moduleId: string;
    root: RootMember;
    status: AsyncStatus;
    error: string | undefined;
}

const initialState = {
    status: 'idle',
    root: {},
} as StructureContainer;

const select = (state: RootState): StructureContainer => state.structures;

export const selectModule = (state: RootState): string =>
    select(state).moduleId;

export const selectRoot = (state: RootState): RootMember => select(state).root;

export const isLoading = (state: RootState): boolean =>
    select(state).status === 'loading';

export const fetchStructure = createAsyncThunk<
    RootMember,
    { moduleId: string }
>('structures/fetchStructure', async (data) => {
    const { moduleId } = data;
    let request = MessageBroker.selectMembers(moduleId);
    if (request == null) {
        request = Promise.resolve({} as RootMember);
    }
    return request;
});

export const requestStructure =
    (moduleId: string) =>
    (disp: ThunkDispatch<any, any, any>, getState: () => RootState) => {
        const state = getState();
        if (selectModule(state) !== moduleId && !isLoading(state)) {
            disp(fetchStructure({ moduleId }));
        }
    };

const slice: Slice<StructureContainer> = createSlice({
    name: 'structures',
    initialState,
    reducers: {
        /**
         * Removes the tag data from the database, that correspond to
         * the given module.
         */
        resetTags(_state, action: PayloadAction<string>) {
            MessageBroker.resetTags(action.payload);
        },
    },
    extraReducers(builder) {
        builder
            .addCase(fetchStructure.pending, (state, action) => {
                const { moduleId } = action.meta.arg;
                state.moduleId = moduleId;
                state.status = 'loading';
            })
            .addCase(fetchStructure.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.root = { ...action.payload };
            })
            .addCase(fetchStructure.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            });
    },
});

export const { resetTags } = slice.actions;
export default slice.reducer;
