import PrintPage from './components/PrintPage';
import PropTypes from 'prop-types';
import React from 'react';
import MarktDetailBase from './components/MarktDetailBase';
const OndernemerList = require('./components/OndernemerList.tsx');
const {
    paginate,
    getBreadcrumbsMarkt,
} = require('../util');
const {
    isAanwezig,
} = require('../routes/markt-marktmeester');

class template extends React.Component {
    propTypes = {
        markt: PropTypes.object.isRequired,
        ondernemers: PropTypes.object,
        aanmeldingen: PropTypes.object,
        voorkeuren: PropTypes.object,
        datum: PropTypes.string,
        title: PropTypes.string,
        toewijzingen: PropTypes.array.isRequired,
        algemenevoorkeuren: PropTypes.array,
        plaatsvoorkeuren: PropTypes.array,
        role: PropTypes.string,
        user: PropTypes.object,
    };

    render() {
        const {
            markt,
            aanmeldingen,
            plaatsvoorkeuren,
            datum,
            user,
            algemenevoorkeuren,
            role,
            title,
            ondernemers,
        } = this.props;

        let groups = [
            ondernemers.filter(ondernemer => isAanwezig(ondernemer, aanmeldingen, datum)),
            ondernemers.filter(ondernemer => !isAanwezig(ondernemer, aanmeldingen, datum)),
        ];
        groups = groups.map(group => paginate(paginate(group, 40), 2));

        const titles = [`Aangemeld: ${markt.naam}`, `Niet aangemeld: ${markt.naam}`];

        const breadcrumbs = getBreadcrumbsMarkt(markt, role);

        return (
            <MarktDetailBase
                bodyClass="page-markt-sollicitanten page-print"
                title={title}
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
                                          markt={markt}
                                          datum={datum}
                                          aanmeldingen={aanmeldingen}
                                          plaatsvoorkeuren={plaatsvoorkeuren}
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
