import PropTypes from 'prop-types';
import React from 'react';
const Page = require('./components/Page.jsx');
const Content = require('./components/Content.jsx');
const Header = require('./components/Header.jsx');

class WijzigenNietToegestaanPage extends React.Component {
    render() {
        const breadcrumbs = [];
        return (
            <Page>
                <Header breadcrumbs={breadcrumbs} />
                <Content>
                    <h2>Niet toegestaan</h2>
                    <p>
                        Het is niet toegestaan om wijzigingen aan te brengen.
                    </p>
                </Content>
            </Page>
        );
    }
}

module.exports = WijzigenNietToegestaanPage;
