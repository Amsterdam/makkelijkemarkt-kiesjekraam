import * as reactViews from 'express-react-views';
import {
    afmeldingenVasteplaatshoudersPage,
    alleOndernemersAanwezigheidLijst,
    ondernemersNietIngedeeldPage,
    sollicitantentAanwezigheidLijst,
    vasteplaatshoudersPage,
    voorrangslijstPage,
} from './routes/markt-marktmeester';
import { attendancePage, handleAttendanceUpdate, auditLogPage } from './routes/market-application';
import {
    directConceptIndelingPage,
    indelingErrorStacktracePage,
    indelingInputJobPage,
    indelingLogsPage,
    indelingPage,
    indelingStatsPage,
    indelingWaitingPage,
    snapshotPage,
} from './routes/market-allocation';
import express, { NextFunction, Request, RequestHandler, Response } from 'express';
// import { getMarkt, getMarkten } from './makkelijkemarkt-api';
import { getMarkt, getMarkten } from './daalder-api';
import { GrantedRequest, TokenContent } from 'keycloak-connect';
import { getQueryErrors, internalServerErrorPage, isAbsoluteUrl } from './express-util';
import { keycloak, Roles, sessionMiddleware, hasEitherRole } from './authentication';
import { isMarktmeester, isMarktondernemer, isMarktBewerker, isKramenzetter } from './roles'
import { keycloakHealth, makkelijkeMarktHealth, serverHealth, serverTime } from './routes/status';
import { langdurigAfgemeld, marktDetail } from './routes/markt';
import { marketPreferencesPage, updateMarketPreferences } from './routes/market-preferences';
import { plaatsvoorkeurenPage, updatePlaatsvoorkeuren } from './routes/market-location';
import { publicProfilePage, toewijzingenAfwijzingenPage } from './routes/ondernemer';
import { getKramenzetterOverzichtPage, getKramenzetterIndelingsPage } from './routes/kramenzetter';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import csrf from 'csurf';
import { dashboardPage } from './routes/dashboard';
import { getAllUsersForExport, getKeycloakUser } from './keycloak-api';
import marktmeesterApp from './routes/marktmeesterApp';
// import mmApiDispatch from './routes/mmApiDispatch';
import daalderApiDispatch from './routes/daalderApiDispatch';
import morgan from 'morgan';
import path from 'path';
import { requireEnv } from './util';
import { updateOndernemerKjkEmail } from './daalder-api';

const csrfProtection = csrf({ cookie: true });

requireEnv('APP_SECRET');

const HTTP_DEFAULT_PORT = 8080;

const getErkenningsNummer = (req: GrantedRequest) => {
    const tokenContent: TokenContent = req.kauth.grant.access_token.content;
    return isMarktondernemer(req) && tokenContent.preferred_username.replace(/\./g, '');
};

const updateOndernemerEmailMiddleware = (req, res, next) => {
    if (isMarktondernemer(req)) {
        const erkenningsNummer = getErkenningsNummer(req);
        const keycloakUser = getKeycloakUser(req);
        const email = keycloakUser.email;
        updateOndernemerKjkEmail(email, erkenningsNummer);
    }
    next();
};

const app = express();

// Trick `keycloak-connect` into thinking we're running on HTTPS
app.set('trust proxy', true);
// Initialize React JSX templates for server-side rendering
app.set('views', path.resolve(__dirname, 'views'));
app.set('view engine', 'jsx');
const templateEngine = reactViews.createEngine({ beautify: true });

app.engine('jsx', templateEngine);
app.engine('tsx', templateEngine);

app.use(morgan(':date[iso] :method :status :url :response-time ms'));

app.get('/status/health', serverHealth);
app.get('/status/time', serverTime);
app.get('/status/keycloak', keycloakHealth);
app.get('/status/makkelijkemarkt', makkelijkeMarktHealth);

app.use((req, res, next) => {
    res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('X-Frame-Options', 'SAMEORIGIN');
    next();
});

