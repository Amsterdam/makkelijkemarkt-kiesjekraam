import PropTypes from 'prop-types';
import React from 'react';

const LoginButton = ({ user }) => {
    return (
        <a className={`LoginButton LoginButton--logout`} href={`/logout`} role="button">
            Uitloggen
        </a>
    );
};

LoginButton.propTypes = {
    user: PropTypes.object,
};

module.exports = LoginButton;
