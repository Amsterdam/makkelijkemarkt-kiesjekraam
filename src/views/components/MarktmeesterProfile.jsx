import PropTypes from 'prop-types';
import React from 'react';

class MarktmeesterProfile extends React.Component {
    propTypes = {
        user: PropTypes.object.isRequired,
    };

    render() {
        return (
            <div>
                <h1>{this.props.user.username}</h1>
                <p>Welkom {this.props.user.username}!</p>
            </div>
        );
    }
}

module.exports = MarktmeesterProfile;
