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
                <Header hideLogout={true} breadcrumbs={breadcrumbs} />
                <Content>
                    <h2>Wij zijn verhuisd!</h2>
                    <p>
                        Vanaf nu zijn wij te vinden op <b><a href="https://kiesjekraam.makkelijkemarkt.amsterdam.nl">https://kiesjekraam.makkelijkemarkt.amsterdam.nl</a></b>.  <br/>
                        Dit domein komt spoedig te vervallen.
                    </p>
                </Content>
            </Page>
        );
    }
}

module.exports = HomePage;
