import { requireEnv } from './util';
import axios, { AxiosInstance, AxiosResponse } from 'axios';

requireEnv('DAALDER_API_USER_TOKEN');
requireEnv('MM_RAH_MM_RAH_SERVICE_HOST');
requireEnv('MM_RAH_MM_RAH_SERVICE_PORT');

// MM_RAH_MM_RAH_SERVICE_HOST and PORT defined by helm/kubernetes. When service name changes, this var should be changed.
export const daalderConfig = {
    baseUrl: `http://${process.env.MM_RAH_MM_RAH_SERVICE_HOST}:${process.env.MM_RAH_MM_RAH_SERVICE_PORT}`,
    authToken: `Token ${process.env.DAALDER_API_USER_TOKEN}`,
};

// New Daalder API client
const api = axios.create({
    baseURL: daalderConfig.baseUrl,
    headers: {
        Authorization: daalderConfig.authToken,
        'Content-Type': 'application/json',
        'kjk-api-key': process.env.DAALDER_API_KEY,
    },
    timeout: 10000, // 10 seconds timeout
});

api.interceptors.response.use(
    (response: AxiosResponse) => response.data,
    error => {
        if (error.response) {
            console.error('Daalder API error response:', error.response.data);
        } else {
            console.error('API request error message', error.message);
            console.log('Error:', error);
        }
        // throw new Error('Daalder API Request failed');
    },
);

export const getAllocation = async (data: Object): Promise<Object> =>
    await api.post('/allocation/allocate/', { data: { data } });

export const updateOndernemerKjkEmail = async (email: string, erkenningsNummer: string): Promise<Object> =>
    await api.post('/kiesjekraam/update-kjk-email/', { email, erkenningsNummer });

