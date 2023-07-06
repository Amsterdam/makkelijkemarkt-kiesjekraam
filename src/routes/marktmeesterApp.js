import axios from 'axios';
import express, { NextFunction, Request, Response } from 'express';
import { mmConfig } from '../makkelijkemarkt-api';

const router = express.Router();
const INVALID_ACTION = {
    status: 400,
    data: 'Invalid action',
};

router.post('/dispatch', async (req, res) => {
    try {
        const { status, data = {} } = await dispatch(req.body, req.headers.usertoken);
        console.log('happy', { status, action: req.body.action });
        res.status(status).json(data);
    } catch (error) {
        console.log('error', error.response?.data);
        res.status(error.response?.status || 500).json(error.response?.data.error);
    }
});

const dispatch = async (body, userToken) => {
    const { action, data = {}, secure = {} } = body;
    console.log('marktmeesterApp dispatch', { action, data });

    let response = {};
    const headers = userToken ? { authorization: `Bearer ${userToken}` } : {};
    const api = getApi(headers);
    const { marktId, sollId, pasUid, erkenningsnummer, dagvergunning, id } = data;
    let queryString = new URLSearchParams(data).toString();
    queryString = queryString ? '?' + queryString : '';
    console.log(queryString);

    switch (body.action) {
        case 'login':
            response = await api.post('login/basicUsername/', {
                username: secure.username,
                password: secure.password,
            });
            console.log(`marktmeesterApp login user ${response.data.account.id}`);
            return {
                ...response,
                data: {
                    token: response.data.uuid,
                    id: response.data.account.id,
                    name: response.data.account.naam,
                },
            };

        case 'getMarkt':
            if (marktId) {
                return await api.get(`flex/markt/${marktId}`);
            }
            return await api.get(`markt/`);

        case 'getSollicitatie':
            return await api.get(`sollicitaties/markt/${marktId}?listOffset=0&listLength=1000`);

        case 'getOndernemer':
            if (pasUid) {
                return await api.get(`koopman/pasuid/${pasUid}`);
            }
            if (erkenningsnummer) {
                return await api.get(`koopman/erkenningsnummer/${erkenningsnummer}`);
            }
            if (sollId && marktId) {
                return await api.get(`koopman/markt/${marktId}/sollicitatienummer/${sollId}`);
            }
            return INVALID_ACTION;

        case 'findOndernemer':
            if (erkenningsnummer) {
                return await api.get(`koopman/?erkenningsnummer=${erkenningsnummer}`);
            }
            return INVALID_ACTION;

        case 'createDagvergunning':
            if (dagvergunning) {
                return await api.post(`/flex/dagvergunning/`, dagvergunning);
            }
            return INVALID_ACTION;

        case 'deleteDagvergunning':
            return await api.delete(`/dagvergunning/${id}`);

        case 'getDagvergunning':
            return await api.get(`dagvergunning/${queryString}`);

        default:
            return INVALID_ACTION;
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
