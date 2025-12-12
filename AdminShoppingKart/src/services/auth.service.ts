import AsyncStorage from '@react-native-async-storage/async-storage';
import {Users} from '../models/users.model';

const AUTH_TOKEN_KEY = '@auth_token';
const REFRESH_TOKEN_KEY = '@refresh_token';
const USER_KEY = '@user';

export class AuthService {
  async setAuthToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Error saving auth token:', error);
    }
  }

  async getAuthToken(): Promise<string | null> {
    try {
      // First, try to get auth token from Redux store
      const store = require('../redux/store.redux').store;
      const state = store.getState();
      const tokenFromRedux = state?.usercontext?.value?.accesstoken;
      
      if (tokenFromRedux) {
        return tokenFromRedux;
      }
      
      // Fallback to AsyncStorage
      return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  async setRefreshToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Error saving refresh token:', error);
    }
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      // First, try to get refresh token from Redux store
      const store = require('../redux/store.redux').store;
      const state = store.getState();
      const refreshTokenFromRedux = state?.usercontext?.value?.refreshtoken;
      
      if (refreshTokenFromRedux) {
        return refreshTokenFromRedux;
      }
      
      // Fallback to AsyncStorage
      return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  async setUser(user: Users): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user:', error);
    }
  }

  async getUser(): Promise<Users | null> {
    try {
      const userJson = await AsyncStorage.getItem(USER_KEY);
      if (userJson) {
        return JSON.parse(userJson) as Users;
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAuthToken();
    return token !== null;
  }

  async logout(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  async refreshToken(): Promise<string> {
    const refreshToken = await this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const {UsersService} = await import('./users.service');
    const usersService = new UsersService();
    
    const response = await usersService.refreshToken({
      refreshtoken: refreshToken,
    });

    // Update tokens in both AsyncStorage and Redux
    await this.setAuthToken(response.accesstoken);
    if (response.refreshtoken) {
      await this.setRefreshToken(response.refreshtoken);
    }
    
    // Update Redux store with new tokens (always update, even if no new refresh token)
    const store = require('../redux/store.redux').store;
    const {usercontextactions} = require('../redux/usercontext.redux');
    const rootState = store.getState().usercontext;
    
    // Update Redux with new tokens while keeping existing user
    store.dispatch(
      usercontextactions.setFromValidateOtp({
        user: rootState.value.user,
        accesstoken: response.accesstoken,
        refreshtoken: response.refreshtoken || rootState.value.refreshtoken,
      })
    );

    return response.accesstoken;
  }
}

export const authService = new AuthService();