app.use(express.urlencoded({ extended: true }) as RequestHandler);
app.use(express.json() as RequestHandler);
app.use(cookieParser());
if (process.env.ENABLE_CORS_FOR_ORIGIN) {
    app.use(cors({ origin: process.env.ENABLE_CORS_FOR_ORIGIN }));
}

// Static files that are public (robots.txt, favicon.ico)
app.use(express.static('./dist/'));

app.use('/bdm/static', express.static('bdm/build/static', { index: false }));
app.get('/kjk/static/*/(*.js|*.css)', function(req, res, next) {
    const contentType = /\.js$/.test(req.url) ? 'application/javascript' : 'text/css';
    res.set('Content-Type', contentType);
    res.set('Content-Encoding', 'gzip');
    req.url = req.url + '.gz';
    next();
});
app.use('/kjk/static', express.static('kjk/build/static', { index: false }));

app.use(sessionMiddleware());
app.use(keycloak.middleware({ logout: '/logout' }));

// Put the login route before the expired redirect to prevent an
// endless loop.
app.get('/login', keycloak.protect(), updateOndernemerEmailMiddleware, (req: GrantedRequest, res: Response) => {
    if (req.query.next) {
        // To prevent open redirects, filter out absolute URLS
        res.redirect(!isAbsoluteUrl(req.query.next) ? req.query.next : '/');
    } else if (isMarktondernemer(req)) {
        res.redirect('/dashboard/');
    } else if (isMarktmeester(req)) {
        res.redirect('/markt/');
    } else if (isKramenzetter(req)) {
        res.redirect('/kramenzetter');
    } else {
        res.redirect('/');
    }
});

app.get('/', (req: Request, res: Response) => {
    res.render('HomePage');
});
app.use('/daalder', daalderApiDispatch);
// app.use('/api', mmApiDispatch);
app.use('/marktmeester', marktmeesterApp);

app.get('/bdm/*', keycloak.protect(Roles.MARKTBEWERKER), (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'bdm', 'build', 'index.html'));
});

app.get('/kjk/ondernemer/:erkenningsNummer/aanwezigheid/markt/:marktId', keycloak.protect(), (req: GrantedRequest, res) => {
    if (isMarktondernemer(req) && req.params.erkenningsNummer === getErkenningsNummer(req)) {
        res.sendFile(path.join(__dirname, '..', 'kjk', 'build', 'index.html'));
    } else if (isMarktmeester(req)) {
        res.sendFile(path.join(__dirname, '..', 'kjk', 'build', 'index.html'));
    } else {
        res.redirect('/');
    }
});

app.get('/kjk/*', keycloak.protect(), (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'kjk', 'build', 'index.html'));
});

app.get('/email/', keycloak.protect(Roles.MARKTMEESTER), (req: Request, res: Response) => {
    res.render('EmailPage');
});

app.get('/job/:jobId/', keycloak.protect(Roles.MARKTMEESTER), indelingWaitingPage);
app.get('/logs/:jobId/', keycloak.protect(Roles.MARKTMEESTER), indelingLogsPage);
app.get('/input/:jobId/', keycloak.protect(Roles.MARKTMEESTER), indelingInputJobPage);
app.get('/error/:jobId/', keycloak.protect(Roles.MARKTMEESTER), indelingErrorStacktracePage);

app.get('/markt/', keycloak.protect(Roles.MARKTMEESTER), (req: GrantedRequest, res: Response) => {
    getMarkten(true).then((markten: any) => {
        res.render(
            'MarktenPage',
            {
                markten,
                role: isMarktBewerker(req) ? Roles.MARKTBEWERKER : Roles.MARKTMEESTER,
                user: getKeycloakUser(req)
            }
        );
    }, internalServerErrorPage(res));
});

