import * as React from 'react';
import LogLine from './components/LogLine.jsx';

export default class IndelingsLogsPage extends React.Component {
    public render() {
        const data = this.props["data"];
        return (
            data.map((line, i) => (
                <LogLine key={"logline"+i}
                         type={line["level"]}
                         message={line["message"]}/>
            ))
        );
    }
}
