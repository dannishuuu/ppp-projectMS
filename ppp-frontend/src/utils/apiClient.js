// utils/apiClient.js

const API_BASE = 'http://localhost:5000/api/v1';

// Simple fetch wrapper
export const apiClient = {
  get: (endpoint, options = {}) => {
    return fetch(`${API_BASE}${endpoint}`, {
      method: 'GET',
      ...options,
      headers: getHeaders(options.headers),
    }).then(handleResponse);
  },
  post: (endpoint, body, options = {}) => {
    const isFormData = body instanceof FormData;
    return fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      ...options,
      headers: isFormData ? getHeadersWithoutJson(options.headers) : getHeaders(options.headers),
      body: isFormData ? body : JSON.stringify(body),
    }).then(handleResponse);
  },
  put: (endpoint, body, options = {}) => {
    return fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      ...options,
      headers: getHeaders(options.headers),
      body: JSON.stringify(body),
    }).then(handleResponse);
  },
  patch: (endpoint, body = {}, options = {}) => {
    return fetch(`${API_BASE}${endpoint}`, {
      method: 'PATCH',
      ...options,
      headers: getHeaders(options.headers),
      body: JSON.stringify(body),
    }).then(handleResponse);
  },
  delete: (endpoint, options = {}) => {
    return fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      ...options,
      headers: getHeaders(options.headers),
    }).then(handleResponse);
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
  // Remove Content-Type if it's set (browser will set it automatically for FormData)
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