import PropTypes from 'prop-types';
import React from 'react';
const Page = require('./components/Page.jsx');
const Content = require('./components/Content.jsx');
const Header = require('./components/Header.jsx');

class HomePage extends React.Component {
    propTypes = {
        user: PropTypes.object,
    };

    render() {
        const breadcrumbs = [];
        return (
            <Page>
                <Header breadcrumbs={breadcrumbs} />
                <Content>
                    <h2>Deze pagina is niet meer in gebruik</h2>
                    <p>
                        U kunt uw aanwezigheid via "mijn markten" aangeven.
                    </p>
                    <p>
                        <a href="/dashboard">Ga naar "mijn markten"</a>
                    </p>
                </Content>
            </Page>
        );
    }
}

module.exports = HomePage;
