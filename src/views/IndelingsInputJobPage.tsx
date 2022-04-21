import * as React from 'react';
import LogLine from './components/LogLine';

export default class IndelingsLogsPage extends React.Component {
    public render() {
        const data = this.props["data"];
        return (<pre>{data}</pre>);
    }
}
