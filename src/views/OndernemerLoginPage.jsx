import PropTypes from 'prop-types';
import React from 'react';
const Content = require('./components/Content');
const Header = require('./components/Header');
const ErkenningsnummerLoginForm = require('./components/ErkenningsnummerLoginForm');
const Page = require('./components/Page.jsx');

class OndernemerLoginPage extends React.Component {
    propTypes = {
        messages: PropTypes.array,
    };

    render() {
        return (
            <Page>
                <Header />
                <Content>
                    <h1 className="h1">Inloggen voor Koopmannen</h1>
                    {(this.props.messages || []).map(message => (
                        <p key={message.code} className={`Message Message--${message.code}`}>
                            {message.message}
                        </p>
                    ))}
                    <ErkenningsnummerLoginForm />
                </Content>
            </Page>
        );
    }
}

module.exports = OndernemerLoginPage;
