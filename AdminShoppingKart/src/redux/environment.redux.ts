import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {RootState} from './store.redux';
import {environment} from '../utils/environment';

const initialState = {
  url: environment.baseurl,
};

const environmentslice = createSlice({
  name: 'environment',
  initialState,
  reducers: {
    clear: state => {
      state.url = '';
    },
    setBaseUrl: (state, action: PayloadAction<string>) => {
      state.url = action.payload;
    },
    reset: state => {
      state.url = environment.baseurl;
    },
  },
});

export const environmentactions = environmentslice.actions;
export const {setBaseUrl, reset} = environmentslice.actions;
export const environmentreducers = environmentslice.reducer;
export const selectenvironment = (state: RootState) => state.environment;

