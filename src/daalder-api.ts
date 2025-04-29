import { requireEnv } from './util';
import axios, { AxiosInstance, AxiosResponse } from 'axios';

requireEnv('DAALDER_API_USER_TOKEN');
requireEnv('MM_RAH_MM_RAH_SERVICE_HOST');
requireEnv('MM_RAH_MM_RAH_SERVICE_PORT');

export const daalderConfig = {
           // MM_RAH_MM_RAH_SERVICE_HOST and PORT defined by helm/kubernetes. When service name changes, this var should be changed.
           baseUrl: `http://${process.env.MM_RAH_MM_RAH_SERVICE_HOST}:${process.env.MM_RAH_MM_RAH_SERVICE_PORT}`,
           authToken: `Token ${process.env.DAALDER_API_USER_TOKEN}`,
       };

export const getAllocation = async (data: Object): Promise<Object> => {
    try {
            const response = await axios({
                method: 'post',
                headers: { Authorization: daalderConfig.authToken },
                url: `${daalderConfig.baseUrl}/allocation/allocate/`,
                data: { data: data },
            });

            if (response.status >= 200 && response.status < 300) {
                return response.data;
            } else {
                return new Error('Api request failed');
            }
        } catch (error) {
        console.log('ERROR: ', error);
        if (error.response) {
            console.error('API error response:', error.response.data);
        } else {
            console.error('Api request error message', error.message);
        }
        return error;
    }
};

// New Daalder API client
const api = axios.create({
    baseURL: daalderConfig.baseUrl,
    headers: {
        Authorization: daalderConfig.authToken,
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

api.interceptors.response.use(
    (response: AxiosResponse) => response.data,
    error => {
        if (error.response) {
            console.error('Daalder API error response:', error.response.data);
        } else {
                   console.error('API request error message', error.message);
               }
        throw new Error('Daalder API Requst failed');
    },
);

export const generateAllocation = async (data: Object): Promise<Object> =>
    await api.post('/allocation/allocate/', { data });

export const updateOndernemerKjkEmail = async (email: string, erkenningsNummer: string): Promise<Object> => {
    console.log('Updating email for ondernemer', email, erkenningsNummer);
    // return a dummy promise
    return new Promise(resolve => {
        setTimeout(() => {
            console.log('Dummy promise resolved');
            resolve({ status: 'success' });
        }, 1000);
    });
};
    // await api.post('/ondernemer/update-kjk-email/', { email, erkenningsNummer });
