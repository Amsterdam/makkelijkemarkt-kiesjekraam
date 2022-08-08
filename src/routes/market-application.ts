import {
    getAanmeldingenByOndernemer,
    getMarktenForOndernemer,
    getOndernemer,
    getVoorkeurenByOndernemer,
    updateRsvp,
    getAllAuditLogs,
} from '../makkelijkemarkt-api';
import {
    HTTP_CREATED_SUCCESS,
    internalServerErrorPage,
} from '../express-util';
import {
    NextFunction,
    Response,
} from 'express';
import {
    getKeycloakUser,
} from '../keycloak-api';
import {
    getMarktThresholdDate,
} from '../domain-knowledge';
import {
    getMededelingen,
} from '../pakjekraam-api';
import {
    GrantedRequest,
} from 'keycloak-connect';
import {
    groupAanmeldingenPerMarktPerWeek,
} from '../model/rsvp.functions';
import {
    IRSVP,
} from '../model/markt.model';
import moment from 'moment-timezone';
import {
    Roles,
} from '../authentication';

moment.locale('nl');

interface RSVPFormData {
    marktId: string;
    marktDate: string;
    attending: string;
}

interface AttendanceFormData {
    erkenningsNummer: string;
    rsvp: RSVPFormData[];
    next: string;
}

interface RSVPsGrouped {
    [marktDate: string]: IRSVP[];
}

const isEqualAanmelding = aanmelding => {
    return a => Number(a.marktId) === Number(aanmelding.marktId) && a.marktDate === aanmelding.marktDate;
};

export const attendancePage = (
    req: GrantedRequest,
    res: Response,
    next: NextFunction,
    role: string,
    erkenningsNummer: string,
    csrfToken: string,
    messages: object[] = [],
    newAanmeldingen?: IRSVP[],
) => {
    const thresholdDate = getMarktThresholdDate(role);
    const ondernemerPromise = getOndernemer(erkenningsNummer);
    const includeInactive = role === Roles.MARKTMEESTER;
    const marktenPromise = getMarktenForOndernemer(ondernemerPromise, includeInactive);
    const aanmeldingenPromise = getAanmeldingenByOndernemer(erkenningsNummer);
    const voorkeurenPromise = getVoorkeurenByOndernemer(erkenningsNummer);

    return Promise.all([ondernemerPromise, aanmeldingenPromise, marktenPromise, getMededelingen(), voorkeurenPromise])
        .then(([ondernemer, aanmeldingen, markten, mededelingen, voorkeuren]) => {
            const sollicitaties = ondernemer.sollicitaties.reduce((result, sollicitatie) => {
                result[sollicitatie.markt.id] = sollicitatie;
                return result;
            }, {});

            if (newAanmeldingen) {
                aanmeldingen = [...aanmeldingen, ...newAanmeldingen].reduce((result, aanmelding) => {
                    const existing = result.find(isEqualAanmelding(aanmelding));
                    if (existing) {
                        return result;
                    }

                    const newAanmelding = newAanmeldingen.find(isEqualAanmelding(aanmelding));
                    return newAanmelding ? result.concat(newAanmelding) : result.concat(aanmelding);
                }, []);
            }

            return [
                ondernemer,
                sollicitaties,
                groupAanmeldingenPerMarktPerWeek(markten, sollicitaties, aanmeldingen, thresholdDate),
                mededelingen,
                voorkeuren,
            ];
        })
        .then(([ondernemer, sollicitaties, aanmeldingenPerMarktPerWeek, mededelingen, voorkeuren]) => {
            res.render('AanwezigheidPage', {
                aanmeldingenPerMarktPerWeek,
                csrfToken,
                mededelingen,
                voorkeuren,
                messages,
                ondernemer,
                role,
                sollicitaties,
                user: getKeycloakUser(req),
            });
        })
        .catch(err => internalServerErrorPage(res)(err));
};

