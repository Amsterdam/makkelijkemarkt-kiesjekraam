import React from 'react';

type Option = {
    header: string;
    text: string;
};

type Props = {
    options: Option[];
    children: JSX.Element;
};

const ModalPopup = (props: Props) => {
    const options = props.options.map((option: Option) => (
        <span>
            <h2>{option.header}</h2>
            <p>{option.text}</p>
        </span>
    ));
    return (
        <div className="modal-popup">
            <span>{props.children}</span>
            <div className="modal-popup__content">{options}</div>
        </div>
    );
};

export default ModalPopup;
