import MarktDetailBase from './components/MarktDetailBase';
import PrintPage from './components/PrintPage';
import PropTypes from 'prop-types';
import React from 'react';
const OndernemerListAfwezig = require('./components/OndernemerListAfwezig.tsx');
const { paginate, getBreadcrumbsMarkt } = require('../util');

class SollicitantenPage extends React.Component {
    propTypes = {
        markt: PropTypes.object.isRequired,
        ondernemers: PropTypes.object,
        datum: PropTypes.string,
        role: PropTypes.string,
        user: PropTypes.object,
    };

    render() {
        const { markt, ondernemers, datum, role, user } = this.props;
        const itemsOnPage = 40;

        const paginas = paginate(ondernemers, itemsOnPage);
        const paginasLists = paginate(paginas, 2);
        const breadcrumbs = getBreadcrumbsMarkt(markt, role);

        return (
            <MarktDetailBase
                bodyClass="page-markt-sollicitanten page-print"
                title="Ondernemers langdurig afgemeld"
                markt={markt}
                datum={datum}
                role={role}
                type={'ondernemers'}
                showDate={false}
                breadcrumbs={breadcrumbs}
                user={user}
            >
                {paginasLists.map((pagina, i) => (
                    <PrintPage key={i} index={i} title={`Ondernemers langdurig afgemeld: ${markt.naam}`} datum={datum}>
                        {pagina.map((list, j) => (
                            <OndernemerListAfwezig key={j} ondernemers={list} markt={markt} datum={datum} />
                        ))}
                    </PrintPage>
                ))}
            </MarktDetailBase>
        );
    }
}

module.exports = SollicitantenPage;
