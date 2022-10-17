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

export interface FragmentContainer {
    moduleId: string;
    architecture: ArchitectureType;
    options: ArchitectureOptions;
    root: RootMember;
    // Multiple possible status enum values
    status: AsyncStatus;
    error: string | undefined;
}

const initialState = {
    status: 'idle',
    moduleId: '',
    architecture: 'source',
    options: {
        type: 'source',
        sorting: 'ascending',
    },
    error: undefined,
    root: {
        children: [],
        title: '',
        lexicon: {},
    },
} as FragmentContainer;

const select = (state: RootState): FragmentContainer => state.fragments;

export const selectArch = (state: RootState): ArchitectureType =>
    select(state).architecture;

export const selectFragment = (state: RootState): RootMember =>
    select(state).root;

export const selectModule = (state: RootState): string =>
    select(state).moduleId;

export const isLoadingFragment = (state: RootState): boolean =>
    select(state).status === 'loading';

const fetchItems = createAsyncThunk<RootMember, { moduleId: string }>(
    'fragments/fetchItems',
    async (data) => {
        const { moduleId } = data;
        let request = MessageBroker.fetchFragment(moduleId, {
            type: 'source',
            sorting: 'ascending',
        });
        if (request == null) {
            request = Promise.resolve({} as RootMember);
        }
        return request;
    }
);

export const requestFragment =
    (moduleId: string) =>
    (disp: ThunkDispatch<any, any, any>, getState: () => RootState) => {
        const state = getState();
        if (selectModule(state) !== moduleId && !isLoadingFragment(state)) {
            // disp(fetchSources({ moduleId }));
            disp(fetchItems({ moduleId }));
        }
    };

interface SourceArgs {
    sourceId: number;
    section: string;
    sourceIndex: number;
}

interface FragmentActionArgs {
    sourceId: number;
    action: MemberAction;
}

const slice: Slice<FragmentContainer> = createSlice({
    name: 'fragments',
    initialState,
    reducers: {
        hide(_state, payload: PayloadAction<SourceArgs>) {
            const { sourceId } = payload.payload;
            MessageBroker.editSource({
                id: sourceId,
                visible: false,
            });
        },
        show(_state, payload: PayloadAction<SourceArgs>) {
            const { sourceId } = payload.payload;
            MessageBroker.editSource({
                id: sourceId,
                visible: true,
            });
        },

        fragmentAction(state, payload: PayloadAction<FragmentActionArgs>) {
            const { sourceId, action } = payload.payload;
            MessageBroker.applyFragment(sourceId, state.architecture, action);
        },
    },
    extraReducers(builder) {
        builder
            .addCase(fetchItems.pending, (state, action) => {
                const { moduleId } = action.meta.arg;
                state.moduleId = moduleId;
                state.status = 'loading';
            })
            .addCase(fetchItems.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.root = { ...action.payload };
            })
            .addCase(fetchItems.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            });
    },
});

export const { hide, show, fragmentAction } = slice.actions;
export default slice.reducer;
