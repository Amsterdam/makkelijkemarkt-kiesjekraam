import fs from 'fs';
import moment from 'moment';
const {
    ISO_SUNDAY,
    ISO_MONDAY,
    ISO_TUESDAY,
    ISO_WEDNESDAY,
    ISO_THURSDAY,
    ISO_FRIDAY,
    ISO_SATURDAY,
    FRIDAY,
    SATURDAY,
    SUNDAY,
    MILLISECONDS_IN_DAY,
    DAYS_IN_WEEK,
    toISODate,
    addDays,
    endOfWeek,
    stringSort,
    getMaDiWoDo,
    getTimezoneTime,
    getDateWithTimezone,
} = require('./util.ts');
const {
    DeelnemerStatus,
} = require('./model/markt.model.ts');

const dagen = {
    zo: 0,
    ma: 1,
    di: 2,
    wo: 3,
    do: 4,
    vr: 5,
    za: 6,
};

export const parseMarktDag = dag => (dagen.hasOwnProperty(dag) ? dagen[dag] : -1);

const isoMarktDagen = {
    ma: ISO_MONDAY,
    di: ISO_TUESDAY,
    wo: ISO_WEDNESDAY,
    do: ISO_THURSDAY,
    vr: ISO_FRIDAY,
    za: ISO_SATURDAY,
    zo: ISO_SUNDAY,
};

export const DAYS_CLOSED = (function() {
    try {
        const data = fs.readFileSync(`${__dirname}/../config/markt/daysClosed.json`, 'utf8');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error(`Could not read JSON file: config/markt/daysClosed.json`);
        process.exit(1);
    }
})();

export const A_LIJST_DAYS = [FRIDAY, SATURDAY, SUNDAY];

const INDELINGSTIJDSTIP = { hours: 15, minutes: 0 };
const INDELINGSTIJDSTIP_TEXT = "3 uur 's middags";
const MAILINGSTIJDSTIP_DELTA = { hours: 0, minutes: 30 };
export const INDELING_DAG_OFFSET = 1;

const indelingstijdstipInMinutes = () => {
    const hours = INDELINGSTIJDSTIP.hours;
    const minutes = INDELINGSTIJDSTIP.minutes;
    return 60 * hours + minutes;
};

const allocationHours = () => {
    return INDELINGSTIJDSTIP.hours;
};

const allocationMinutes = () => {
    return INDELINGSTIJDSTIP.minutes;
};

const mailingtijdstipInMinutes = () => {
    const hours = INDELINGSTIJDSTIP.hours + MAILINGSTIJDSTIP_DELTA.hours;
    const minutes = INDELINGSTIJDSTIP.minutes + MAILINGSTIJDSTIP_DELTA.minutes;
    return 60 * hours + minutes;
};

const mailingHours = () => {
    return INDELINGSTIJDSTIP.hours + MAILINGSTIJDSTIP_DELTA.hours;
};

const mailingMinutes = () => {
    return INDELINGSTIJDSTIP.minutes + MAILINGSTIJDSTIP_DELTA.minutes;
};

const getMailingTime = () => {
    return getTimezoneTime().set('hour', mailingHours()).set('minute', mailingMinutes());
}

const parseISOMarktDag = (dag) => (isoMarktDagen.hasOwnProperty(dag) ? isoMarktDagen[dag] : -1);
export const isVast = (status) =>
    status === DeelnemerStatus.VASTE_PLAATS ||
    status === DeelnemerStatus.TIJDELIJKE_VASTE_PLAATS ||
    status === DeelnemerStatus.TIJDELIJKE_VASTE_PLAATS_Z ||
    status === DeelnemerStatus.TIJDELIJKE_VASTE_PLAATS_OLD ||
    status === DeelnemerStatus.ECONOMISCHE_BINDING;
const isTVPLZ = status => status === DeelnemerStatus.TIJDELIJKE_VASTE_PLAATS_Z;
export const isExp = status =>
    status === DeelnemerStatus.EXPERIMENTAL ||
    status === DeelnemerStatus.EXPERIMENTAL_F;
export const isVastOfExp = status => isVast(status) || isExp(status);
export const isEb = status => status === DeelnemerStatus.ECONOMISCHE_BINDING;

export const isAfterAllocationTime = () => {
    const timeNow = getTimezoneTime();
    const allocationTime = getTimezoneTime()
        .set('hour', allocationHours())
        .set('minute', allocationMinutes());
    return timeNow.isAfter(allocationTime) || timeNow.isSame(allocationTime);
};

export const ALLOCATION_TYPE = {
    FINAL: 1,
    CONCEPT: 2,
};

export const ALLOCATION_STATUS = {
    SUCCESS: 0,
    ERROR: 1,
};

export const isAfterMailingTime = () => {
    return getTimezoneTime().isAfter(getMailingTime());
};

export const marktDateIsAfterMailing = (dateStr: string): boolean => {
    return getDateWithTimezone(dateStr).isAfter(getMailingTime());
};

export const marktIsDefinite = (dateStr: string): boolean => {
    const mailTime = getMailingTime();
    const marktDate = getDateWithTimezone(dateStr).hour(mailTime.hour()).minute(mailTime.minute())
    return getTimezoneTime().add(1, 'day').isAfter(marktDate);
}