app.get(
    '/markt/:marktId/',
    keycloak.protect(Roles.MARKTMEESTER),
    (req: GrantedRequest, res: Response, next: NextFunction) => {
        getMarkt(req.params.marktId)
            .then(markt => {
                res.render('MarktDetailPage', {
                    role: isMarktBewerker(req) ? Roles.MARKTBEWERKER : Roles.MARKTMEESTER,
                    user: getKeycloakUser(req),
                    markt: markt,
                });
            })
            .catch(next);
    },
);

app.get(
    '/markt/:marktId/langdurig-afgemeld',
    keycloak.protect(Roles.MARKTMEESTER),
    (req: GrantedRequest, res: Response, next: NextFunction) =>
        langdurigAfgemeld(
            req,
            res,
            req.params.marktId,
            isMarktBewerker(req) ? Roles.MARKTBEWERKER : Roles.MARKTMEESTER,
        ),
);

app.get(
    '/markt/:marktId/:marktDate/indelingslijst/',
    keycloak.protect(Roles.MARKTMEESTER),
    (req: GrantedRequest, res: Response, next: NextFunction) => indelingPage(req, res, 'wenperiode'),
);

app.get(
    '/markt/:marktId/:marktDate/indeling/',
    keycloak.protect(Roles.MARKTMEESTER),
    (req: GrantedRequest, res: Response, next: NextFunction) => indelingPage(req, res, 'indeling'),
);

app.get(
    '/markt/:marktId/:marktDate/direct-concept-indelingslijst/',
    keycloak.protect(Roles.MARKTMEESTER),
    (req: GrantedRequest, res: Response, next: NextFunction) => directConceptIndelingPage(req, res),
);

app.get(
    '/markt/:marktId/:marktDate/indeling-stats/',
    keycloak.protect(Roles.MARKTMEESTER),
    (req: GrantedRequest, res: Response, next: NextFunction) => indelingStatsPage(req, res),
);

app.get(
    '/markt/:marktId/:marktDate/snapshot/',
    keycloak.protect(Roles.MARKTBEWERKER),
    (req: GrantedRequest, res: Response, next: NextFunction) => snapshotPage(req, res),
);

app.get('/markt/:marktId/:datum/vasteplaatshouders/', keycloak.protect(Roles.MARKTMEESTER), vasteplaatshoudersPage);

app.get('/markt/:marktId/:datum/a-b-lijst/', keycloak.protect(Roles.MARKTMEESTER), voorrangslijstPage);

app.get(
    '/markt/:marktId/:datum/ondernemers-niet-ingedeeld/',
    keycloak.protect(Roles.MARKTMEESTER),
    ondernemersNietIngedeeldPage,
);

app.get(
    '/markt/:marktId/:datum/voorrangslijst/',
    keycloak.protect(Roles.MARKTMEESTER),
    sollicitantentAanwezigheidLijst,
);

app.get(
    '/markt/:marktId/:datum/alle-sollicitanten/',
    keycloak.protect(Roles.MARKTMEESTER),
    sollicitantentAanwezigheidLijst,
);

app.get(
    '/markt/:marktId/:datum/alle-ondernemers/',
    keycloak.protect(Roles.MARKTMEESTER),
    alleOndernemersAanwezigheidLijst,
);

app.get(
    '/markt/:marktId/:datum/afmeldingen-vasteplaatshouders/',
    keycloak.protect(Roles.MARKTMEESTER),
    afmeldingenVasteplaatshoudersPage,
);

app.get(
    '/dashboard/',
    keycloak.protect(Roles.MARKTONDERNEMER),
    (req: GrantedRequest, res: Response, next: NextFunction) => {
        dashboardPage(req, res, next, getErkenningsNummer(req));
    },
);

app.get(
    '/kramenzetter/',
    keycloak.protect(Roles.KRAMENZETTER),
    (req: GrantedRequest, res: Response, next: NextFunction) => {
        getKramenzetterOverzichtPage(req, res, next)
    }
)

app.get(
    '/kramenzetter/:marktId/:datum/indeling/',
    keycloak.protect(Roles.KRAMENZETTER),
    (req: GrantedRequest, res: Response, next) => {
        getKramenzetterIndelingsPage(req, res, next)
    }
)

