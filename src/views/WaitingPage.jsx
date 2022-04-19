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
        const js = `window.setTimeout(function () {
                        window.location.reload();
                    }, 2000)`;
        return (
            <Page>
                <script dangerouslySetInnerHTML={{ __html: js }} />
                <Header hideLogout={true} />
                <Content>
                    <h2>Even geduld a.u.b</h2>
                    <p>
                        <p>
                            <img width="20px" src="/images/loading-buffering.gif" />
                        </p>
                        Het berekenen van een concept indeling kan even duren. Deze pagina ververst automatisch. Zodra
                        de berekening klaar is wordt de indeling getoond.
                    </p>
                </Content>
            </Page>
        );
    }
}

module.exports = HomePage;