// Geeft de datum terug vanaf wanneer ondernemers hun aanwezigheid
// mogen aanpassen.
//
// Dit betekent momenteel: Geef de datum van vandaag, tenzij de indeling
// voor vandaag al gedraaid heeft. Dit hangt af van `INDELINGSTIJDSTIP`.
export const getMarktThresholdDate = role => {
    // Door `offsetMins` bij de huidige tijd op te tellen, zal `startDate` naar morgen
    // gaan ipv vandaag als de huidige tijd voorbij indelingstijd ligt.
    const offsetMins = role !== 'marktmeester' ? 24 * 60 - indelingstijdstipInMinutes() : 0;
    return getTimezoneTime()
        .add(offsetMins, 'minutes')
        .add(INDELING_DAG_OFFSET, 'days')
        .startOf('day')
        .toDate();
};

const getMarktDaysOndernemer = (startDate, endDate, marktdagen) => {
    const start = Date.parse(startDate);
    const end = Date.parse(endDate);

    const days = Math.max(0, (end - start) / MILLISECONDS_IN_DAY);

    let dates = [];

    for (let i = 0, l = days; i <= l; i++) {
        const date = new Date(start);
        date.setDate(date.getDate() + i);
        dates.push(date);
    }

    dates = dates.filter(day => marktdagen.includes(getMaDiWoDo(day)));
    return dates;
};

export const getMarktDays = (startDate, endDate, daysOfWeek) => {
    const start = Date.parse(startDate);
    const end = Date.parse(endDate);
    const days = Math.max(0, (end - start) / MILLISECONDS_IN_DAY);
    const dates = [];

    for (let i = 0; i <= days; i++) {
        const date = new Date(start + i * MILLISECONDS_IN_DAY);
        if (daysOfWeek.includes(date.getDay())) {
            dates.push(date);
        }
    }

    return dates.map(toISODate);
};

export const getUpcomingMarktDays = (startDate, endDate, daysOfWeek) =>
    getMarktDays(addDays(startDate, 1), endDate, daysOfWeek);

export const formatOndernemerName = ondernemer => {
    const nameList = [ondernemer.tussenvoegsels, ondernemer.achternaam, ondernemer.voorletters]
    return nameList.filter(v => v).join(' ').trim();
}

export const ondernemersToLocatieKeyValue = array =>
    array.reduce((obj, item) => {
        item.plaatsen.reduce((ar, i) => {
            obj[i] = item;

            return ar;
        }, {});

        return obj;
    }, {});

export const obstakelsToLocatieKeyValue = array =>
    array.reduce((total, obstakel) => {
        total[obstakel.kraamA] = total[obstakel.kraamA] || obstakel.obstakel;
        total[obstakel.kraamA].concat(obstakel.obstakel);

        return total;
    }, {});

export const filterRsvpList = (aanmeldingen, markt, startDate?, endDate?) => {
    const dates = getMarktDays(
        startDate
            ? startDate
            : addDays(
                  moment()
                      .day(0)
                      .valueOf(),
                  0,
              ),
        endDate ? endDate : addDays(endOfWeek(), DAYS_IN_WEEK),
        (markt.marktDagen || []).map(parseMarktDag),
    );

    const rsvpList = dates.map((date: Date) => ({
        date,
        rsvp: aanmeldingen.find(aanmelding => aanmelding.marktDate === date),
    }));

    return rsvpList;
};

const plaatsParts = plaatsId => plaatsId.replace(/([^0-9])([0-9])|([0-9])([^0-9])/g, '$1$3 $2$4').split(/\s+/);
export const plaatsSort = (plaatsA, plaatsB, byKey) => {
    const partsA = plaatsParts(byKey ? plaatsA[byKey] : plaatsA);
    const partsB = plaatsParts(byKey ? plaatsB[byKey] : plaatsB);
    const l = Math.min(partsA.length, partsB.length);

    let i = 0;
    let delta = 0;

    for (; delta === 0 && i < l; i++) {
        const partA = partsA[i];
        const partB = partsB[i];

        delta =
            /^[0-9]+$/.test(partA) && /^[0-9]+$/.test(partB)
                ? parseInt(partA, 10) - parseInt(partB, 10)
                : stringSort(partA, partB);
    }

    return delta;
};

const isErkenningsnummer = str => /^\d+$/.test(str);

module.exports = {
    DAYS_CLOSED,
    A_LIJST_DAYS,
    INDELINGSTIJDSTIP,
    INDELINGSTIJDSTIP_TEXT,
    INDELING_DAG_OFFSET,
    ALLOCATION_TYPE,
    ALLOCATION_STATUS,
    formatOndernemerName,
    parseMarktDag,
    parseISOMarktDag,
    isVast,
    isTVPLZ,
    isExp,
    isVastOfExp,
    isEb,
    getMarktDays,
    indelingstijdstipInMinutes,
    getMarktThresholdDate,
    getMarktDaysOndernemer,
    getUpcomingMarktDays,
    ondernemersToLocatieKeyValue,
    obstakelsToLocatieKeyValue,
    filterRsvpList,
    plaatsSort,
    isErkenningsnummer,
    isAfterAllocationTime,
    isAfterMailingTime,
    marktDateIsAfterMailing,
    marktIsDefinite,
};
