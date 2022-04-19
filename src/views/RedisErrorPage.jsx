import PropTypes from 'prop-types';
import React from 'react';
const Page = require('./components/Page.jsx');
const Content = require('./components/Content.jsx');
const Header = require('./components/Header.jsx');

class RedisErrorPage extends React.Component {
    propTypes = {
        user: PropTypes.object,
    };

    render() {
        return (
            <Page>
                <Header hideLogout={true} />
                <Content>
                    <h2>De conceptindeling service is tijdelijk offline</h2>
                    <p>
                        Probeer het later nogmaals a.u.b. Zodra deze service weer online is kunnen de conceptindelingen
                        weer worden berekend.
                    </p>
                </Content>
            </Page>
        );
    }
}

module.exports = RedisErrorPage;
