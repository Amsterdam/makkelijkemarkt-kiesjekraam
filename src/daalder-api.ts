import { HttpMethod } from './makkelijkemarkt-api';
import { requireEnv } from './util';
import axios, { AxiosInstance, AxiosResponse } from 'axios';

requireEnv('DAALDER_API_URL');
requireEnv('MM_RAH_MM_RAH_SERVICE_HOST');
requireEnv('MM_RAH_MM_RAH_SERVICE_PORT');

export const daalderConfig = {
  baseUrl: `${process.env.MM_RAH_MM_RAH_SERVICE_HOST}:${process.env.MM_RAH_MM_RAH_SERVICE_PORT}`
}

const getApi = (): AxiosInstance => {
  return axios.create({
    baseURL: daalderConfig.baseUrl,
    headers: {},
  });
}

// const createHttpFunction = (
//   api: AxiosInstance,
//   httpMethod: HttpMethod,
// ): ((url: string, token: string, data?: any, additionalHeaders?: any) => Promise<AxiosResponse>) => {
//   return (url: string, token: string, data?: JSON, additionalHeaders?): Promise<AxiosResponse> => {
//       console.log('MM-API REQUEST', httpMethod, url);

//       const headers = {
//           ...additionalHeaders,
//           // Authorization: `Bearer ${token}`,
//           // requestStartTime: new Date().getTime(),
//       };

//       switch (httpMethod) {
//           case 'get':
//               return api.get(url, { headers });
//           case 'post':
//               return api.post(url, data, { headers });
//           case 'put':
//               return api.put(url, data, { headers });
//           case 'delete':
//               return api.delete(url, { headers });
//           default:
//               return api.get(url, { headers });
//       }
//   };
// };

// const makeRequest = (url: string, httpMethod: HttpMethod = 'get', data = null) => {
//   const api = getApi();
//   try {
//     switch (httpMethod) {
//       case 'get':
//           return api.get(url, { headers });
//       case 'post':
//           return api.post(url, data, { headers });
//       case 'put':
//           return api.put(url, data, { headers });
//       case 'delete':
//           return api.delete(url, { headers });
//       default:
//           return api.get(url, { headers });
//     }
//   } catch (error) {
//     if (error.response) {
//       console.error('API error response:', )
//     }
//   }
// }

// const apiBase = (url: string, httpMethod: HttpMethod = 'get', request?): Promise<AxiosResponse> => {
//   const api = getApi();

//   const httpFunction = createHttpFunction(api, httpMethod);

//   const requestBody = request ? request.body : null;
//   const headers = request ? request.headers : null;


// }



export const getAllocation = async (data: Object): Promise<Object> => {
  const api = getApi();

  console.log("Get Allocation from ", daalderConfig.baseUrl);
  // console.log(api)
  try {
    const response = await axios({
      method: "post",
      url: `${daalderConfig.baseUrl}/allocate/`,
      data
    });
    console.log("Get Allocation response", response);


    if (response.status >= 200 && response.status < 300) {
      return response.data
    } else {
      return new Error("Api request failed")
    }

  } catch (error) {
    console.log("ERROR: ", error.message)
    if (error.response) {
      console.error("API error response:", error.response.data);
    } else {
      console.error("Api request error message", error.message)
    }
    return error;
  }
}