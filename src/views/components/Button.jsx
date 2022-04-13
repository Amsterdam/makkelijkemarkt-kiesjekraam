import PropTypes from 'prop-types';
import React from 'react';

const Button = ({ label, href, type }) => {
    return (
        <a className={`Button Button--${type ? type : 'primary'}`} href={href} role="button">
            {label}
        </a>
    );
};

Button.propTypes = {
    label: PropTypes.string.isRequired,
    href: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['primary', 'secondary', 'tertiary']),
};

module.exports = Button;
