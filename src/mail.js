import nodemailer from 'nodemailer';
import ReactDOMServer from 'react-dom/server';
import {
    requireEnv,
} from './util.ts';
import {
    URL,
} from 'url';

requireEnv('MAILER_URL');

const { username, password, hostname, port, searchParams } = new URL(process.env.MAILER_URL);

const transport = nodemailer.createTransport({
    host: hostname,
    port,
    auth: {
        user: username || searchParams.get('username'),
        pass: password || searchParams.get('password'),
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
