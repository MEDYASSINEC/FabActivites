import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

const shouldRetry = (error) => {
  if (!error.response) return true; // Connection / network error
  const status = error.response.status;
  return status >= 500 || status === 408; // Server errors or request timeout
};

// Response interceptor to auto-retry GET requests every 3 seconds
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { config } = error;
    
    // Only retry GET requests that failed due to temporary network or server issues
    if (config && config.method === 'get' && shouldRetry(error)) {
      console.warn(`La requête GET vers ${config.url} a échoué. Nouvel essai dans 6 secondes...`);
      return new Promise((resolve, reject) => {
        const retryRequest = async () => {
          try {
            const response = await api(config);
            console.log(`La requête GET vers ${config.url} a réussi après réessai.`);
            resolve(response);
          } catch (retryError) {
            if (shouldRetry(retryError)) {
              console.warn(`Nouvel échec pour ${config.url}. Nouvel essai dans 6 secondes...`);
              setTimeout(retryRequest, 6000);
            } else {
              reject(retryError);
            }
          }
        };
        setTimeout(retryRequest, 6000);
      });
    }

    return Promise.reject(error);
  }
);
