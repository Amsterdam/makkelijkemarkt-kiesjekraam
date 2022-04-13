import { IRSVP } from '../markt.model';

export class RSVP implements IRSVP {
    public id!: number;
    public marktId!: string;
    public marktDate!: string;
    public erkenningsNummer!: string;
    public attending!: boolean;
}
