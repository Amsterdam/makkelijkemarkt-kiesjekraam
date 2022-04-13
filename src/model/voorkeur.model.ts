import { IMarktondernemerVoorkeurRow } from '../markt.model';

export class Voorkeur implements IMarktondernemerVoorkeurRow {
    public erkenningsNummer!: string;
    public marktId: string;
    public marktDate: string | null;
    public anywhere: boolean | null;
    public minimum?: number | null;
    public maximum?: number | null;
    public brancheId: string | null;
    public parentBrancheId: string | null;
    public inrichting: string | null;
    public absentFrom: Date | null;
    public absentUntil: Date | null;
}
