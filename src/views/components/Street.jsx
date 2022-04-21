import PropTypes from 'prop-types';
import React from 'react';

const Street = ({ title }) => {
    return (
        <h3 className="Street">
            <span className="Street__title">{title}</span>
        </h3>
    );
};

Street.propTypes = {
    title: PropTypes.string,
};

export default Street;
