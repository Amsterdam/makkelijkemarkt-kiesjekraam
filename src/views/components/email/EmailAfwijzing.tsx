import * as React from 'react';
import {
    formatDayOfWeek,
    yyyyMmDdtoDDMMYYYY,
} from '../../../util';
import EmailBase from '../EmailBase.jsx';
import EmailContent from '../EmailContent.jsx';
import EmailTable from '../EmailTable.jsx';
import {
    getAfwijzingReason,
} from '../../../model/afwijzing.functions';
import {
    IMarktondernemer,
} from '../../../model/markt.model';
import {
    MMMarkt,
} from '../../../model/makkelijkemarkt.model';

type EmailIndelingProps = {
    ondernemer: IMarktondernemer;
    subject: string;
    telefoonnummer: string;
    afwijzing: any;
    markt: MMMarkt;
    isWenPeriode: boolean;
};

export class EmailAfwijzing extends React.Component<EmailIndelingProps> {
    public render() {
        const { subject, ondernemer, markt, telefoonnummer, afwijzing, isWenPeriode } = this.props;

        const reason = getAfwijzingReason(afwijzing.rejectReason);

        const tableData = [
            ['Markt:', <strong key="markt">{markt.naam}</strong>],
            ['Reden:', <strong key="markt">{reason.message}</strong>],
        ];

        const formattedDate = yyyyMmDdtoDDMMYYYY(afwijzing.date);
        const dayOfTheWeek = formatDayOfWeek(afwijzing.date);
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
                        Op {dayOfTheWeek} {formattedDate} bent u NIET ingedeeld op de markt.
                    </p>
                    <EmailTable data={tableData} />
                    <p>
                        Omdat u zich wel digitaal heeft aangemeld, maar niet bent ingedeeld, mag u eerder een plek
                        kiezen bij de dagelijkse indeling door de marktmeester om 09.00 uur. Hiervoor dient u zich te
                        melden bij de marktmeester vóór 8.45 uur. U kunt dan kiezen uit de overgebleven plekken.
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
