import { HttpMethod } from './makkelijkemarkt-api';
import { requireEnv } from './util';
import axios, { AxiosInstance, AxiosResponse } from 'axios';

requireEnv('DAALDER_API_USER_TOKEN');
requireEnv('MM_RAH_MM_RAH_SERVICE_HOST');
requireEnv('MM_RAH_MM_RAH_SERVICE_PORT');


export const daalderConfig = {
  // MM_RAH_MM_RAH_SERVICE_HOST and PORT defined by helm/kubernetes. When service name changes, this var should be changed.
  baseUrl: `${process.env.MM_RAH_MM_RAH_SERVICE_HOST}:${process.env.MM_RAH_MM_RAH_SERVICE_PORT}`,
  authToken: `Token: ${process.env.DAALDER_API_USER_TOKEN}`
}

const getApi = (): AxiosInstance => {
  return axios.create({
    baseURL: daalderConfig.baseUrl,
    headers: {},
  });
}

export const getAllocation = async (data: Object): Promise<Object> => {
  const api = getApi();

  console.log("Get Allocation from ", daalderConfig.baseUrl);
  console.log("with token: ", daalderConfig.authToken);
  console.log("REQ DATA", Object.keys(data))
  try {
    const response = await axios({
      method: "post",
      headers: { "Authorization": daalderConfig.authToken },
      url: `${daalderConfig.baseUrl}/allocation/allocate/`,
      data: {"data": data}
    });
    console.log("Get Allocation response", response);
      

    if (response.status >= 200 && response.status < 300) {
      return response.data
    } else {
      return new Error("Api request failed")
    }

  } catch (error) {
    console.log("ERROR: ", error)
    if (error.response) {
      console.error("API error response:", error.response.data);
    } else {
      console.error("Api request error message", error.message)
    }
    return error;
  }
}