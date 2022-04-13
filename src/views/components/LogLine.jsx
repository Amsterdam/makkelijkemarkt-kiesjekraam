import React from 'react';

const LogLine = ({ type, message }) => {
    return (
        <pre>
            {type} : {message}
        </pre>
    );
};

module.exports = LogLine;
