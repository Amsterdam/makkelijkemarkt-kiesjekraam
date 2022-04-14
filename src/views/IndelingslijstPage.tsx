import * as React from 'react';
import {
    arrayToObject,
    getBreadcrumbsMarkt
} from '../util';
import {
    IAfwijzing,
    IBranche,
    IMarkt,
    IMarktondernemer,
    IMarktplaats,
    IObstakelBetween,
    IRSVP,
    IToewijzing,
} from '../model/markt.model';
import {
    obstakelsToLocatieKeyValue,
    ondernemersToLocatieKeyValue,
} from '../domain-knowledge';
import {
    IAllocationPrintout
} from '../model/printout.model';
import IndelingsLegenda from './components/IndelingsLegenda';
import IndelingslijstGroup from './components/IndelingslijstGroup';
import MarktDetailBase from './components/MarktDetailBase';
import PrintPage from './components/PrintPage';
import Street from './components/Street';

type IndelingslijstPageState = {
    aanmeldingen: IRSVP[];
    obstakels: IObstakelBetween[];
    marktplaatsen: IMarktplaats[];
    ondernemers: IMarktondernemer[];
    paginas: IAllocationPrintout;
    toewijzingen: IToewijzing[];
    afwijzingen: IAfwijzing[];
    markt: IMarkt;
    marktId: string;
    datum: string;
    type: string;
    branches: IBranche[];
    role: string;
    user: object;
    job: string;
};

const titleMap: { [index: string]: string } = {
    wenperiode               : 'Indelingslijst',
    indeling                 : 'Indeling',
    'concept-indelingslijst' : 'Concept indelingslijst',
};

export default class IndelingslijstPage extends React.Component {
    public render() {
        const props = this.props as IndelingslijstPageState;
        const {
            aanmeldingen,
            obstakels,
            marktplaatsen,
            ondernemers,
            paginas,
            markt,
            datum,
            type = 'indeling',
            branches,
            role,
            user,
            job
        } = props;

        const title        = titleMap[type];
        const breadcrumbs  = getBreadcrumbsMarkt(markt, role);

        const plaatsList   = arrayToObject(marktplaatsen, 'plaatsId');
        const vphl         = ondernemersToLocatieKeyValue(ondernemers);
        const obstakelList = obstakelsToLocatieKeyValue(obstakels);

        const toewijzingen = type !== 'wenperiode' ? props.toewijzingen : [];
        const afwijzingen = props.afwijzingen;
        let afwijzingPages = [];
        if(afwijzingen !== undefined){
            afwijzingPages = afwijzingen.reduce((pagedArray, item, index) => {
              const pageIndex = Math.floor(index/30) //30 per page
              if(!pagedArray[pageIndex]) {
                pagedArray[pageIndex] = []
              }
              pagedArray[pageIndex].push(item)
              return pagedArray
            }, [])
        }

        return (
            <MarktDetailBase
                bodyClass="page-markt-indelingslijst page-print"
                title={title}
                markt={markt}
                type={type}
                datum={datum}
                showDate={true}
                breadcrumbs={breadcrumbs}
                role={role}
                user={user}
                printButton={true}
            >
            {paginas.map((page, j) => (
                <PrintPage
                    key={`page-${j}`}
                    index={j}
                    title={`${title} ${markt.naam}`}
                    label={page.title}
                    datum={datum}
                >
                {page.indelingslijstGroup.map((pageItem, i) =>
                    pageItem.type && pageItem.type === 'street' ?
                    <Street key={`page-street-${i}`} title={pageItem.title} /> :
                    <IndelingslijstGroup
                         key={`page-group-${i}`}
                         page={pageItem}
                         plaatsList={plaatsList}
                         vphl={vphl}
                         obstakelList={obstakelList}
                         aanmeldingen={aanmeldingen}
                         toewijzingen={toewijzingen}
                         ondernemers={ondernemers}
                         markt={markt}
                         datum={datum}
                         branches={branches}
                     />
                )}
                </PrintPage>
            ))}


                <PrintPage
                    key="legenda"
                    title={`Legenda ${markt.naam}`}
                    datum={datum}
                >
                    <IndelingsLegenda
                        branches={branches}
                        marktplaatsen={marktplaatsen}
                        ondernemers={ondernemers}
                        aanmeldingen={aanmeldingen}
                        toewijzingen={toewijzingen}
                    ></IndelingsLegenda>
                    { job ? <div className="IndelingsLegenda">
                        <b><a href={`/logs/${job}`}>Bekijk Indelingslog</a></b>
                    </div>: null}
                </PrintPage>

                {afwijzingPages.map((page) => (
                    <PrintPage
                        key="afwijzingen"
                        title={`Afwijzingen ${markt.naam}`}
                        datum={datum}
                    >
                        <div className="IndelingsLegenda">
                            <table>
                                <thead>
                                <tr>
                                    <th>Erkenningsnummer</th>
                                    <th>Status</th>
                                    <th>Naam</th>
                                    <th>Reden</th>
                                </tr>
                                </thead>
                                {page.map((afw: IAfwijzing) => (
                                <tr>
                                    <td>{afw.ondernemer.erkenningsNummer}</td>
                                    <td>{afw.ondernemer.description}</td>
                                    <td>{afw.ondernemer.status}</td>
                                    <td>{afw.reason.message}</td>
                                </tr>
                                ))}
                            </table>
                        </div>
                    </PrintPage>
                ))}

                <script src="/js/IndelingslijstPage.js"></script>
            </MarktDetailBase>
        );
    }
}
