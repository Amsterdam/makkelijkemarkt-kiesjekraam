import PropTypes from 'prop-types';
import React from 'react';
const Page = require('./components/Page.jsx');
const Content = require('./components/Content.jsx');
const Header = require('./components/Header.jsx');

const Allocations = (props) => {
    return props.children.map(allocation => {
        const style = {
            backgroundColor: allocation.arePrefsMet ? 'aliceblue' : 'white',
        }
        return (
            <tr>
                <td>{allocation.sollicitatieNummer}</td>
                <td>{allocation.branche}</td>
                <td style={style}>{allocation.plaatsvoorkeuren.join(', ')}</td>
                <td>{allocation.anywhere ? 'True' : 'False'}</td>
                <td style={style}>{allocation.plaatsen.join(', ')}</td>
                <td>{allocation.minimum}</td>
                <td>{allocation.maximum}</td>
            </tr>
        )
    })
}

class HomePage extends React.Component {
    render() {
        const style = {
            textAlign: 'right',
        }
        const prefsMetCount = this.props.allocations.filter(allocation => allocation.arePrefsMet).length
        return (
            <Page>
                <Header />
                <Content>
                    <h2>Indeling stats {this.props.markt.naam} op {this.props.marktDate}</h2>
                    <p>Ondernemers met plaatsen uit voorkeuren {prefsMetCount} van {this.props.allocations.length}</p>
                    <table style={style}>
                        <thead>
                            <th>sollicitatieNummer</th>
                            <th>branche</th>
                            <th>plaatsvoorkeuren</th>
                            <th>anywhere</th>
                            <th>plaatsen</th>
                            <th>minimum</th>
                            <th>maximum</th>
                        </thead>
                        <tbody>
                            <Allocations>{this.props.allocations}</Allocations>
                        </tbody>
                    </table>
                    <br />
                </Content>
            </Page>
        );
    }
}

module.exports = HomePage;
