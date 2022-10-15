if (!process.env.REACT_APP_ACS_ENDPOINT) {
    throw Error('.env に REACT_APP_ACS_ENDPOINT の定義がありません。');
}
if (!process.env.REACT_APP_ACS_CONNECTION_STRING) {
    throw Error('.env に REACT_APP_ACS_CONNECTION_STRING の定義がありません。');
}

export const ENDPOINT = process.env.REACT_APP_ACS_ENDPOINT;
export const CONNECTION_STRING = process.env.REACT_APP_ACS_CONNECTION_STRING;
