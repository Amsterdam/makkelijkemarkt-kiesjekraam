import * as React from 'react';
import {
    checkLogin,
    getAfwijzingen,
    getOndernemersByMarkt,
    getToewijzingen,
} from './makkelijkemarkt-api';
import {
    combineLatest,
    shareReplay,
    tap,
} from 'rxjs/operators';
import {
    getTimezoneTime,
    requireEnv,
    yyyyMmDdtoDDMMYYYY,
} from './util';
import {
    defer,
} from 'rxjs';
import {
    EmailAfwijzing,
} from './views/components/email/EmailAfwijzing';
import {
    EmailDataUitslag,
} from './views/components/email/EmailDataUitslag';
import {
    EmailToewijzing,
} from './views/components/email/EmailToewijzing';
import {
    getAllUsers,
} from './keycloak-api';
import {
    getMarktenByDate,
} from './model/markt.functions';
import {
    INDELING_DAG_OFFSET,
} from './domain-knowledge';
import {
    mail,
} from './mail.js';
import {
    MMMarkt,
} from './model/makkelijkemarkt.model';
import {
    retry,
} from './rxjs-util';

requireEnv('MAILER_FROM');

const timezoneTime = getTimezoneTime();

console.log("BUILD PARAM, TEST_EMAIL: ", process.env.TEST_EMAIL);
console.log("BUILD PARAM, INDELING_DAG_OFFSET: ", process.env.INDELING_DAG_OFFSET);

if(process.env.INDELING_DAG_OFFSET && process.env.INDELING_DAG_OFFSET != 'false'){
    console.log("Get the day offset from parameter!", process.env.INDELING_DAG_OFFSET);
    timezoneTime.add(parseInt(process.env.INDELING_DAG_OFFSET) , 'days');
}else{
    timezoneTime.add(INDELING_DAG_OFFSET, 'days');
}
const marktDate = timezoneTime.format('YYYY-MM-DD');

const alternativeEmail = 'Marktbureau.kiesjekraam@amsterdam.nl';

const sendAllocationMail = (subject: string, mailTemplate: JSX.Element, emailaddress: string) => {
    if (process.env.TEST_EMAIL && process.env.TEST_EMAIL != 'false') emailaddress = process.env.TEST_EMAIL;
    else if (process.env.APP_ENV === 'acceptance' || process.env.APP_ENV === 'development') emailaddress = alternativeEmail;

    return mail({
        from: process.env.MAILER_FROM,
        to: emailaddress,
        subject,
        react: mailTemplate,
    });
};

const mailToewijzing = (toewijzingenCombined: any, markt: MMMarkt) => {
    const { ondernemer, user, toewijzing } = toewijzingenCombined;

    let mailTemplate = null;
    let subject = null;

    if (markt.kiesJeKraamFase === 'live' || markt.kiesJeKraamFase === 'wenperiode') {
        subject = `Toewijzing ${yyyyMmDdtoDDMMYYYY(marktDate)} ${markt.naam}`;
        mailTemplate = (
            <EmailToewijzing
                subject={subject}
                ondernemer={ondernemer}
                telefoonnummer={markt.telefoonNummerContact}
                toewijzing={toewijzing}
                marktDate={toewijzing.date}
                markt={markt}
                isWenPeriode={markt.kiesJeKraamFase === 'wenperiode'}
            />
        );
    }

    if(user === undefined){
        return sendAllocationMail(subject, mailTemplate, alternativeEmail);
    }
    return sendAllocationMail(subject, mailTemplate, user.email);
};

const mailAfwijzing = (afwijzingCombined: any, markt: MMMarkt) => {
    const { ondernemer, user, afwijzing } = afwijzingCombined;

    let mailTemplate = null;
    let subject = null;

    if (markt.kiesJeKraamFase === 'live' || markt.kiesJeKraamFase === 'wenperiode') {
        (subject = `Niet ingedeeld ${yyyyMmDdtoDDMMYYYY(marktDate)} ${markt.naam}`),
            (mailTemplate = (
                <EmailAfwijzing
                    subject={subject}
                    ondernemer={ondernemer}
                    telefoonnummer={markt.telefoonNummerContact}
                    afwijzing={afwijzing}
                    markt={markt}
                    isWenPeriode={markt.kiesJeKraamFase === 'wenperiode'}
                />
            ));
    }
    if(user === undefined){
        return sendAllocationMail(subject, mailTemplate, alternativeEmail);
    }
    return sendAllocationMail(subject, mailTemplate, user.email);
};

const users$ = defer(() => getAllUsers()).pipe(
    tap(
        () => console.log('Keycloak OK!'),
        e => console.log(`Unable to connect to Keycloak: ${e}`),
    ),
    retry(10, 5000),
    shareReplay(1),
);

const makkelijkeMarkt$ = defer(() => checkLogin()).pipe(
    tap(
        () => console.log('Makkelijke Markt API OK!'),
        () => console.log('Unable to connect to the Makkelijke Markt API'),
    ),
    retry(10, 5000),
    shareReplay(1),
);

