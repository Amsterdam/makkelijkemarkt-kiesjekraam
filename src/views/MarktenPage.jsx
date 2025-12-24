import {
    Cog,
    TriangleSmallDown
} from './components/svg';
import PropTypes from 'prop-types';
import PullDownMenu from './components/PullDownMenu';
import React from 'react';
const Page = require('./components/Page.jsx');
const Header = require('./components/Header');
const Content = require('./components/Content');
const MarktList = require('./components/MarktList');

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
                <Header role={role} user={user} breadcrumbs={breadcrumbs}>
                    {/* <ConfigurationPullDownMenu /> */}
                </Header>
                <Content>
                    <h1 className="Heading Heading--intro">Markten</h1>
                    <MarktList markten={markten} role={role} />
                </Content>
            </Page>
        );
    }
}

const ConfigurationPullDownMenu = () => {
    const options = [
        {
            destination: '/bdm/branches',
            name: 'Branches bewerken',
        },
    ];

    return (
        <PullDownMenu options={options}>
            <span>
                <Cog />
                <TriangleSmallDown />
            </span>
        </PullDownMenu>
    );
};

module.exports = MarktenPage;
