import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {RootState} from './store.redux';
import {Users} from '../models/users.model';

interface AuthState {
  isAuthenticated: boolean;
  user: Users | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  refreshToken: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    loginSuccess: (
      state,
      action: PayloadAction<{
        user: Users;
        token: string;
        refreshToken?: string;
      }>,
    ) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken || null;
      state.error = null;
      state.loading = false;
    },
    logout: state => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.error = null;
      state.loading = false;
    },
    updateUser: (state, action: PayloadAction<Partial<Users>>) => {
      if (state.user) {
        state.user = {...state.user, ...action.payload};
      }
    },
    clearError: state => {
      state.error = null;
    },
  },
});

export const authactions = authSlice.actions;
export const {
  setLoading,
  setError,
  loginSuccess,
  logout,
  updateUser,
  clearError,
} = authSlice.actions;
export const authreducer = authSlice.reducer;
export const selectauth = (state: RootState) => state.auth;

