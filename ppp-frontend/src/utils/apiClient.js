// utils/apiClient.js

const API_BASE = 'http://localhost:5000/api/v1';

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function requestWithRetry(url, config, options = {}) {
  const response = await fetch(url, config);

  if (response.status === 401 && !options.skipAuthRefresh) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return handleResponse(response);
    }

    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshResponse = await fetch(`${API_BASE}/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const resData = await refreshResponse.json();
          const newPayload = resData.data || resData;
          if (newPayload.accessToken) {
            localStorage.setItem('accessToken', newPayload.accessToken);
          }
          if (newPayload.refreshToken) {
            localStorage.setItem('refreshToken', newPayload.refreshToken);
          }
          isRefreshing = false;
          onRefreshed(newPayload.accessToken);

          // Retry initial request with new token
          const newHeaders = {
            ...config.headers,
            Authorization: `Bearer ${newPayload.accessToken}`,
          };
          const retryResponse = await fetch(url, { ...config, headers: newHeaders });
          return handleResponse(retryResponse);
        } else {
          isRefreshing = false;
          refreshSubscribers = [];
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      } catch (err) {
        isRefreshing = false;
        refreshSubscribers = [];
      }
    } else {
      // Queue requests while token refresh is in progress
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((token) => {
          const newHeaders = {
            ...config.headers,
            Authorization: `Bearer ${token}`,
          };
          fetch(url, { ...config, headers: newHeaders })
            .then(handleResponse)
            .then(resolve)
            .catch(reject);
        });
      });
    }
  }

  return handleResponse(response);
}

export const apiClient = {
  get: (endpoint, options = {}) => {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      method: 'GET',
      ...options,
      headers: getHeaders(options.headers),
    };
    return requestWithRetry(url, config, options);
  },
  post: (endpoint, body, options = {}) => {
    const isFormData = body instanceof FormData;
    const url = `${API_BASE}${endpoint}`;
    const config = {
      method: 'POST',
      ...options,
      headers: isFormData ? getHeadersWithoutJson(options.headers) : getHeaders(options.headers),
      body: isFormData ? body : JSON.stringify(body),
    };
    return requestWithRetry(url, config, options);
  },
  put: (endpoint, body, options = {}) => {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      method: 'PUT',
      ...options,
      headers: getHeaders(options.headers),
      body: JSON.stringify(body),
    };
    return requestWithRetry(url, config, options);
  },
  patch: (endpoint, body = {}, options = {}) => {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      method: 'PATCH',
      ...options,
      headers: getHeaders(options.headers),
      body: JSON.stringify(body),
    };
    return requestWithRetry(url, config, options);
  },
  delete: (endpoint, options = {}) => {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      method: 'DELETE',
      ...options,
      headers: getHeaders(options.headers),
    };
    return requestWithRetry(url, config, options);
  },
};

function getHeaders(customHeaders = {}) {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...customHeaders,
  };
}

function getHeadersWithoutJson(customHeaders = {}) {
  const token = localStorage.getItem('accessToken');
  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...customHeaders,
  };
  delete headers['Content-Type'];
  return headers;
}

async function handleResponse(response) {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  let data;
  if (isJson) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    if (isJson && data.message) {
      throw new Error(data.message);
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return data;
}