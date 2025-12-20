const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787/api';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error || 'An error occurred',
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error', 0, { originalError: error.message });
  }
}

export const sitesApi = {
  async getAll({ category = 'all', sort = 'newest', page = 1, limit = 12 } = {}) {
    const params = new URLSearchParams({
      category,
      sort,
      page: page.toString(),
      limit: limit.toString(),
    });
    return fetchApi(`/sites?${params}`);
  },

  async getById(id) {
    return fetchApi(`/sites/${id}`);
  },

  async getSimilar(id) {
    const data = await this.getById(id);
    return data.similarSites || [];
  },
};

export const categoriesApi = {
  async getAll() {
    return fetchApi('/categories');
  },

  async searchSites(query) {
    return fetchApi(`/search?q=${encodeURIComponent(query)}`);
  },

  async getSimilarSites(siteId) {
    return fetchApi(`/sites/${siteId}/similar`);
  }
};

export const healthApi = {
  async check() {
    return fetchApi('/health');
  },
};

export { ApiError };
