import nodemailer from 'nodemailer';
import ReactDOMServer from 'react-dom/server';
import {
    requireEnv,
} from './util.ts';

requireEnv('MAILER_URL');

const transport = nodemailer.createTransport({
    host: process.env.MAILER_HOST,
    port: process.env.MAILER_PORT || '587',
    auth: {
        user: process.env.MAILER_USER,
        pass: process.env.MAILER_PASSWORD
    },
});

export const mail = options => {
    if (options.react) {
        options = {
            ...options,
            html: ReactDOMServer.renderToStaticMarkup(options.react),
        };
    }
    return transport.sendMail(options);
};

module.exports = {
    mail,
};
