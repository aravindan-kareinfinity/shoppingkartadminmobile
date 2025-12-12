import axios, {AxiosResponse} from 'axios';
import {environment} from './environment';
import {store} from '../redux/store.redux';
import {AuthService} from '../services/auth.service';
import {usercontextactions} from '../redux/usercontext.redux';
import {authactions} from '../redux/auth.redux';
import {ErrorCodes} from '../models/actionres.model';

// Initialize auth service
const authService = new AuthService();

// Get base URL from Redux or fallback to environment default
const getBaseUrl = () => {
  try {
    const state = store.getState();
    return state.environment?.url || environment.baseurl;
  } catch {
    return environment.baseurl;
  }
};

// Set the base URL for all axios requests
axios.defaults.baseURL = getBaseUrl();

// Update base URL when Redux state changes
store.subscribe(() => {
  const newBaseUrl = getBaseUrl();
  if (axios.defaults.baseURL !== newBaseUrl) {
    axios.defaults.baseURL = newBaseUrl;
  }
});

// Token refresh queue management
let isRefreshing = false;
let failedQueue: Array<{resolve: Function; reject: Function}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Add request interceptor for logging and authorization
axios.interceptors.request.use(
  async (config) => {
    // Add Authorization header from Redux store or AsyncStorage
    try {
      let token: string | null = null;
      
      // First, try to get token from Redux store
      const rootState = store.getState().usercontext;
      token = rootState.value.accesstoken;
      
      // If not in Redux, try AsyncStorage (fallback for app initialization)
      if (!token) {
        console.log('🔑 Token not in Redux, checking AsyncStorage...');
        token = await authService.getAuthToken();
        
        // If found in AsyncStorage, restore to Redux
        if (token) {
          const refreshToken = await authService.getRefreshToken();
          const user = await authService.getUser();
          
          if (user) {
            console.log('✅ Restoring tokens from AsyncStorage to Redux');
            store.dispatch(
              usercontextactions.setFromValidateOtp({
                user: user,
                accesstoken: token,
                refreshtoken: refreshToken || '',
              })
            );
          }
        }
      }
      
      console.log('🔑 Token check:', {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'NO TOKEN',
        source: rootState.value.accesstoken ? 'Redux' : token ? 'AsyncStorage' : 'None',
      });
      
      // Add Authorization header if token is available
      if (token) {
        config.headers = config.headers || {};
        config.headers['Authorization'] = 'Bearer ' + token;
      }
      
    } catch (error) {
      console.error('❌ Error getting auth token:', error);
    }

    // Set default headers
    config.headers = config.headers || {};
    config.headers['Accept'] = config.headers['Accept'] || 'application/json';
    config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';

    // Build full URL - handle both relative and absolute URLs
    let fullUrl = config.url || '';
    if (fullUrl && !fullUrl.startsWith('http')) {
      // Relative URL - prepend baseURL
      const baseURL = config.baseURL || axios.defaults.baseURL || '';
      fullUrl = baseURL ? `${baseURL}${fullUrl.startsWith('/') ? '' : '/'}${fullUrl}` : fullUrl;
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 API Request Called:');
    console.log('   Method:', config.method?.toUpperCase() || 'UNKNOWN');
    console.log('   Original URL:', config.url);
    console.log('   Base URL:', config.baseURL || axios.defaults.baseURL || 'NONE');
    console.log('   Full Endpoint:', fullUrl);
    console.log('   Headers:', JSON.stringify(config.headers, null, 2));
    if (config.data) {
      console.log('   Request Data:', JSON.stringify(config.data, null, 2));
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response: AxiosResponse) => {
    let fullUrl = response.config.url || '';
    if (fullUrl && !fullUrl.startsWith('http')) {
      const baseURL = response.config.baseURL || axios.defaults.baseURL || '';
      fullUrl = baseURL ? `${baseURL}${fullUrl.startsWith('/') ? '' : '/'}${fullUrl}` : fullUrl;
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ API Response Success:');
    console.log('   Method:', response.config.method?.toUpperCase() || 'UNKNOWN');
    console.log('   Endpoint:', fullUrl);
    console.log('   Status:', response.status, response.statusText);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return response;
  },
  (error: any) => {
    let fullUrl = error.config?.url || 'UNKNOWN';
    if (fullUrl && !fullUrl.startsWith('http')) {
      const baseURL = error.config?.baseURL || axios.defaults.baseURL || '';
      fullUrl = baseURL ? `${baseURL}${fullUrl.startsWith('/') ? '' : '/'}${fullUrl}` : fullUrl;
    }
    
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ API Error Details:');
    console.error('   Method:', error.config?.method?.toUpperCase() || 'UNKNOWN');
    console.error('   Original URL:', error.config?.url || 'UNKNOWN');
    console.error('   Base URL:', error.config?.baseURL || axios.defaults.baseURL || 'NONE');
    console.error('   Full Endpoint:', fullUrl);
    console.error('   Status:', error?.response?.status || 'NO STATUS');
    console.error('   Status Text:', error?.response?.statusText || 'NO STATUS TEXT');
    console.error('   Message:', error?.message || 'NO MESSAGE');
    console.error('   Response Data:', error?.response?.data || 'NO DATA');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    var originalrequest = error.config;

    // Check for SessionExpired error code in response
    const errorCode = error?.response?.data?.code;
    const isSessionExpired = errorCode === ErrorCodes.SessionExpired || errorCode === ErrorCodes.InvalidSession;
    
    // Handle session expiration - logout immediately without attempting refresh
    if (isSessionExpired) {
      console.log('🔐 Session expired - Logging out user');
      
      // Dispatch logout actions immediately (synchronous)
      store.dispatch(usercontextactions.clear());
      store.dispatch(authactions.logout());
      
      // Clear tokens from AsyncStorage (async, but don't wait)
      const authService = new AuthService();
      authService.logout().catch((err) => {
        console.error('Error clearing AsyncStorage during logout:', err);
      });
      
      return Promise.reject(error);
    }

    let statuscode = error?.response?.status;
    if (statuscode == 401 && originalrequest && !originalrequest._retry) {
      console.log('🔐 Unauthorized access (401) - Attempting token refresh');
      
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve: Function, reject: Function) => {
          failedQueue.push({resolve, reject});
        }).then((token: any) => {
          originalrequest.headers = originalrequest.headers || {};
          originalrequest.headers['Authorization'] = 'Bearer ' + token;
          return axios(originalrequest);
        }).catch((err: any) => {
          return Promise.reject(err);
        });
      }

      originalrequest._retry = true;
      isRefreshing = true;

      return new Promise(async (resolve: Function, reject: Function) => {
        const authService = new AuthService();
        try {
          const newToken = await authService.refreshToken();
          
          // Get updated refresh token from AsyncStorage (it was updated in refreshToken method)
          const newRefreshToken = await authService.getRefreshToken();
          
          // Update Redux store with new tokens (keep existing user)
          const rootState = store.getState().usercontext;
          store.dispatch(
            usercontextactions.setFromValidateOtp({
              user: rootState.value.user,
              accesstoken: newToken,
              refreshtoken: newRefreshToken || rootState.value.refreshtoken,
            })
          );

          // Update the original request with new token
          originalrequest.headers = originalrequest.headers || {};
          originalrequest.headers['Authorization'] = 'Bearer ' + newToken;

          // Process queued requests
          processQueue(null, newToken);

          // Retry original request
          resolve(axios(originalrequest));
        } catch (refreshError) {
          // Refresh failed - logout user
          console.error('❌ Token refresh failed:', refreshError);
          processQueue(refreshError, null);
          
          // Clear tokens and logout
          await authService.logout();
          store.dispatch(usercontextactions.clear());
          store.dispatch(authactions.logout());
          
          reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      });
    }
    
    return Promise.reject(error);
  },
);
export {axios};
