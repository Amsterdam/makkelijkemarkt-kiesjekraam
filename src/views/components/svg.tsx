import React from 'react';

type Props = {
    style: React.CSSProperties;
};

export const Cog = ({ style }: Props) => {
    return (
        <svg className="svg-icon-cog" style={style} viewBox="0 0 24 24">
            <path
                fill="currentColor"
                d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"
            />
        </svg>
    );
};

export const TriangleSmallDown = ({ style }: Props) => {
    return (
        <svg className="svg-icon-triangle-small-down" style={style} viewBox="0 0 24 24">
            <path fill="currentColor" d="M8 9H16L12 16" />
        </svg>
    );
};

export const InfoCircle = ({ style }: Props) => {
    return (
        <svg className="svg-icon-info-circle" style={style} viewBox="0 0 16 16">
            <path
                fill="currentColor"
                d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"
            />
            <path
                fill="currentColor"
                d="M8.93 6.588l-2.29 0.287 -0.082 0.38 0.45 0.083c0.294 0.07 0.352 0.176 0.288 0.469l-0.738 3.468c-0.194 0.897 0.105 1.319 0.808 1.319 0.545 0 1.178 -0.252 1.465 -0.598l0.088 -0.416c-0.2 0.176 -0.492 0.246 -0.686 0.246 -0.275 0 -0.375 -0.193 -0.304 -0.533L8.93 6.588zM9 4.5a1 1 0 1 1 -2 0 1 1 0 0 1 2 0z"
            />
        </svg>
    );
};
