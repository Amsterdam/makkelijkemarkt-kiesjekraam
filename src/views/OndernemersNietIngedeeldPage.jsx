import PropTypes from 'prop-types';
import React from 'react';
const {
    paginate,
    getBreadcrumbsMarkt,
} = require('../util');
const {
    filterOndernemersAangemeld,
} = require('../model/ondernemer.functions');
const MarktDetailBase = require('./components/MarktDetailBase');
const OndernemerList = require('./components/OndernemerList.tsx');
const PrintPage = require('./components/PrintPage');

class template extends React.Component {
    propTypes = {
        markt: PropTypes.object.isRequired,
        ondernemers: PropTypes.object,
        aanmeldingen: PropTypes.object,
        voorkeuren: PropTypes.object,
        datum: PropTypes.string,
        toewijzingen: PropTypes.array.isRequired,
        algemenevoorkeuren: PropTypes.array,
        role: PropTypes.string,
        user: PropTypes.object,
    };

    render() {
        const { markt, aanmeldingen, datum, user, algemenevoorkeuren, role, ondernemers, toewijzingen } = this.props;

        const ondernemersAangemeld = filterOndernemersAangemeld(ondernemers, algemenevoorkeuren, aanmeldingen, datum);
        const ondernemersNietAangemeld = ondernemers
            .filter(
                ondernemer =>
                    !ondernemersAangemeld.find(
                        ondernemerAangemeld => ondernemerAangemeld.erkenningsNummer === ondernemer.erkenningsNummer,
                    ),
            )
            .filter(ondernemer => ondernemer.status === 'soll');

        let groups = [
            ondernemersAangemeld.filter(
                ondernemer =>
                    !toewijzingen.find(toewijzing => toewijzing.erkenningsNummer === ondernemer.erkenningsNummer),
            ),
            ondernemersNietAangemeld.filter(
                ondernemer =>
                    !toewijzingen.find(toewijzing => toewijzing.erkenningsNummer === ondernemer.erkenningsNummer),
            ),
        ];

        groups = groups.map(group => paginate(paginate(group, 40), 2));

        const titles = [
            `Ondernemers niet ingedeeld aangemeld: ${markt.naam}`,
            `Ondernemers niet ingedeeld niet aangemeld: ${markt.naam}`,
        ];

        const breadcrumbs = getBreadcrumbsMarkt(markt, role);

        return (
            <MarktDetailBase
                bodyClass="page-markt-sollicitanten page-print"
                title={'Ondernemers niet ingedeeld'}
                markt={markt}
                datum={datum}
                breadcrumbs={breadcrumbs}
                printButton={true}
                showDate={false}
                role={role}
                user={user}
            >
                {groups.map((group, i) =>
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
                                          datum={datum}
                                          aanmeldingen={aanmeldingen}
                                          algemenevoorkeuren={algemenevoorkeuren}
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

module.exports = template;
