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
                            Dit is een <b>testmail</b> tijdens de wenperiode van digitaal indelen.{' '}
                            <b>De loting vindt, zoals u gewend bent plaats, door de marktmeester, ’s ochtens op de markt.</b>
                        </p>
                    }
                    <p>
                        Op {dayOfTheWeek} {formattedDate} bent u NIET ingedeeld op de markt.
                    </p>
                    <EmailTable data={tableData} />
                    <p>
                        Omdat u zich wel digitaal heeft aangemeld, maar niet bent ingedeeld, mag u bij de ochtendindeling om 09:00 uur,{' '}
                        die door de marktmeester wordt gedaan, eerder een marktplaats kiezen dan de ondernemers die zicht niet digitaal hebben aangemeld.{' '}
                        Hiervoor dient u zich te melden bij de marktmeester vóór 8:45 uur.{' '}
                        U kunt dan bij geschiktheid zoals Branche, Bakplaats en/ of EVI een keuze maken uit de overgebleven marktplaatsen.
                    </p>
                    {isWenPeriode &&
                        <p>
                            <strong>Meer informatie?</strong>
                            <br />
                            Op {' '}
                            <a href={infoLink} target="_blank" rel="noopener noreferrer">
                                { infoLink }
                            </a>{' '}
                            kunt u informatie vinden over digitaal indelen. Wij raden u aan de website te bezoeken als u wilt weten hoe digitaal indelen precies werkt.
                        </p>
                    }
                    {isWenPeriode &&
                        <p>
                            Heeft u geen marktplaats toegewezen gekregen terwijl u dit wel verwacht had,{' '}
                            of heeft u vragen, dan kunt u deze aan de marktmeester stellen of mailen naar{' '}
                            <a href="mailto:marktbureau@amsterdam.nl">marktbureau@amsterdam.nl</a>
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
