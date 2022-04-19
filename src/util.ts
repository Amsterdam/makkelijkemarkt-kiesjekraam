import * as fs from 'fs';
import moment = require('moment-timezone');

export const capitalize = (s: string) => {
    return typeof s === 'string' ? s.charAt(0).toUpperCase() + s.slice(1) : '';
};

export const DAYS_IN_WEEK = 7;
export const MILLISECONDS_IN_SECOND = 1000;
export const SECONDS_IN_MINUTE = 60;
export const MINUTES_IN_HOUR = 60;
export const HOURS_IN_DAY = 24;
export const MILLISECONDS_IN_DAY = MILLISECONDS_IN_SECOND * SECONDS_IN_MINUTE * MINUTES_IN_HOUR * HOURS_IN_DAY;
export const shortMonthCharCount = 3;

export const ISO_WEEK_DAYS = ['', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];

export const ISO_MONDAY = 1;
export const ISO_TUESDAY = 2;
export const ISO_WEDNESDAY = 3;
export const ISO_THURSDAY = 4;
export const ISO_FRIDAY = 5;
export const ISO_SATURDAY = 6;
export const ISO_SUNDAY = 7;

export const WEEK_DAYS = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
export const WEEK_DAYS_SHORT = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];

export const SUNDAY = 0;
export const MONDAY = 1;
export const TUESDAY = 2;
export const WEDNESDAY = 3;
export const THURSDAY = 4;
export const FRIDAY = 5;
export const SATURDAY = 6;

export const EXP_ZONE = '?';

export const INDELINGSTYPE__AB_LIJST = 'a/b-lijst';

export const LF = '\n';

export const monthName = [
    'januari',
    'februari',
    'maart',
    'april',
    'mei',
    'juni',
    'juli',
    'augustus',
    'september',
    'oktober',
    'november',
    'december',
];

export const formatISODayOfWeek = (day: number) => ISO_WEEK_DAYS[day];
export const formatDayOfWeek = (date: string) => WEEK_DAYS[new Date(date).getDay()];
export const formatDayOfWeekShort = (date: string) => WEEK_DAYS_SHORT[new Date(date).getDay()];
export const formatMonth = (date: string) => monthName[new Date(date).getMonth()];

export const getMaDiWoDo = (date: Date) => {
    const dayOfWeek = WEEK_DAYS[date.getDay()];
    return dayOfWeek.substring(0, 2);
};

export const formatDate = (date: string): string =>
    `${new Date(date).getDate()} ${formatMonth(date).slice(0, shortMonthCharCount)} '${String(
        new Date(date).getFullYear(),
    ).substr(2, 2)}`;

export const formatDateFull = (date: string): string =>
    `${new Date(date).getDate()} ${formatMonth(date)} ${String(new Date(date).getFullYear())}`;

export const dateDiffInDays = (date1: string, date2: string): number => {
    const dt1 = new Date(date1);
    const dt2 = new Date(date2);

    return Math.floor(
        (Date.UTC(dt2.getFullYear(), dt2.getMonth(), dt2.getDate()) -
            Date.UTC(dt1.getFullYear(), dt1.getMonth(), dt1.getDate())) /
            MILLISECONDS_IN_DAY,
    );
};

export const relativeHumanDay = (date: string) => {
    const dayOptions: { [index: string]: string } = { '0': 'vandaag', '1': 'morgen', '-1': 'gisteren' };
    const diff = String(dateDiffInDays(today(), date));

    return dayOptions[diff] ? dayOptions[diff] : '';
};

export const fullRelativeHumanDate = (date: string): string =>
    `${relativeHumanDay(date) ? `${relativeHumanDay(date)}, ` : ''}${formatDayOfWeek(date)} ${formatDateFull(date)}`;

export const addDays = (offsetDate: string | number, days: number): string => {
    const date = new Date(offsetDate);
    date.setDate(date.getDate() + days);
    return toISODate(date);
};

export const addMinutes = (offsetDate: string | number, minutes: number): string => {
    const date = new Date(offsetDate);
    return toISODate(new Date(date.getTime() + minutes * 60000));
};

export const addMinutesTime = (offsetDate: string | number, minutes: number): Date => {
    const date = new Date(offsetDate);
    const dateNewTime = new Date(date.getTime() + minutes * 60000);
    return moment(dateNewTime).tz('Europe/Amsterdam').format();
};

export const getTimezoneTime = (): any => {
    return moment().tz('Europe/Amsterdam');
};

export const getTimezoneHours = (): number => {
    return parseInt(moment(getTimezoneTime()).format('H'), 10);
};

export const today = (): string => toISODate(new Date());
export const tomorrow = (): string => addDays(Date.now(), 1);
export const yesterday = (): string => addDays(Date.now(), -1);

export const endOfWeek = (): string => {
    const date = new Date();
    return addDays(date.getTime(), DAYS_IN_WEEK - date.getDay());
};

