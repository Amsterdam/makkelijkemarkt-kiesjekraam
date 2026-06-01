import React from 'react';

const PrintButton = () => {
    return (
        <div className="PrintButton">
            <a href="#" role="button" className="PrintButton__btn" data-handler="print-page">
                Print
            </a>
        </div>
    );
};

PrintButton.propTypes = {};

module.exports = PrintButton;