// Registratie & Activatie
// -----------------------
const registrationAndActivation = require('./routes/registration')();
app.use(registrationAndActivation);

app.get(
    '/ondernemer/:erkenningsNummer/aanwezigheid/',
    keycloak.protect(Roles.MARKTMEESTER),
    csrfProtection,
    (req: GrantedRequest, res: Response, next: NextFunction) => {
        const messages = getQueryErrors(req.query);
        attendancePage(
            req,
            res,
            next,
            isMarktBewerker(req) ? Roles.MARKTBEWERKER : Roles.MARKTMEESTER,
            req.params.erkenningsNummer,
            req.csrfToken(),
            messages
        );
    }
)

app.post(
    '/ondernemer/:erkenningsNummer/aanwezigheid/',
    keycloak.protect(Roles.MARKTBEWERKER),
    csrfProtection,
    (req: GrantedRequest, res: Response, next: NextFunction) => {
        handleAttendanceUpdate(req, res, next, Roles.MARKTBEWERKER, req.params.erkenningsNummer);
    },
);

app.get(
    '/aanwezigheid/',
    keycloak.protect(Roles.MARKTONDERNEMER),
    csrfProtection,
    (req: GrantedRequest, res: Response, next: NextFunction) => {
        const messages = getQueryErrors(req.query);
        attendancePage(req, res, next, Roles.MARKTONDERNEMER, getErkenningsNummer(req), req.csrfToken(), messages);
    },
);

app.post(
    '/aanwezigheid/',
    keycloak.protect(Roles.MARKTONDERNEMER),
    csrfProtection,
    (req: GrantedRequest, res: Response, next: NextFunction) => {
        handleAttendanceUpdate(req, res, next, Roles.MARKTONDERNEMER, getErkenningsNummer(req));
    },
);

app.get(
    '/voorkeuren/:marktId/',
    keycloak.protect(Roles.MARKTONDERNEMER),
    csrfProtection,
    (req: GrantedRequest, res: Response) => {
        plaatsvoorkeurenPage(
            req,
            res,
            getErkenningsNummer(req),
            req.query,
            req.params.marktId,
            Roles.MARKTONDERNEMER,
            req.csrfToken(),
        );
    },
);

app.post(
    ['/voorkeuren/:marktId/'],
    keycloak.protect(Roles.MARKTONDERNEMER),
    csrfProtection,
    (req: GrantedRequest, res: Response, next: NextFunction) => {
        if (req.body['minimum'] === undefined) {
            req.body['minimum'] = parseInt(req.body['maximum']) - parseInt(req.body['extra-count']);
        }
        return updatePlaatsvoorkeuren(req, res, next, req.params.marktId, getErkenningsNummer(req));
    },
);

app.get(
    '/ondernemer/:erkenningsNummer/voorkeuren/:marktId/',
    keycloak.protect(Roles.MARKTMEESTER),
    csrfProtection,
    (req: GrantedRequest, res: Response) => {
        plaatsvoorkeurenPage(
            req,
            res,
            req.params.erkenningsNummer,
            req.query,
            req.params.marktId,
            isMarktBewerker(req) ? Roles.MARKTBEWERKER : Roles.MARKTMEESTER,
            req.csrfToken(),
        );
    },
);

app.post(
    '/ondernemer/:erkenningsNummer/voorkeuren/:marktId/',
    keycloak.protect(Roles.MARKTBEWERKER),
    csrfProtection,
    (req: GrantedRequest, res: Response, next: NextFunction) =>
        updatePlaatsvoorkeuren(req, res, next, req.params.marktId, req.params.erkenningsNummer),
);

app.get(
    '/markt-detail/:marktId/',
    keycloak.protect(Roles.MARKTONDERNEMER),
    (req: GrantedRequest, res: Response, next: NextFunction) =>
        marktDetail(req, res, next, getErkenningsNummer(req), Roles.MARKTONDERNEMER),
);

