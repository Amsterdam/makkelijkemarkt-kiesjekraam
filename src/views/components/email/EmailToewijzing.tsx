import * as React from 'react';
import {
    formatDayOfWeek,
    yyyyMmDdtoDDMMYYYY,
} from '../../../util';
import {
    IMarktondernemer,
    IToewijzing,
} from '../../../model/markt.model';
import EmailBase from '../EmailBase.jsx';
import EmailContent from '../EmailContent.jsx';
import EmailTable from '../EmailTable.jsx';
import {
    MMMarkt,
} from '../../../model/makkelijkemarkt.model';

type EmailIndelingProps = {
    ondernemer: IMarktondernemer;
    subject: string;
    telefoonnummer: string;
    marktDate: string;
    toewijzing: IToewijzing;
    markt: MMMarkt;
    isWenPeriode: boolean;
};

export class EmailToewijzing extends React.Component<EmailIndelingProps> {
    public render() {
        const { subject, ondernemer, telefoonnummer, marktDate, toewijzing, markt, isWenPeriode } = this.props;

        const formattedDate = yyyyMmDdtoDDMMYYYY(marktDate);
        const dayOfTheWeek = formatDayOfWeek(marktDate);

        const plaatsen = toewijzing.plaatsen.sort((a: any, b: any) => a - b).join(', ');

        const tableData = [
            ['Markt:', <strong key="markt">{markt.naam}</strong>],
            ['Plaats(en):', <strong key="markt">{plaatsen}</strong>],
        ];

        const infoLink = 'https://www.amsterdam.nl/ondernemen/markt-straathandel/';

        return (
            <EmailBase lang="nl" appName="Kies je kraam" domain="kiesjekraam.amsterdam.nl" subject={subject}>
                <EmailContent>
                    <p>Beste {ondernemer.description},</p>
                    {isWenPeriode && (
                        <p>
                            Dit is een testmail tijdens de wenperiode van digitaal indelen. U kunt geen rechten ontlenen
                            aan deze de toegewezen plaats(en). De loting vindt, zoals u gewend bent plaats, door de
                            marktmeester ochtends op de markt.
                        </p>
                    )}
                    <p>
                        Op {dayOfTheWeek} {formattedDate} bent u ingedeeld op de markt.
                    </p>
                    <EmailTable data={tableData} />
                    <h4>Meer informatie</h4>
                    <p>
                        Op{' '}
                        <a href="https://www.amsterdam.nl/ondernemen/markt-straathandel/">
                            https://www.amsterdam.nl/ondernemen/markt-straathandel/
                        </a>{' '}
                        kunt u informatie vinden over digitaal indelen. Wij raden u aan de website te bezoeken als u
                        wilt weten hoe digitaal indelen precies werkt.
                    </p>
                    <p>
                        Heeft u een andere plaats toegewezen gekregen dan u verwacht had, of heeft u vragen, dan kunt u
                        deze aan de marktmeester stellen of mailen naar{' '}
                        <a href="mailto: marktbureau@amsterdam.nl">marktbureau@amsterdam.nl</a>
                    </p>
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
