import PropTypes from 'prop-types';
import React from 'react';
const { QRCode } = require('react-qr-svg');

class QRCodeImage extends React.Component {
    propTypes = {
        value: PropTypes.string.isRequired,
    };

    render() {
        return <QRCode bgColor="#FFFFFF" fgColor="#000000" level="Q" style={{ width: 256 }} value={this.props.value} />;
    }
}

module.exports = QRCodeImage;
