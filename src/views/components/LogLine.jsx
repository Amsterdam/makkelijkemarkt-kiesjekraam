import React from 'react';

const LogLine = ({ type, message }) => {
    return (
        <pre>
            {type} : {message.toString()}
        </pre>
    );
};

export default LogLine;
