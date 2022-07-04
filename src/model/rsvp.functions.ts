import {
    filterRsvpList,
    isVast,
} from '../domain-knowledge';
import {
    MMMarkt,
    MMSollicitatie,
} from './makkelijkemarkt.model';
import {
    IRSVP, IRsvpPattern,
} from 'model/markt.model';
import moment from 'moment-timezone';

const { endOfWeek } = require('../util.ts');

export const groupAanmeldingenPerMarktPerWeek = (
    markten: MMMarkt[],
    sollicitaties: { [marktId: string]: MMSollicitatie },
    aanmeldingen: IRSVP[],
    thresholdDate: Date,
): object[] => {
    const currentWeek = moment().week();
    const nextWeek = moment().add(1, 'weeks').week();

    const aanmeldingenPerMarkt = aanmeldingen.reduce((result, aanmelding) => {
        const marktWeek = moment(aanmelding.marktDate).week();

        if (marktWeek !== currentWeek && marktWeek !== nextWeek) {
            return result;
        }

        const marktId = aanmelding.marktId;
        result[marktId] = result[marktId] ? result[marktId].concat(aanmelding) : [aanmelding];

        return result;
    }, {}
    );

    const aanmeldingenPerMarktPerWeek = markten.map(markt => {
        const aanmeldingen = (aanmeldingenPerMarkt[markt.id] || []).filter(
            ({ marktId }) => Number(marktId) === Number(markt.id),
        );
        const aanmeldingenPerDag = filterRsvpList(aanmeldingen, markt);

        const aanmeldingenPerWeek = aanmeldingenPerDag.reduce(
            (result, { date, rsvp }) => {
                // Voeg de tijd toe, zodat we een datum in de huidige tijdszone krijgen.
                // Doen we dit niet, dan wordt de datum ingesteld op UTC. Aangezien wij in de
                // zomer op UTC+2 zitten is de datumwissel bij ons twee uur eerder. Gebruikers
                // zouden in dit geval twee uur na de automatische indeling hun aanwezigheid nog
                // kunnen aanpassen
                date = new Date(`${date} 00:00:00`);

                const week = date > new Date(endOfWeek()) ? 1 : 0;
                const weekDay = date.getDay();
                const attending = rsvp ? rsvp.attending : isVast(sollicitaties[markt.id].status);
                const isInThePast = date < thresholdDate;

                result[week][weekDay] = {
                    date,
                    attending,
                    isInThePast,
                };

                return result;
            },
            [{}, {}],
        );

        return {
            markt,
            aanmeldingenPerWeek,
        };
    });
    return aanmeldingenPerMarktPerWeek;
};

export const rsvpPatternPerMarkt = (
    markten: MMMarkt[],
    rsvpPatronen: IRsvpPattern[]
) : {[key: string]: IRsvpPattern} => {
    const marktIds : number[] = markten.map(markt => +markt.id);

    // Filter RsvpPatterns for given markets
    const rsvpPatronenInMarkten = rsvpPatronen.filter(rsvpPattern => marktIds.includes(+rsvpPattern.markt));
    // Maps RsvpPattern to markt {marktId: pattern, ...}
    return rsvpPatronenInMarkten.reduce((prev, cur)  => ({...prev, [cur.markt]: cur}), {});
}
