import PropTypes from 'prop-types';
import React from 'react';
const Content = require('./components/Content');
const Page = require('./components/Page.jsx');
const Header = require('./components/Header');

class ErrorPage extends React.Component {
    propTypes = {
        message: PropTypes.string,
        stack: PropTypes.string,
        req: PropTypes.object,
    };

    render() {
        const { message, stack, req } = this.props;

        return (
            <Page>
                <Header hideLogout={false} />
                <Content>
                    <h4>
                        Er is een fout opgetreden. <br />
                        Probeer opnieuw <a href={`/login?next=${req ? req.originalUrl : ''}`}>in te loggen</a>
                    </h4>
                    <p>{message}</p>
                    <p>{stack}</p>
                </Content>
            </Page>
        );
    }
}

module.exports = ErrorPage;
