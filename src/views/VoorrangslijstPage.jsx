import {
    DeelnemerStatus,
} from '../model/markt.model';
import PropTypes from 'prop-types';
import React from 'react';
const MarktDetailBase = require('./components/MarktDetailBase');
const OndernemerList = require('./components/OndernemerList.tsx');
const PrintPage = require('./components/PrintPage');
const {
    paginate,
    getBreadcrumbsMarkt,
} = require('../util');
const {
    A_LIJST_DAYS,
} = require('../domain-knowledge.ts');
const {
    isAanwezig,
} = require('../routes/markt-marktmeester');



const STATUS_PRIORITIES = [
    DeelnemerStatus.SOLLICITANT,
    DeelnemerStatus.TIJDELIJKE_VASTE_PLAATS,
    DeelnemerStatus.VASTE_PLAATS
];

const compare = (a, b, aLijst) => {
    const sort1 = Number(aLijst.includes(b)) - Number(aLijst.includes(a));
    const sort2 = Math.max(STATUS_PRIORITIES.indexOf(b.status), 0) - Math.max(STATUS_PRIORITIES.indexOf(a.status), 0);
    const sort3 = a.sollicitatieNummer - b.sollicitatieNummer;

    return sort1 || sort2 || sort3;
};

const sort = (ondernemers, aLijst = []) => {
    return [...ondernemers].sort((a, b) => compare(a, b, aLijst));
};

class VoorrangslijstPage extends React.Component {
    propTypes = {
        markt: PropTypes.object.isRequired,
        aLijst: PropTypes.array,
        ondernemers: PropTypes.object,
        aanmeldingen: PropTypes.object,
        voorkeuren: PropTypes.object,
        datum: PropTypes.string,
        type: PropTypes.string,
        toewijzingen: PropTypes.array.isRequired,
        algemenevoorkeuren: PropTypes.array,
        role: PropTypes.string,
        user: PropTypes.object,
    };

    render() {
        const {
            markt,
            aLijst,
            aanmeldingen,
            voorkeuren,
            datum,
            type,
            user,
            toewijzingen,
            algemenevoorkeuren,
            role,
        } = this.props;
        let { ondernemers } = this.props;
        const aLijstErkenningsNummers = aLijst.map(ondernemer => ondernemer.erkenningsnummer);

        const aLijstDay = A_LIJST_DAYS.includes(new Date(datum).getDay());

        const itemsOnPage = 40;
        const aLijstAangemeld = 0;
        const aLijstNietAangemeld = 1;
        const Aangemeld = 2;
        const NietAangemeld = 3;

        ondernemers = ondernemers.filter(
            ondernemer =>
                !toewijzingen.find(({ erkenningsNummer }) => erkenningsNummer === ondernemer.erkenningsNummer),
        );

        ondernemers = sort(ondernemers, aLijst);
        ondernemers = [
            ...ondernemers.filter(ondernemer => isAanwezig(ondernemer, aanmeldingen, datum)),
            ...ondernemers.filter(ondernemer => isAanwezig(ondernemer, aanmeldingen, datum)),
        ];

        const ondernemersGrouped = ondernemers
            .reduce(
                (total, ondernemer) => {
                    total[
                        isAanwezig(ondernemer, aanmeldingen, datum) &&
                        aLijstErkenningsNummers.includes(ondernemer.erkenningsNummer)
                            ? aLijstAangemeld
                            : isAanwezig(ondernemer, aanmeldingen, datum) &&
                              !aLijstErkenningsNummers.includes(ondernemer.erkenningsNummer)
                            ? Aangemeld
                            : !isAanwezig(ondernemer, aanmeldingen, datum) &&
                              aLijstErkenningsNummers.includes(ondernemer.erkenningsNummer)
                            ? aLijstNietAangemeld
                            : !isAanwezig(ondernemer, aanmeldingen, datum) &&
                              !aLijstErkenningsNummers.includes(ondernemer.erkenningsNummer)
                            ? NietAangemeld
                            : NietAangemeld
                    ].push(ondernemer);
                    return total;
                },
                [[], [], [], []],
            )
            .map((group, index) => {
                if (index === 1 || index === 2 || index === 3) {
                    return group.filter(ondernemer => ondernemer.status !== 'vpl');
                } else {
                    return group;
                }
            })
            .map(group => paginate(paginate(group, itemsOnPage), 2));

        const titleBase = type === 'wenperiode' ? 'Alle sollicitanten' : 'Ondernemers niet ingedeeld';
        const titles = [
            `${titleBase}${aLijstDay ? ', A lijst' : ''} aangemeld: ${markt.naam}`,
            `${titleBase}${aLijstDay ? ', A lijst' : ''} niet aangemeld: ${markt.naam}`,
            `${titleBase}${aLijstDay ? ', B lijst' : ''} aangemeld: ${markt.naam}`,
            `${titleBase}${aLijstDay ? ', B lijst' : ''} niet aangemeld: ${markt.naam}`,
        ];
        const plaatsvoorkeuren = voorkeuren.reduce((t, voorkeur) => {
            if (!t[voorkeur.erkenningsNummer]) {
                t[voorkeur.erkenningsNummer] = [];
            }
            t[voorkeur.erkenningsNummer].push(voorkeur);

            return t;
        }, {});
        const algemenevoorkeurenObject = algemenevoorkeuren.reduce((t, voorkeur) => {
            t[voorkeur.erkenningsNummer] = voorkeur;
            return t;
        }, {});

        const breadcrumbs = getBreadcrumbsMarkt(markt, role);

        return (
            <MarktDetailBase
                bodyClass="page-markt-sollicitanten page-print"
                title={titleBase}
                markt={markt}
                datum={datum}
                type={type}
                breadcrumbs={breadcrumbs}
                printButton={true}
                showDate={false}
                role={role}
                user={user}
            >
                {ondernemersGrouped.map((group, i) =>
                    group.length > 0
                        ? group.map((page, k) => (
                              <PrintPage
                                  key={k}
                                  title={`${titles[i]}${
                                      group.length > 1 ? ' (' + (k + 1) + ' - ' + group.length + ')' : ''
                                  }`}
                                  datum={datum}
                              >
                                  {page.map((list, j) => (
                                      <OndernemerList
                                          key={j}
                                          ondernemers={list}
                                          markt={markt}
                                          type={type}
                                          datum={datum}
                                          aanmeldingen={aanmeldingen}
                                          plaatsvoorkeuren={plaatsvoorkeuren}
                                          algemenevoorkeuren={algemenevoorkeurenObject}
                                      />
                                  ))}
                              </PrintPage>
                          ))
                        : null,
                )}
            </MarktDetailBase>
        );
    }
}

module.exports = VoorrangslijstPage;
