
import PropTypes from 'prop-types';
import React from 'react';
import Page from './components/Page'
import Header from './components/Header'
import Content from './components/Content'
import MarktList from './components/MarktList'

class KramenzetterOverzichtPage extends React.Component {
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
                    <h1 className="Heading Heading--intro">Marktindelingen</h1>
                    <MarktList markten={markten} role={role}/>
                </Content>
            </Page>
        );
    }
}

export default KramenzetterOverzichtPage
