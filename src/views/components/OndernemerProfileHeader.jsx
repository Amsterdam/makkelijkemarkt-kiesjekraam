import PropTypes from 'prop-types';
import React from 'react';
const ProfilePhoto = require('./ProfilePhoto');
const { formatOndernemerName } = require('../../domain-knowledge.ts');

const OndernemerProfileHeader = ({ user, inline }) => {
    return (
        <header className={`OndernemerProfileHeader ${inline ? 'OndernemerProfileHeader--inline' : null}`}>
            <div className="OndernemerProfileHeader__profile-photo">
                <ProfilePhoto imageUrlSet={[user.fotoUrl, user.fotoMediumUrl]} />
            </div>
            <div className="OndernemerProfileHeader__text-wrapper">
                <strong className="OndernemerProfileHeader__name">{formatOndernemerName(user)}</strong>
                <span className="OndernemerProfileHeader__id">
                    <span className="OndernemerProfileHeader__id-label">registratienummer: </span>
                    <strong className="OndernemerProfileHeader__id-value">{user.erkenningsnummer}</strong>
                </span>
            </div>
        </header>
    );
};

OndernemerProfileHeader.propTypes = {
    user: PropTypes.object.isRequired,
    inline: PropTypes.bool,
};

module.exports = OndernemerProfileHeader;
