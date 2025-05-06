import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

class AuthService {
  constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || '';

    this.setupAxiosInterceptors();
  }

  setupAxiosInterceptors() {
    axios.interceptors.request.use(
      async config => {
        if (!this.needsToken(config.url)) {
          return config;
        }

        const accessToken = localStorage.getItem('accessToken');
        
        if (!accessToken) {
          return config;
        }
        
        try {
          const decodedToken = jwtDecode(accessToken);
          const currentTime = Date.now() / 1000;
          
          if (decodedToken.exp < currentTime + 30) {
            const newAccessToken = await this.refreshToken();
            if (newAccessToken) {
              config.headers.Authorization = `Bearer ${newAccessToken}`;
            }
          } else {
            config.headers.Authorization = `Bearer ${accessToken}`;
          }
        } catch (error) {
          console.error('Error processing token:', error);
          const newAccessToken = await this.refreshToken();
          if (newAccessToken) {
            config.headers.Authorization = `Bearer ${newAccessToken}`;
          }
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );

    axios.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && 
            error.response?.data?.code === 'token_expired' && 
            !originalRequest._retry) {
          
          originalRequest._retry = true;
          
          try {
            const newAccessToken = await this.refreshToken();
            if (newAccessToken) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              return axios(originalRequest);
            }
          } catch (refreshError) {
            this.logout();
            window.location.href = '/login';
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  needsToken(url) {
    const authUrls = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh-token'];
    return !authUrls.some(authUrl => url?.includes(authUrl));
  }

  async login(email, password) {
    try {
      const response = await axios.post(`${this.apiUrl}/api/auth/login`, { email, password });
      
      if (response.data.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      return null;
    }
    
    try {
      const response = await axios.post(`${this.apiUrl}/api/auth/refresh-token`, { 
        refreshToken 
      });
      
      if (response.data.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
        return response.data.accessToken;
      }
      return null;
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.logout();
      return null;
    }
  }

  async logout() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await axios.post(`${this.apiUrl}/api/auth/logout`, { refreshToken });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      return null;
    }
  }

  isLoggedIn() {
    return !!localStorage.getItem('accessToken');
  }

  isAdmin() {
    const user = this.getCurrentUser();
    return user && user.role === 'admin';
  }

  getAccessToken() {
    return localStorage.getItem('accessToken');
  }
}

export default new AuthService();