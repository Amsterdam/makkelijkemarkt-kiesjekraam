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

        const infoLink = 'https://www.amsterdam.nl/ondernemen/markt-straathandel/digitaal-indelen/';

        return (
            <EmailBase lang="nl" appName="Kies je kraam" domain="kiesjekraam.amsterdam.nl" subject={subject}>
                <EmailContent>
                    <p>Beste {ondernemer.description},</p>
                    {isWenPeriode &&
                        <p>
                            Dit is een testmail tijdens de wenperiode van digitaal indelen. U ontvangt deze e-mail omdat u
                            zich digitaal heeft aangemeld.
                        </p>
                    }
                    <p>
                        Op {dayOfTheWeek} {formattedDate} bent u ingedeeld op de markt.
                    </p>
                    <EmailTable data={tableData} />
                    <p>
                        Als u onverwachts toch niet kunt komen verzoeken wij u dit uiterlijk 08.45 uur aan de
                        marktmeester te melden zodat een andere ondernemer uw plaats kan krijgen.
                    </p>
                    <p>Dit kan telefonisch via: {telefoonnummer}.</p>
                    <p>
                        Alleen als er sprake is van overmacht hoeft u het marktgeld niet te betalen. Overmacht betekent
                        dat u de avond van tevoren nog niet kon weten dat u niet naar de markt kunt komen. De
                        marktmeester beoordeelt uw situatie.
                    </p>
                    {isWenPeriode &&
                        <p>
                            <strong>Meer informatie?</strong>
                            <br />
                            Op deze{' '}
                            <a href={infoLink} target="_blank" rel="noopener noreferrer">
                                website
                            </a>{' '}
                            kunt u veel informatie vinden over digitaal indelen. Wij raden u aan dit te lezen als u wilt
                            weten hoe het precies werkt.
                        </p>
                    }
                    {isWenPeriode &&
                        <p>
                            Hebt u daarna nog vragen? Stuur ons dan een e-mail via{' '}
                            <a href="mailto: marktbureau@amsterdam.nl">marktbureau@amsterdam.nl</a>
                            {telefoonnummer && 'of bel ons via ' + telefoonnummer}
                            .
                        </p>
                    }
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
