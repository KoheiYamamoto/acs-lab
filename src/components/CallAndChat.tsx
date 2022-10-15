import {
    AzureCommunicationCallWithChatAdapterArgs,
    CallWithChatComposite,
    COMPONENT_LOCALE_JA_JP,
    LocalizationProvider,
    useAzureCommunicationCallWithChatAdapter
} from '@azure/communication-react';
import { CSSProperties } from 'react';

type CallAndChatProperties = {
    callWithChatAdapterArgs: AzureCommunicationCallWithChatAdapterArgs
};

/**
 * Entry point of your application.
 */
function CallAndChat({ callWithChatAdapterArgs }: CallAndChatProperties): JSX.Element {

    const adapter = useAzureCommunicationCallWithChatAdapter(callWithChatAdapterArgs);

    if (!!adapter) {
        return (
            <div style={{ height: '100vh', display: 'flex' }}>
                <div style={containerStyle}>
                    <LocalizationProvider locale={COMPONENT_LOCALE_JA_JP}>
                        <CallWithChatComposite adapter={adapter} />
                    </LocalizationProvider>
                </div>
            </div>
        );
    }

    return <h3>初期化中...</h3>;
}

const containerStyle: CSSProperties = {
    border: 'solid 0.125rem olive',
    margin: '0.5rem',
    width: '100vw'
};

export default CallAndChat;
