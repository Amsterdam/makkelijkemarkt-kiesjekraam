import * as React from 'react';
const Page = require('./components/Page.jsx');
const Content = require('./components/Content.jsx');
const Header = require('./components/Header.jsx');

export default class IndelingsErrorPage extends React.Component {
    public render() {
        const data = this.props;
        return (
            <Page>
                <Header hideLogout={true}/>
                <Content>
                    <h2>{data["error"]}</h2>
                    <p>
                        Neem contact op met het ontwikkelteam a.u.b. (Foutnummer: {data["error_id"]})
                    </p>
                </Content>
            </Page>
        );
    }
}
