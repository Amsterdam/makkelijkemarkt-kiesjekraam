import { getMarktondernemersByMarkt as getMarktondernemersByMarktMM } from '../makkelijkemarkt-api';
import {
    IMarktondernemer,
    IRSVP
} from '../markt.model';

import { MMSollicitatieStandalone } from '../makkelijkemarkt.model';
import { formatOndernemerName } from '../domain-knowledge.js';
// import { dateToYYYYMMDD } from '../util';

import Ondernemer from '../allocation/ondernemer';

export const ondernemerIsAfgemeld = (ondernemer: IMarktondernemer,
    aanmeldingen: IRSVP[],
    currentMarktDate: String): Boolean => {

    const rsvp = aanmeldingen.find(({ erkenningsNummer, marktDate }) =>
        erkenningsNummer === ondernemer.erkenningsNummer && marktDate === currentMarktDate
    );

    // Bij de indeling van VPHs worden alleen expliciete afmeldingen in beschouwing
    // genomen. Anders wordt een VPH automatisch als aangemeld beschouwd.
    if (rsvp && !rsvp.attending) {
        return true;
    } else {
        return false;
    }

    // return Ondernemer.isVast(ondernemer) ?
    //        !rsvp || !!rsvp.attending || rsvp.attending === null :
    //        !!rsvp && !!rsvp.attending;

};

export const ondernemerIsAfgemeldPeriode = (ondernemer: IMarktondernemer,
    aanmeldingen: IRSVP[],
    marktDate: Date): Boolean => {

    const { absentFrom = null, absentUntil = null } = ondernemer.voorkeur || {};
    if (
        absentFrom && absentUntil &&
        marktDate >= new Date(absentFrom) &&
        marktDate <= new Date(absentUntil)
    ) {
        return false;
    }

    const rsvp = aanmeldingen.find(({ erkenningsNummer }) =>
        erkenningsNummer === ondernemer.erkenningsNummer
    );
    // Bij de indeling van VPHs worden alleen expliciete afmeldingen in beschouwing
    // genomen. Anders wordt een VPH automatisch als aangemeld beschouwd.
    return Ondernemer.isVast(ondernemer) ?
           !rsvp || !!rsvp.attending || rsvp.attending === null :
           !!rsvp && !!rsvp.attending;

};

export const convertSollicitatieToOndernemer = (data: MMSollicitatieStandalone): IMarktondernemer => {
    const {
        koopman: { erkenningsnummer },
        sollicitatieNummer,
        status,
        markt,
    } = data;

    return {
        description: formatOndernemerName(data.koopman),
        erkenningsNummer: erkenningsnummer,
        plaatsen: data.vastePlaatsen,
        voorkeur: {
            marktId: String(markt.id),
            erkenningsNummer: erkenningsnummer,
            maximum: Math.max(1, (data.vastePlaatsen || []).length),
        },
        sollicitatieNummer,
        status,
    };
};

export const getOndernemersByMarkt = (marktId: string) =>
    getMarktondernemersByMarktMM(marktId).then(ondernemers =>
        ondernemers.filter(ondernemer => !ondernemer.doorgehaald).map(convertSollicitatieToOndernemer)
    );
