import PropTypes from 'prop-types';
import React from 'react';
const Content = require('./components/Content');
const Page = require('./components/Page.jsx');
const OndernemerProfile = require('./components/OndernemerProfile.jsx');
const Header = require('./components/Header');

class ProfilePage extends React.Component {
    propTypes = {
        ondernemer: PropTypes.object,
        user: PropTypes.object.isRequired,
        messages: PropTypes.array,
    };

    render() {
        return (
            <Page messages={this.props.messages}>
                <Header user={this.props.user} />
                <Content>
                    <OndernemerProfile user={this.props.user} ondernemer={this.props.ondernemer} />
                    <p>
                        <a href="/logout">Uitloggen</a>
                    </p>
                </Content>
            </Page>
        );
    }
}

module.exports = ProfilePage;
