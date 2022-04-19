import PropTypes from 'prop-types';
import React from 'react';
const { isTVPLZ } = require('../../domain-knowledge');

const SollicitatieSpecs = ({ sollicitatie }) => {
    const aantalPlaatsen = sollicitatie.vastePlaatsen.length;
    const vastePlaatsen = aantalPlaatsen ? sollicitatie.vastePlaatsen.join(', ') : '';

    return (
        <div className="SollicitatieSpecs">
            <span className={`Pil Pil--${sollicitatie.status}`}>{sollicitatie.status}</span>
            <span className="Pil">sollnr. {sollicitatie.sollicitatieNummer}</span>

            {aantalPlaatsen > 0 ? (
                <span className="Pil">
                    {isTVPLZ(sollicitatie.status)
                        ? `${aantalPlaatsen} plaats${aantalPlaatsen > 1 ? 'en' : ''}`
                        : `plaats${aantalPlaatsen > 1 ? 'en' : ''} ${vastePlaatsen}`}
                </span>
            ) : null}
        </div>
    );
};

SollicitatieSpecs.propTypes = {
    sollicitatie: PropTypes.object.isRequired,
};

module.exports = SollicitatieSpecs;
