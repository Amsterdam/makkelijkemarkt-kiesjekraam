import { requireEnv } from './util';
import axios, { AxiosResponse } from 'axios';

requireEnv('MM_RAH_MM_RAH_SERVICE_HOST');
requireEnv('MM_RAH_MM_RAH_SERVICE_PORT');

// MM_RAH_MM_RAH_SERVICE_HOST and PORT defined by helm/kubernetes. When service name changes, this var should be changed.
export const daalderConfig = {
    baseUrl: `http://${process.env.MM_RAH_MM_RAH_SERVICE_HOST}:${process.env.MM_RAH_MM_RAH_SERVICE_PORT}`,
    api_key: process.env.DAALDER_KJK_API_KEY as string,
};

// New Daalder API client
const api = axios.create({
    baseURL: daalderConfig.baseUrl,
    headers: {
        'Content-Type': 'application/json',
        'kjk-api-key': daalderConfig.api_key,
    },
    timeout: 10000, // 10 seconds timeout
});

api.interceptors.request.use(
    (config) => {
        console.log(`Daalder API Request: ${config.method} ${config.url}`);
        return config;
    },
    (error) => {
        console.error('Error in Daalder API request:', error.message);
        return Promise.reject(error);
    },
);

api.interceptors.response.use(
    (response: AxiosResponse) => {
        console.log(`Daalder API Response: ${response.status} ${response.config.url}`);
        return response.data;
    },
    (error) => {
        if (error.response) {
            console.error('Daalder API error response:', error.response.data);
        } else {
            console.error('API request error message', error.message);
        }
        throw new Error('Daalder API Request failed');
    },
);

export const getAllocation = async (data: Object): Promise<AxiosResponse> =>
    await api.post('/allocation/allocate/', { data });

export const updateOndernemerKjkEmail = async (email: string, erkenningsNummer: string): Promise<AxiosResponse> =>
    await api.post('/kiesjekraam/update-kjk-email/', { email, erkenningsNummer });
