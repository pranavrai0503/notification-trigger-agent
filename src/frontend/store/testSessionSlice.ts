import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TestSession, TestStatus } from '@backend/types/test-session';

interface TestSessionState {
  currentSession: TestSession | null;
  loading: boolean;
  error: string | null;
}

const initialState: TestSessionState = {
  currentSession: null,
  loading: false,
  error: null,
};

const testSessionSlice = createSlice({
  name: 'testSession',
  initialState,
  reducers: {
    startSession(state) {
      state.loading = true;
      state.error = null;
    },
    setSession(state, action: PayloadAction<TestSession>) {
      state.currentSession = action.payload;
      state.loading = false;
    },
    updateStatus(state, action: PayloadAction<TestStatus>) {
      if (state.currentSession) {
        state.currentSession.status = action.payload;
      }
    },
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
    },
    clearSession(state) {
      state.currentSession = null;
      state.error = null;
      state.loading = false;
    },
  },
});

export const { startSession, setSession, updateStatus, setError, clearSession } =
  testSessionSlice.actions;
export default testSessionSlice.reducer;
