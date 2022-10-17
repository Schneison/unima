import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Slice } from '@reduxjs/toolkit/dist/createSlice';
import MessageBroker from '../../bridge/MessageBroker';

export interface SettingState {
    info: ProgramInfo;
    fetchStatus: AsyncStatus;
    error: string | undefined;
}

const initialState = {
    fetchStatus: 'idle',
    info: {},
} as SettingState;

export const fetchSettings = createAsyncThunk<ProgramInfo>(
    'settings/fetchSettings',
    async () => MessageBroker.parseSettings()
);

const settingsSlice: Slice<SettingState> = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        update(state: SettingState, action: PayloadAction<SettingsEdit>) {
            MessageBroker.updateSettings({
                ...state.info,
                ...action.payload,
            });
        },
    },
    extraReducers(builder) {
        builder
            .addCase(fetchSettings.pending, (state) => {
                state.fetchStatus = 'loading';
            })
            .addCase(fetchSettings.fulfilled, (state, action) => {
                state.fetchStatus = 'succeeded';

                state.info = action.payload;
            })
            .addCase(fetchSettings.rejected, (state, action) => {
                state.fetchStatus = 'failed';
                state.error = action.error.message;
            });
    },
});

export const { update } = settingsSlice.actions;
export default settingsSlice.reducer;