export const nextWeek = (): string => addDays(Date.now(), DAYS_IN_WEEK);

export const toDate = (dateObject: Date) => {
    const day = String(dateObject.getDate()).padStart(2, '0');
    const month = String(dateObject.getMonth() + 1).padStart(2, '0');
    const year = dateObject.getFullYear();
    return `${year}-${month}-${day}`;
};
export const toISODate = (date: Date): string => date.toISOString().replace(/T.+/, '');

export const ddmmyyyyToDate = (dateString: string) => {
    const day = dateString.split('-')[0];
    const month = dateString.split('-')[1];
    const year = dateString.split('-')[2];
    return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), 0, 0, 0);
};

export const yyyyMmDdtoDDMMYYYY = (dateString: string) => {
    const year = dateString.split('-')[0];
    const month = dateString.split('-')[1];
    const day = dateString.split('-')[2];
    return `${day}-${month}-${year}`;
};

export const numberSort = (a: number, b: number): number => (a > b ? 1 : a === b ? 0 : -1);

export const stringSort = (a: string, b: string): number => (a > b ? 1 : a === b ? 0 : -1);

export const sum = (a: number, b: number): number => a + b;

export const max = (a: number, b: number): number => Math.max(a, b);

export const flatten = <T>(a: T[] = [], b: T[] = []): T[] => [...(a || []), ...(b || [])];

export const unique = <T>(a: T[], b: T): T[] => (a.includes(b) ? a : [...a, b]);

export const compareProperty = (a: any[], b: any[], property: string) => {
    return a.map(({ [property]: p }) => p).reduce(sum, 0) - b.map(({ [property]: p }) => p).reduce(sum, 0);
};

export const readJSON = (filePath, emitError = true, defaultValue?) => {
    try {
        const data = fs.readFileSync(filePath, { encoding: 'utf8' });
        return JSON.parse(String(data));
    } catch (e) {
        if (emitError) {
            throw e;
        } else {
            return defaultValue;
        }
    }
};

export const arrayToObject = <T, K extends keyof T>(array: T[], keyField: K): { [index: string]: T } => {
    return array.reduce((obj: { [index: string]: T }, item: T) => {
        obj[String(item[keyField])] = item;

        return obj;
    }, {});
};

export const pluck = <T>(array: T[], key: string): any[] => {
    return array.reduce((result: any[], el: { [index: string]: any }): any => {
        return key in el ? result.concat(el[key]) : result;
    }, []);
};

export const count = <T>(arrayMaybe: T | T[]): number => {
    return arrayMaybe ? (Array.isArray(arrayMaybe) ? arrayMaybe.length : 1) : 0;
};

export const exclude = <T>(a: T[] = [], b: any[] = []): T[] => {
    return a.filter(value => !b.includes(value));
};

export const difference = (a: any[] = [], b: any[] = []) => {
    return a.filter(value => !b.includes(value));
};

export const intersection = (a: any[] = [], b: any[] = []) => {
    return a.filter(value => b.includes(value));
};

export const intersects = (a: any[] = [], b: any[] = []): boolean => {
    return !!a.find(value => b.includes(value));
};

export const paginate = <T>(arr: T[], count: number): T[][] => {
    return arr.reduce((t, a, i) => {
        !(i % count) && t.push([]);
        t[t.length - 1].push(a);

        return t;
    }, []);
};

export const getBreadcrumbsOndernemer = (ondernemer: any, role: string) => {
    if (role === 'marktmeester') {
        return [
            {
                title: 'Markten',
                url: '/markt/',
            },
            {
                title: `${ondernemer.tussenvoegsels} ${ondernemer.achternaam} ${ondernemer.voorletters}`,
                url: `/profile/${ondernemer.erkenningsnummer}/`,
            },
        ];
    } else {
        return [
            {
                title: 'Mijn markten',
                url: '/dashboard/',
            },
        ];
    }
};

export const getBreadcrumbsMarkt = (markt: any, role: string) => {
    if (role === 'marktmeester') {
        return [
            {
                title: 'Markten',
                url: '/markt/',
            },
            {
                title: markt.naam,
                url: `/markt/${markt.id}/`,
            },
        ];
    } else {
        return [
            {
                title: 'Mijn markten',
                url: '/dashboard/',
            },
            {
                title: markt.naam,
                url: `/markt-detail/${markt.id}/`,
            },
        ];
    }
};

export const requireOne = <T>(arg: T[] | T | null): T => {
    if (Array.isArray(arg) && arg.length >= 1) {
        return arg[0];
    } else if (!Array.isArray(arg) && typeof arg !== 'undefined' && arg !== null) {
        return arg;
    } else {
        throw new TypeError('Must be exactly one');
    }
};

export const requireEnv = (key: string) => {
    if (!process.env[key]) {
        throw new Error(`Required environment variable "${key}" is not configured.`);
    }
};
