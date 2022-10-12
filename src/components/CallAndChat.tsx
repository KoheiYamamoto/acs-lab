import { TeamsMeetingLinkLocator } from '@azure/communication-calling';
import { AzureCommunicationTokenCredential, CommunicationUserIdentifier } from '@azure/communication-common';
import {
    AzureCommunicationCallWithChatAdapterArgs,
    CallAndChatLocator,
    CallWithChatComposite,
    COMPONENT_LOCALE_JA_JP,
    fromFlatCommunicationIdentifier,
    LocalizationProvider,
    useAzureCommunicationCallWithChatAdapter
} from '@azure/communication-react';
import { CSSProperties, useMemo } from 'react';

type CallAndChatProperties = {
    endpoint: string,
    userId: string,
    displayName: string,
    token: string,
    location: string,
    threadId?: string,
};

/**
 * Entry point of your application.
 */
function CallAndChat(props: CallAndChatProperties): JSX.Element {
    // Arguments that would usually be provided by your backend service or
    // (indirectly) by the user.
    const { endpoint, userId, token, displayName, location, threadId } = props;

    // A well-formed token is required to initialize the chat and calling adapters.
    const credential = useMemo(() => {
        try {
            return new AzureCommunicationTokenCredential(token);
        } catch {
            console.error('Failed to construct token credential');
            return undefined;
        }
    }, [token]);

    // Memoize arguments to `useAzureCommunicationCallAdapter` so that
    // a new adapter is only created when an argument changes.
    const args = useMemo(
        () => {
            const locator = location.startsWith("https://") ?
                { meetingLink: location } as TeamsMeetingLinkLocator :
                { callLocator: { groupId: location }, chatThreadId: threadId } as CallAndChatLocator;
            return {
                endpoint,
                userId: fromFlatCommunicationIdentifier(userId) as CommunicationUserIdentifier,
                displayName,
                credential,
                locator,
            } as AzureCommunicationCallWithChatAdapterArgs;
        },
        [endpoint, userId, credential, displayName, threadId, location]
    );
    const adapter = useAzureCommunicationCallWithChatAdapter(args);

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
    if (credential === undefined) {
        return <h3>Failed to construct credential. Provided token is malformed.</h3>;
    }
    return <h3>初期化中...</h3>;
}

const containerStyle: CSSProperties = {
    border: 'solid 0.125rem olive',
    margin: '0.5rem',
    width: '100vw'
};

export default CallAndChat;