export const handleAttendanceUpdate = (
    req: GrantedRequest,
    res: Response,
    next: NextFunction,
    role: string,
    erkenningsNummer: string,
) => {
    const data: AttendanceFormData = req.body;

    // Geldige marktdagen waarvoor een ondernemer zijn aanwezigheid mag wijzigen
    // vallen binnen dit bereik:
    const startDate = getMarktThresholdDate(role);
    const endDate = moment().day(13).endOf('day').toDate();

    // Converteer form data naar echte RSVP objecten. Deze data wordt ook
    // doorgegeven aan de `attendancePage` call hieronder indien er een error is.
    const rsvpFormData: RSVPFormData[] =
        data.rsvp && !Array.isArray(data.rsvp) ? Object.values(data.rsvp) : data.rsvp || [];
    const rsvps: IRSVP[] = rsvpFormData.map(rsvpData => ({
        ...rsvpData,
        erkenningsNummer,
        attending: rsvpData.attending === '1',
    }));
    // Groepeer alle RSVPs op datum, zodat we voor elke dag eenvoudig kunnen
    // controleren of het aantal aanmeldingen het maximum overschrijdt.
    const rsvpsByDate: RSVPsGrouped = rsvps.reduce((result, rsvp) => {
        const rsvpDate = new Date(`${rsvp.marktDate} 00:00:00`);
        if (rsvpDate < startDate || rsvpDate > endDate) {
            return result;
        }
        if (!result[rsvp.marktDate]) {
            result[rsvp.marktDate] = [];
        }

        result[rsvp.marktDate].push(rsvp);

        return result;
    }, {});

    // Controleer per dag of het maximum wordt overschreden. Zo ja, geef dan een
    // foutmelding weer.
    getOndernemer(erkenningsNummer)
        .then(({ vervangers }): any => {
            const dailyMax = vervangers.length + 1;
            const errorDays = [];

            for (const marktDate in rsvpsByDate) {
                const attending = rsvpsByDate[marktDate].filter(rsvp => rsvp.attending);
                if (attending.length > dailyMax) {
                    errorDays.push(marktDate);
                }
            }

            if (errorDays.length) {
                const errorDaysPretty = errorDays.map(marktDate => moment(marktDate).format('dddd D MMM'));
                const errorMessage = {
                    code: 'error',
                    title: 'Onvoldoende vervangers',
                    message:
                        errorDaysPretty.length === 1
                            ? `U heeft onvoldoende vervangers voor ${errorDaysPretty[0]}`
                            : `U heeft onvoldoende vervangers voor de volgende dagen: ${errorDaysPretty.join(', ')}`,
                };

                attendancePage(req, res, next, role, erkenningsNummer, req.csrfToken(), [errorMessage], rsvps);
                return;
            }

            const queries = Object.keys(rsvpsByDate).reduce((result, marktDate) => {
                return result.concat(
                    rsvpsByDate[marktDate].map(rsvp => {
                        const { marktId, marktDate, attending } = rsvp;
                        return updateRsvp(marktId, marktDate, erkenningsNummer, attending);
                    }),
                );
            }, []);

            Promise.all(queries).then(() => res.status(HTTP_CREATED_SUCCESS).redirect(req.body.next));
        })
        .catch(error => {
            internalServerErrorPage(res)(String(error));
        });
};

export const auditLogPage = async (req: GrantedRequest, res: Response, next: NextFunction, role: string) => {
    const logs = await getAllAuditLogs();

    const tsv = logs2tsv(logs);
    res.attachment('audit_logs.tsv').send(tsv);
};

const logs2tsv = (data): string => {
    if (data.length < 1) {
        return '';
    }
    let tsvString: string = '';
    const header = Object.keys(data[0]);
    tsvString += header.join('\t') + '\n';
    for (const row of data) {
        let stringified = { ...row };
        stringified.result = JSON.stringify(stringified.result);
        stringified.datetime = JSON.stringify(stringified.datetime);

        let values = Object.values(stringified);

        tsvString += values.join('\t') + '\n';
    }

    return tsvString;
};
