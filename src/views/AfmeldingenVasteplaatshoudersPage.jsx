import PropTypes from 'prop-types';
import React from 'react';
const MarktDetailBase = require('./components/MarktDetailBase');
const OndernemerListAfwezig = require('./components/OndernemerListAfwezig.tsx');
const PrintPage = require('./components/PrintPage');
const {
    paginate,
    getBreadcrumbsMarkt
} = require('../util');

class AfmeldingenVPHPage extends React.Component {
    propTypes = {
        markt: PropTypes.object.isRequired,
        data: PropTypes.object,
        datum: PropTypes.string,
        vasteplaatshoudersAfgemeld: PropTypes.array,
        role: PropTypes.string.isRequired,
        user: PropTypes.object.isRequired,
    };

    render() {
        const { datum, markt, vasteplaatshoudersAfgemeld, role, user } = this.props;

        const columns = paginate(vasteplaatshoudersAfgemeld, 40);
        const breadcrumbs = getBreadcrumbsMarkt(markt, role);

        return (
            <MarktDetailBase
                bodyClass="page-markt-sollicitanten page-print"
                title="Afmeldingen vasteplaatshouders"
                markt={markt}
                datum={datum}
                printButton={true}
                showDate={false}
                type={'afmeldingen'}
                breadcrumbs={breadcrumbs}
                role={role}
                user={user}
            >
                <PrintPage title={`Vasteplaatshouders afgemeld: ${markt.naam}`} datum={datum}>
                    {columns.map((ondernemers, j) => (
                        <OndernemerListAfwezig ondernemers={ondernemers} key={j} />
                    ))}
                </PrintPage>
            </MarktDetailBase>
        );
    }
}

module.exports = AfmeldingenVPHPage;
