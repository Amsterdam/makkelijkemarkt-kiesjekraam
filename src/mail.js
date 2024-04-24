import nodemailer from 'nodemailer';
import ReactDOMServer from 'react-dom/server';

const mailConfig = {
    host: process.env.MAILER_HOST,
    port: process.env.MAILER_PORT || '587',
    requireTLS: true,
    auth: {
        user: process.env.MAILER_USER,
        pass: process.env.MAILER_PASSWORD
    },
    tls:{
        rejectUnauthorized: false
    }
};

const transport = nodemailer.createTransport(mailConfig);

const logObject = mailConfig;
logObject.auth.pass = '********';

console.log('created mail transport with', logObject);

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
