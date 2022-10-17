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

export interface SourceContainer {
    moduleId: string;
    items: SectionRoot;
    // Multiple possible status enum values
    status: AsyncStatus;
    error: string | undefined;
}

const initialState = {
    status: 'idle',
    items: {},
} as SourceContainer;

const select = (state: RootState): SourceContainer => state.sources;

export const selectItems = (state: RootState): SectionRoot =>
    select(state).items;

export const selectModule = (state: RootState): string =>
    select(state).moduleId;

export const isLoadingSource = (state: RootState): boolean =>
    select(state).status === 'loading';

export const fetchItems = createAsyncThunk<SectionRoot, { moduleId: string }>(
    'sources/fetchItems',
    async (data) => {
        const { moduleId } = data;
        let request = MessageBroker.selectSectionItems(moduleId);
        if (request == null) {
            request = Promise.resolve({} as SectionRoot);
        }
        return request;
    }
);

export const requestSource =
    (moduleId: string) =>
    (disp: ThunkDispatch<any, any, any>, getState: () => RootState) => {
        const state = getState();
        if (selectModule(state) !== moduleId && !isLoadingSource(state)) {
            // disp(fetchSources({ moduleId }));
            disp(fetchItems({ moduleId }));
        }
    };

interface SourceArgs {
    sourceId: number;
    section: string;
    sourceIndex: number;
}

const sourceSlice: Slice<SourceContainer> = createSlice({
    name: 'sources',
    initialState,
    reducers: {
        hide(_state, action: PayloadAction<SourceArgs>) {
            const { sourceId } = action.payload;
            MessageBroker.editSource({
                id: sourceId,
                visible: false,
            });
        },
        show(_state, action: PayloadAction<SourceArgs>) {
            const { sourceId } = action.payload;
            MessageBroker.editSource({
                id: sourceId,
                visible: true,
            });
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
                state.items = { ...action.payload };
            })
            .addCase(fetchItems.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            });
    },
});

export const { hide, show } = sourceSlice.actions;
export default sourceSlice.reducer;