makkelijkeMarkt$.pipe(combineLatest(users$)).subscribe(([makkelijkeMarkt, users]) => {
    return getMarktenByDate(marktDate).then(markten => {
        return markten
            .filter(markt => markt.kiesJeKraamFase)
            .filter(markt => markt.kiesJeKraamFase === 'live' || markt.kiesJeKraamFase === 'wenperiode')
            .map(markt =>
                Promise.all([
                    getOndernemersByMarkt(String(markt.id)),
                    getToewijzingen(String(markt.id), marktDate),
                    getAfwijzingen(String(markt.id), marktDate),
                ])
                    .then(([ondernemers, toewijzingen, afwijzingen]) => {
                        console.log(`Verstuur mails voor de marktindeling van ${markt.id} op datum ${marktDate}`);
                        console.log('Marktondernemers', ondernemers ? ondernemers.length : 0);
                        console.log('Toewijzingen', toewijzingen ? toewijzingen.length : 0);
                        console.log('Afwijzingen', afwijzingen ? afwijzingen.length : 0);

                        let toewijzingenCombined = toewijzingen
                            .map(toewijzing => {
                                const ondernemer = ondernemers.find(
                                    ({ erkenningsNummer }) => erkenningsNummer === toewijzing.koopman,
                                );
                                const user = users.find(({ username }) => username === toewijzing.koopman);
                                const tw =  {
                                    toewijzing,
                                    ondernemer,
                                    user,
                                };
                                // console.log(tw);
                                return tw;
                            });

                        if (process.env.APP_ENV === 'production') {
                            toewijzingenCombined = toewijzingenCombined.filter(({ user }) => !!user && !!user.email);
                        }

                        console.log('Toewijzingen combined', toewijzingenCombined ? toewijzingenCombined.length : 0);

                        let afwijzingenCombined = afwijzingen
                            .map(afwijzing => {
                                const ondernemer = ondernemers.find(
                                    ({ erkenningsNummer }) => erkenningsNummer === afwijzing.koopman,
                                );

                                const user = users.find(({ username }) => username === afwijzing.koopman);
                                return {
                                    afwijzing,
                                    ondernemer,
                                    user,
                                };
                            });

                        if (process.env.APP_ENV === 'production') {
                            afwijzingenCombined = afwijzingenCombined.filter(({ user }) => !!user && !!user.email);
                        }

                        console.log('Afwijzingen combined', afwijzingenCombined ? afwijzingenCombined.length : 0);

                        const sendToewijzingen = Promise.all(
                            toewijzingenCombined.map(toewijzingCombined => mailToewijzing(toewijzingCombined, markt)),
                        );
                        const sendAfwijzingen = Promise.all(
                            afwijzingenCombined.map(afwijzingCombined => mailAfwijzing(afwijzingCombined, markt)),
                        );

                        return Promise.all([
                            sendToewijzingen,
                            sendAfwijzingen,
                            sendUitslag(markt, marktDate, toewijzingen, ondernemers, false),
                            markt.kiesJeKraamEmailKramenzetter
                                ? sendUitslag(markt, marktDate, toewijzingen, ondernemers, true)
                                : null,
                        ]).then(result => {
                            console.log(`${result[0].length} toewijzingen verstuurd.`);
                            console.log(`${result[1].length} afwijzingen verstuurd.`);
                            console.log(`Resultaat versturen uitslag naar marktbureau: ${result[2].message}`);
                            console.log(
                                markt.kiesJeKraamEmailKramenzetter
                                    ? `Resultaat versturen uitslag naar kraamzetter: ${result[3].message}`
                                    : 'Geen emailadres kramenzetter in makkelijke markt',
                            );
                            process.exit(0);
                        });
                    })
                    .catch(e => {
                        console.log(e);
                    }),
            );
    });
});

function sendUitslag(markt: any, marktDate: string, toewijzingen: any[], ondernemers: any[], isKraamzetter: boolean) {
    toewijzingen.sort((a, b) => a.plaatsen[0] - b.plaatsen[0]);
    const subject = `${markt.naam} ${yyyyMmDdtoDDMMYYYY(marktDate)}`;
    const mailTemplate = (
        <EmailDataUitslag
            subject={subject}
            toewijzingen={toewijzingen}
            ondernemers={ondernemers}
            marktDate={marktDate}
            markt={markt}
            isKraamzetter={isKraamzetter}
        />
    );
    let to = null;
    if (process.env.APP_ENV === 'production') {
        isKraamzetter
            ? (to = markt.kiesJeKraamEmailKramenzetter)
            : (to = 'Marktbureau.kiesjekraam@amsterdam.nl');
    } else {
        to = alternativeEmail;
    }
    return mail({
        from: process.env.MAILER_FROM,
        to,
        subject,
        react: mailTemplate,
    });
}
