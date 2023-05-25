import axios from 'axios';
import express, { NextFunction, Request, Response } from 'express';
import { mmConfig } from '../makkelijkemarkt-api';

const router = express.Router();

router.post('/dispatch', async (req, res) => {
    try {
        const { status, data = {} } = await dispatch(req.body, req.headers.usertoken);
        res.status(status).json(data);
    } catch (error) {
        res.status(error.response.status).json(error.response.data.error);
    }
});

const dispatch = async (body, userToken) => {
    const { action, data = {}, secure = {} } = body;
    console.log('marktmeesterApp dispatch', action, data, `token: ${userToken}`);

    let response = {};
    const headers = userToken ? { authorization: `Bearer ${userToken}` } : {};
    const api = getApi(headers);

    switch (body.action) {
        case 'login':
            response = await api.post('login/basicUsername/', {
                username: data.username,
                password: secure.password,
            });
            return {
                ...response,
                data: {
                    token: response.data.uuid,
                    id: response.data.account.id,
                    name: response.data.account.naam,
                },
            };

        case 'getOndernemerByPasUid':
            return await api.get(`koopman/pasuid/${data.pasUid}`);

        default:
            return {
                status: 400,
                data: 'Invalid action',
            };
    }
};

const getApi = (headers = {}) =>
    axios.create({
        baseURL: mmConfig.baseUrl,
        headers: {
            ...headers,
            MmAppKey: mmConfig.appKey,
        },
    });

export default router;
