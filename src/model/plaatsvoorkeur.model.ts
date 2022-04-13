import { IPlaatsvoorkeurRow } from '../markt.model';

export class Plaatsvoorkeur implements IPlaatsvoorkeurRow {
    public id!: number;
    public marktId!: string;
    public erkenningsNummer!: string;
    public plaatsId!: string;
    public priority!: number;
}
