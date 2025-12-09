import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {RootState} from './store.redux';
import {UsersContext} from '../models/users.model';

const initialState = {
  value: new UsersContext(),
};

const usercontextslice = createSlice({
  name: 'usercontext',
  initialState,
  reducers: {
    clear: state => {
      state.value = new UsersContext();
    },
    set: (state, action: PayloadAction<UsersContext>) => {
      state.value = action.payload;
    },
    setFromValidateOtp: (
      state,
      action: PayloadAction<{
        user: any;
        accesstoken: string;
        refreshtoken: string;
      }>,
    ) => {
      state.value.userid = action.payload.user.id || 0;
      state.value.usermobile = action.payload.user.mobilenumber || '';
      state.value.username = action.payload.user.name || '';
      state.value.useremail = action.payload.user.email || '';
      state.value.vendorid = action.payload.user.vendorid || 0;
      state.value.accesstoken = action.payload.accesstoken;
      state.value.refreshtoken = action.payload.refreshtoken;
      state.value.user = action.payload.user;
    },
  },
});

export const usercontextactions = usercontextslice.actions;
export const {clear, set, setFromValidateOtp} = usercontextslice.actions;
export const usercontextreducers = usercontextslice.reducer;
export const selectusercontext = (state: RootState) => state.usercontext;
