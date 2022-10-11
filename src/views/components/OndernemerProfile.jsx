import PropTypes from 'prop-types';
import React from 'react';
const OndernemerProfileHeader = require('./OndernemerProfileHeader');
const SollicitatieSpecs = require('./SollicitatieSpecs');

class OndernemerProfile extends React.Component {
    propTypes = {
        ondernemer: PropTypes.object.isRequired,
    };

    render() {
        const { ondernemer, role } = this.props;
        const vendorURL = `/ondernemer/${ondernemer.erkenningsnummer}/`;
        const KJKVendorURL = `/kjk/ondernemer/${ondernemer.erkenningsnummer}/`;

        return (
            <div>
                <h2 className="Heading Heading--intro">Ondernemer</h2>
                <OndernemerProfileHeader inline={true} user={ondernemer} />
                <a className="Link" href={`/ondernemer/${ondernemer.erkenningsnummer}/toewijzingen-afwijzingen`}>
                    Toewijzingen/afwijzingen
                </a>
                <h1 className="Heading Heading--intro">Markten</h1>
                {ondernemer.sollicitaties.map(sollicitatie => (
                    <div key={sollicitatie.markt.id} className="LinkSummary">
                        <div className="LinkSummary__top">
                            <a className="Link" href={`/markt/${sollicitatie.markt.id}/`}>
                                <strong>{sollicitatie.markt.naam}</strong>
                            </a>{' '}
                            <SollicitatieSpecs sollicitatie={sollicitatie} />
                        </div>
                        <div className="LinkSummary__links">
                            <a
                                className="LinkSummary__first-link LinkInline"
                                href={`${KJKVendorURL}aanwezigheid/markt/${sollicitatie.markt.id}?${role}`}
                            >
                                aanwezigheid
                            </a>
                            <a className="LinkInline" href={`${vendorURL}voorkeuren/${sollicitatie.markt.id}/`}>
                                plaatsvoorkeuren
                            </a>
                            <a
                                className="LinkInline"
                                href={`${vendorURL}algemene-voorkeuren/${sollicitatie.markt.id}/`}
                            >
                                algemene voorkeuren
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        );
    }
}

module.exports = OndernemerProfile;
