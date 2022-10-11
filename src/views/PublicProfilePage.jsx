import PropTypes from 'prop-types';
import React from 'react';
const Content = require('./components/Content');
const Page = require('./components/Page.jsx');
const OndernemerProfile = require('./components/OndernemerProfile.jsx');
const Header = require('./components/Header');

class PublicProfilePage extends React.Component {
    propTypes = {
        ondernemer: PropTypes.object,
        user: PropTypes.object.isRequired,
        messages: PropTypes.array,
        role: PropTypes.string,
    };

    render() {
        const { ondernemer, role, messages, user } = this.props;

        return (
            <Page messages={messages}>
                <Header user={user} role={role}>
                </Header>
                <Content>
                    <OndernemerProfile ondernemer={ondernemer} role={role} />
                </Content>
            </Page>
        );
    }
}
module.exports = PublicProfilePage;
