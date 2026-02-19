import Content from './components/Content';
import Header from './components/Header';
import MarktList from './components/MarktList';
import Page from './components/Page.jsx';
import PropTypes from 'prop-types';
import React from 'react';

class MarktenPage extends React.Component {
    propTypes = {
        markten: PropTypes.array,
        user: PropTypes.object,
        role: PropTypes.string,
    };

    render() {
        const breadcrumbs = [];
        const { role, user, markten } = this.props;
        return (
            <Page>
                <Header role={role} user={user} breadcrumbs={breadcrumbs} />
                <Content>
                    <h1 className="Heading Heading--intro">Markten</h1>
                    <MarktList markten={markten} role={role} />
                </Content>
            </Page>
        );
    }
}

module.exports = MarktenPage;
