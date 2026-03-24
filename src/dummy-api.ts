import { IMarktondernemer, IMarktondernemerVoorkeur, IRsvpPattern } from 'model/markt.model';

// Temporary stubs kept during migration away from the Makkelijke Markt API
export const getOndernemersByMarkt = async (marktId: string): Promise<IMarktondernemer[]> => {
    console.log('deprecated path getOndernemersByMarkt');
    return Promise.all([]);
};

export const getVoorkeurenByMarkt = async (marktId: string): Promise<IMarktondernemerVoorkeur[]> => {
    console.log('deprecated path getVoorkeurenByMarkt');
    return Promise.all([]);
};

export const updateRsvp = (
    marktId: string,
    marktDate: string,
    erkenningsNummer: string,
    attending: boolean,
    user: string,
): Promise<any> => {
    console.log('deprecated path updateRsvp');
    return Promise.all([]);
};

export const updateRsvpPattern = (rsvpPattern: IRsvpPattern, user: string): Promise<any> => {
    console.log('deprecated path updateRsvpPattern');
    return Promise.all([]);
};

export const clearFutureRsvps = (_marktId: string, _erkenningsNummer: string, _user: string): Promise<number> => {
    console.log('deprecated path clearFutureRsvps');
    return Promise.resolve(0);
};

export const getAuditLogsSince30Days = (): Promise<any[]> => {
    console.log('deprecated path getAuditLogsSince30Days');
    return Promise.all([]);
};
