import PropTypes from 'prop-types';
import React from 'react';
const {
    ondernemersToLocatieKeyValue,
    obstakelsToLocatieKeyValue,
} = require('../domain-knowledge.js');
const {
    arrayToObject,
} = require('../util.ts');
const IndelingslijstGroup = require('./components/IndelingslijstGroup');
const MarktDetailBase = require('./components/MarktDetailBase');
const PrintPage = require('./components/PrintPage');
const Street = require('./components/Street');

class VastplaatshoudersPage extends React.Component {
    propTypes = {
        data: PropTypes.object.isRequired,
        datum: PropTypes.string,
        type: PropTypes.string,
    };

    render() {
        const { datum, type } = this.props;
        const {
            aanmeldingen,
            branches,
            obstakels,
            marktplaatsen,
            ondernemers,
            paginas,
            voorkeuren,
            markt,
        } = this.props.data;
        const obstakelsObject = obstakelsToLocatieKeyValue(obstakels);
        const vphl = ondernemersToLocatieKeyValue(ondernemers);
        const locatiesObject = arrayToObject(marktplaatsen, 'plaatsId');
        const aanmeldingenOrdered = aanmeldingen.sort((a, b) => b.updatedAt - a.updatedAt);

        return (
            <MarktDetailBase
                bodyClass="page-markt-vasteplaatshouders page-print"
                title={`Vasteplaatshouders`}
                markt={markt}
                datum={datum}
                type={type}
                showDate={false}
            >
                {paginas.map((pagina, i) => (
                    <PrintPage key={`page-${i}`} index={i} title={markt.naam}>
                        {pagina.indelingslijstGroup.map((pageItem, ii) => {
                            if (pageItem.type && pageItem.type === 'street') {
                                return <Street key={`page-street-${ii}`} title={pageItem.title} />;
                            } else {
                                return (
                                    <IndelingslijstGroup
                                        key={`page-group-${ii}`}
                                        page={pageItem}
                                        plaatsList={locatiesObject}
                                        vphl={vphl}
                                        branches={branches}
                                        obstakelList={obstakelsObject}
                                        aanmeldingen={aanmeldingenOrdered}
                                        ondernemers={ondernemers}
                                        markt={markt}
                                        type={type}
                                        datum={datum}
                                        voorkeuren={voorkeuren}
                                    />
                                );
                            }
                        })}
                    </PrintPage>
                ))}
            </MarktDetailBase>
        );
    }
}

module.exports = VastplaatshoudersPage;
