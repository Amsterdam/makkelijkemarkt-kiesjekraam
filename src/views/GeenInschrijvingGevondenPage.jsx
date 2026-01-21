import PropTypes from 'prop-types';
import React from 'react';
const Page = require('./components/Page.jsx');
const Content = require('./components/Content.jsx');
const Header = require('./components/Header.jsx');

class GeenInschrijvingGevondenPage extends React.Component {
    render() {
        const breadcrumbs = [];
        return (
            <Page>
                <Header breadcrumbs={breadcrumbs} />
                <Content>
                    <h2>Geen geldige inschrijving gevonden</h2>
                    <p>
                        Op "mijn markten" kunt u een overzicht van uw inschrijvingen te zien.
                    </p>
                    <p>
                        <a href="/dashboard">Ga naar "mijn markten"</a>
                    </p>
                </Content>
            </Page>
        );
    }
}

module.exports = GeenInschrijvingGevondenPage;
