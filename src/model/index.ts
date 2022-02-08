// Copied from https://github.com/sequelize/express-example/
import { URL } from 'url';
import * as path from 'path';
import { Dialect, Sequelize } from 'sequelize';

import { initRSVP } from './rsvp.sequelize';
import { initAllocation } from './allocation.sequelize';
import { initPlaatsvoorkeur } from './plaatsvoorkeur.sequelize';
import { initSession } from './session.sequelize';
import { initVoorkeur } from './voorkeur.model';
import { initAfwijzing } from './afwijzing.sequelize';
import { initLog } from './log';
import { initMarktConfig } from './marktconfig';
import { requireEnv } from '../util';

requireEnv('DATABASE_URL');

const databaseURL = new URL(process.env.DATABASE_URL);
const config = {
    host: databaseURL.hostname,
    port: parseInt(databaseURL.port),
    database: path.basename(databaseURL.pathname),
    username: databaseURL.username,
    password: databaseURL.password,
    dialect: 'postgres' as Dialect,
    timeZone: 'Europe/Amsterdam'
};

export const sequelize = new Sequelize(config.database, config.username, config.password, config);

export const allocation = initAllocation(sequelize);
export const rsvp = initRSVP(sequelize);
export const plaatsvoorkeur = initPlaatsvoorkeur(sequelize);
export const session = initSession(sequelize);
export const voorkeur = initVoorkeur(sequelize);
export const afwijzing = initAfwijzing(sequelize);
export const log = initLog(sequelize);
export const MarktConfig = initMarktConfig(sequelize);

export default {
    allocation,
    plaatsvoorkeur,
    rsvp,
    sequelize,
    Sequelize,
    session,
    voorkeur,
    afwijzing,
    log,
    MarktConfig
};