app.get(
    '/ondernemer/:erkenningsNummer/markt-detail/:marktId/',
    keycloak.protect(Roles.MARKTMEESTER),
    (req: GrantedRequest, res: Response, next: NextFunction) =>
        marktDetail(req, res, next, req.params.erkenningsNummer, Roles.MARKTMEESTER),
);

app.get(
    '/algemene-voorkeuren/:marktId/',
    keycloak.protect(Roles.MARKTONDERNEMER),
    csrfProtection,
    (req: GrantedRequest, res: Response) => {
        marketPreferencesPage(
            req,
            res,
            getErkenningsNummer(req),
            req.params.marktId,
            Roles.MARKTONDERNEMER,
            req.csrfToken(),
        );
    },
);

app.post(
    '/algemene-voorkeuren/:marktId/',
    keycloak.protect(Roles.MARKTONDERNEMER),
    csrfProtection,
    (req: GrantedRequest, res: Response, next: NextFunction) =>
        updateMarketPreferences(req, res, next, getErkenningsNummer(req), Roles.MARKTONDERNEMER),
);

app.get(
    '/ondernemer/:erkenningsNummer/algemene-voorkeuren/:marktId/',
    keycloak.protect(token => hasEitherRole([Roles.MARKTBEWERKER, Roles.MARKTMEESTER], token)),
    csrfProtection,
    (req: GrantedRequest, res: Response) => {
        marketPreferencesPage(
            req,
            res,
            req.params.erkenningsNummer,
            req.params.marktId,
            isMarktBewerker(req) ? Roles.MARKTBEWERKER : Roles.MARKTMEESTER,
            req.csrfToken(),
        );
    },
);

app.post(
    '/ondernemer/:erkenningsNummer/algemene-voorkeuren/:marktId/',
    keycloak.protect(token => hasEitherRole([Roles.MARKTBEWERKER, Roles.MARKTMEESTER], token)),
    csrfProtection,
    (req: GrantedRequest, res: Response, next: NextFunction) =>
        updateMarketPreferences(
            req,
            res,
            next,
            req.params.erkenningsNummer,
            isMarktBewerker(req) ? Roles.MARKTBEWERKER : Roles.MARKTMEESTER,
        ),
);

app.get('/profile/:erkenningsNummer', keycloak.protect(Roles.MARKTMEESTER), (req: GrantedRequest, res: Response) =>
    publicProfilePage(
        req,
        res,
        req.params.erkenningsNummer,
        isMarktBewerker(req) ? Roles.MARKTBEWERKER : Roles.MARKTMEESTER,
    ),
);

app.get(
    '/ondernemer/:erkenningsNummer/toewijzingen-afwijzingen/',
    keycloak.protect(Roles.MARKTMEESTER),
    (req: GrantedRequest, res: Response) =>
        toewijzingenAfwijzingenPage(req, res, req.params.erkenningsNummer, Roles.MARKTMEESTER),
);

app.get('/toewijzingen-afwijzingen/', keycloak.protect(Roles.MARKTONDERNEMER), (req: GrantedRequest, res: Response) =>
    toewijzingenAfwijzingenPage(req, res, getErkenningsNummer(req), Roles.MARKTONDERNEMER),
);

app.get(
    '/audit-logs/',
    keycloak.protect(Roles.MARKTMEESTER),
    (req: GrantedRequest, res: Response, next: NextFunction) => {
        auditLogPage(req, res, next, Roles.MARKTMEESTER);
    },
);

app.get(
    '/export-users/',
    keycloak.protect(Roles.MARKTBEWERKER),
    (req: GrantedRequest, res: Response) => {
        getAllUsersForExport().then((csv) => {
            res.attachment('users_export.csv').send(csv);
        })
    },
)

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    if (process.env.APP_ENV === 'production') {
        res.render('ErrorPage', { errorCode: 500, req });
    } else {
        res.render('ErrorPage', { message: err.message, stack: err.stack, errorCode: 500, req });
    }
});

const port = process.env.PORT || HTTP_DEFAULT_PORT;

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
