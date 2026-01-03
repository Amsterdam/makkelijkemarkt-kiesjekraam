import PropTypes from 'prop-types';
import React from 'react';
const Content = require('./components/Content');
const Header = require('./components/Header');
const Page = require('./components/Page.jsx');
const OndernemerProfileHeader = require('./components/OndernemerProfileHeader');
const moment = require('moment-timezone');
const {
    getBreadcrumbsOndernemer,
} = require('../util');

class ToewijzingenAfwijzingenPage extends React.Component {
    propTypes = {
        toewijzingen: PropTypes.array,
        afwijzingen: PropTypes.array,
        ondernemer: PropTypes.object,
        role: PropTypes.string,
        markten: PropTypes.array,
        messages: PropTypes.array,
        user: PropTypes.object.isRequired,
    };

    render() {
        const { toewijzingen, afwijzingen, ondernemer, role, markten, user } = this.props;

        toewijzingen.map(toewijzing => {
            toewijzing.type = 'toew.';
            return toewijzing;
        });

        afwijzingen.map(afwijzing => {
            afwijzing.type = 'afw.';
            return afwijzing;
        });

        let toewijzingenAfwijzingen = [...toewijzingen, ...afwijzingen];

        toewijzingenAfwijzingen = toewijzingenAfwijzingen.map(item => {
            const branches = item.ondernemer.voorkeur.branches || [];
            const branche = branches[0]; // TODO: not sure it this is correct
            return {
                ...item,
                date: item.marktDate,
                branche,
                minimum: item.ondernemer.voorkeur.minimum,
                maximum: item.ondernemer.voorkeur.maximum,
                anywhere: item.ondernemer.voorkeur.anywhere,
                verkoopinrichting: item.ondernemer.voorkeur.verkoopinrichting,
                plaatsvoorkeuren: item.ondernemer.plaatsvoorkeuren,
            }
        });

        toewijzingenAfwijzingen = toewijzingenAfwijzingen.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );

        toewijzingenAfwijzingen = toewijzingenAfwijzingen.slice(0, 13);

        function isVph(ondernemerObj, marktId) {
            const sollicitatie = ondernemerObj.sollicitaties.find(soll => soll.markt.id === marktId);
            return !!(!sollicitatie || sollicitatie.status === 'vpl');
        }

        function getMarktAfkorting(marktId) {
            const marktFound = markten.find(markt => markt.id === marktId);
            return marktFound ? marktFound.afkorting : '';
        }

        const breadcrumbs = getBreadcrumbsOndernemer(ondernemer, role);

        return (
            <Page messages={this.props.messages}>
                <Header user={user} breadcrumbs={breadcrumbs} role={role}>
                    {role === 'marktondernemer' ? <OndernemerProfileHeader user={ondernemer} /> : null}
                </Header>
                <Content>
                    {role === 'marktmeester' ? <h2 className="Heading Heading--intro">Ondernemer</h2> : null}
                    {role === 'marktmeester' ? <OndernemerProfileHeader inline={true} user={ondernemer} /> : null}
                    <h1 className="Heading Heading--intro">Toewijzingen/afwijzingen</h1>
                    <h2>laatste 2 maanden</h2>
                    <div className="Table Table__responsive Table--toewijzingen-afwijzingen">
                        <table className="Table__table">
                            <tr>
                                <th>Datum</th>
                                <th>Markt</th>
                                <th>Type</th>
                                <th>Aantal</th>
                                <th>Flex</th>
                                <th>Baktype</th>
                                <th>Evi</th>
                                <th>Voorkeuren</th>
                                <th>Branche</th>
                            </tr>
                            <tbody>
                                {toewijzingenAfwijzingen.map((item, index) => (
                                    <tr key={index}>
                                        <td>{moment(item.date).tz('Europe/Amsterdam').format('DD-MM')}</td>
                                        <td>{getMarktAfkorting(item.marktId)}</td>
                                        <td>{item.type}</td>
                                        <td>
                                            {item.minimum ? (
                                                <span>
                                                    {item.minimum}, {item.maximum - item.minimum}{' '}
                                                </span>
                                            ) : null}
                                        </td>
                                        <td>
                                            {item.anywhere !== null
                                                ? !isVph(ondernemer, item.marktId)
                                                    ? item.anywhere === true
                                                        ? 'AAN'
                                                        : 'UIT'
                                                    : '-'
                                                : null}
                                        </td>
                                        <td>{(item.bakType && item.bakType.length>0) ? item.bakType : 'geen'}</td>
                                        <td>
                                            {item.verkoopinrichting ? 'AAN' : 'UIT'}
                                        </td>
                                        <td>
                                            {item.plaatsvoorkeuren !== null ? item.plaatsvoorkeuren.join(',') : null}
                                        </td>
                                        <td>{item.branche}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Content>
            </Page>
        );
    }
}

module.exports = ToewijzingenAfwijzingenPage;
