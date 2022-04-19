import PropTypes from 'prop-types';
import React from 'react';
const Content = require('./components/Content');
const Header = require('./components/Header');
const Page = require('./components/Page.jsx');

class AccountCreatedPage extends React.Component {
    propTypes = {
        username: PropTypes.string,
        code: PropTypes.string,
        messages: PropTypes.array,
    };

    render() {
        return (
            <Page messages={this.props.messages}>
                <Header />
                <Content>
                    <h1 className="h1">Gelukt!</h1>
                    <p>
                        Je kunt nu <a href="/login">inloggen met je registratienummer en wachtwoord</a>.
                    </p>
                    <p className="InputField InputField--submit">
                        <a className="Button Button--primary" href="login">
                            Verder
                        </a>
                    </p>
                </Content>
            </Page>
        );
    }
}

module.exports = AccountCreatedPage;
