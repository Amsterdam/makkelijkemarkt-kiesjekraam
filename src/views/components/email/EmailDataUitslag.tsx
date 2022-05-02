import * as React from 'react';
import EmailBase from '../EmailBase.jsx';
import EmailContent from '../EmailContent.jsx';
import {
    IMarkt,
} from '../../../model/markt.model';
import {
    yyyyMmDdtoDDMMYYYY,
} from '../../../util';

type Properties = {
    markt: IMarkt;
    toewijzingen: any[];
    ondernemers: any[];
    marktDate: string;
    subject: string;
    isKraamzetter: boolean;
};

export class EmailDataUitslag extends React.Component<Properties> {
    public render() {
        const { subject, toewijzingen, ondernemers, markt, marktDate, isKraamzetter } = this.props as Properties;
        return (
            <EmailBase lang="nl" appName="Kies je kraam" domain="kiesjekraam.amsterdam.nl" subject={subject}>
                <EmailContent>
                    {isKraamzetter ? <p>Beste heer/mevrouw,</p> : <p>Beste marktbeheerder,</p>}
                    <p>
                        Dit is een automatische mail met de indeling van {markt.naam} op {yyyyMmDdtoDDMMYYYY(marktDate)}
                        .
                    </p>
                    <table className="uitslag-table">
                        <tr text-align="left">
                            <th>Plaats(en)</th>
                            <th>Soll nr.</th>
                            <th>Naam</th>
                            <th>Type</th>
                        </tr>
                        <tbody>
                            {toewijzingen.map((toewijzing, index) => {
                                const ondernemerResult = ondernemers.find(
                                    ondernemer => ondernemer.erkenningsNummer === toewijzing.koopman,
                                );
                                if (ondernemerResult === undefined){
                                    console.log("Error, ondernemer niet gevonden: ");
                                    console.log(toewijzing);
                                    return "";
                                }
                                return (
                                    <tr key={index}>
                                        <td>{toewijzing.plaatsen.sort((a: any, b: any) => a - b).join(', ')}</td>
                                        <td>{ondernemerResult.sollicitatieNummer}</td>
                                        <td>{ondernemerResult.description}</td>
                                        <td>{ondernemerResult.status}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <p>
                        Met vriendelijke groet,
                        <br />
                        Marktbureau Amsterdam
                    </p>
                </EmailContent>
            </EmailBase>
        );
    }
}
