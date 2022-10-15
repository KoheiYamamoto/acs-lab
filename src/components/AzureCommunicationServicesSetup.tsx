import { FormEvent, useEffect, useState } from "react";
import { DefaultButton, PrimaryButton, TextField } from "@fluentui/react";
import { CommunicationIdentityClient } from '@azure/communication-identity';
import { v4 as uuidv4 } from "uuid";
import { AzureCommunicationCallWithChatAdapterArgs, CallAndChatLocator, fromFlatCommunicationIdentifier } from "@azure/communication-react";
import { CommunicationUserIdentifier, AzureCommunicationTokenCredential } from "@azure/communication-common";
import { ChatClient } from "@azure/communication-chat";
import "./AzureCommunicationServicesSetup.css";
import { TeamsMeetingLinkLocator } from "@azure/communication-calling";
import { ENDPOINT, CONNECTION_STRING } from '../settings';

type AzureCommunicationServicesSetupProperties = {
    setCallWithChatAdapterArgs: (arg: AzureCommunicationCallWithChatAdapterArgs) => void,
}

function AzureCommunicationServicesSetup({ setCallWithChatAdapterArgs }: AzureCommunicationServicesSetupProperties) {
    const {
        userId,
        token,
        groupId,
        threadId,
        displayName,
        setDisplayName,
        setCustomCallAndChatInfo,
        createChatThread,
        addParticipantToChatThread,
        callWithChatAdapterArgs,
    } = useAzureCommunicationServicesSetup();

    const [inputTopic, setInputTopic] = useState("");
    const [inputGroupId, setInputGroupId] = useState("");
    const [inputThreadId, setInputThreadId] = useState("");
    const [inputParticipantUserId, setInputParticipantUserId] = useState("");

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (!callWithChatAdapterArgs) return;

        setCallWithChatAdapterArgs(callWithChatAdapterArgs)
    };

    return (
        <div className="container">
            <h3>Azure Communication Services の情報設定</h3>
            <form onSubmit={submit}>
                <label>ユーザー ID</label>
                <span className="wrap-text">{userId ?? 'ユーザー ID を取得中'}</span>
                <label>トークン</label>
                <span className="wrap-text">{token ?? 'トークンを取得中'}</span>

                <TextField label="Display name"
                    className="input"
                    value={displayName}
                    onChange={(e, newValue) => setDisplayName(newValue ?? '')} />

                <div className="chat-info">
                    <div className="create-new-chat">
                        <h4>新しい会議を作成</h4>
                        <TextField
                            label="トピック"
                            className="input"
                            value={inputTopic}
                            onChange={(e, newValue) => setInputTopic(newValue ?? '')} />
                        <DefaultButton
                            text="会議を作成"
                            disabled={!inputTopic}
                            onClick={() => createChatThread(inputTopic)} />
                        <TextField
                            label="会議に追加するユーザーの ID"
                            value={inputParticipantUserId}
                            onChange={(e, newValue) => setInputParticipantUserId(newValue ?? '')}
                            className="input" />
                        <DefaultButton
                            text="ユーザーを追加"
                            disabled={!inputParticipantUserId && !groupId && !threadId}
                            onClick={() =>
                                addParticipantToChatThread(inputParticipantUserId)
                                    .then(x => {
                                        if (x) {
                                            alert(`${inputParticipantUserId} を追加しました。`);
                                            setInputParticipantUserId('');
                                        } else {
                                            alert(`${inputParticipantUserId} の追加に失敗しました。`);
                                        }
                                    })} />

                    </div>
                    <div className="set-exist-chat-info">
                        <h4>既存の会議情報を入力</h4>
                        <TextField
                            label="グループ ID または Teams 会議リンク"
                            value={inputGroupId}
                            onChange={(e, newValue) => setInputGroupId(newValue ?? '')}
                            className="input" />
                        <TextField
                            label="チャット スレッド ID"
                            value={inputThreadId}
                            disabled={inputGroupId.startsWith('https://')}
                            onChange={(e, newValue) => setInputThreadId(newValue ?? '')}
                            className="input" />
                        <DefaultButton
                            text="参加する会議情報を設定"
                            disabled={!inputGroupId}
                            onClick={() => setCustomCallAndChatInfo(inputGroupId!, inputThreadId!)} />
                    </div>
                </div>
                <div>
                    <h4>参加会議情報</h4>
                    {!!groupId ?
                        (<>
                            <label>グループ ID</label>
                            <span>{groupId}</span>
                            <label>チャット スレッド ID</label>
                            <span>{threadId}</span>
                        </>) :
                        (<span>参加する会議情報がありません</span>)}
                </div>

                <PrimaryButton type="submit"
                    text="会議に参加する"
                    disabled={!callWithChatAdapterArgs} />
            </form>
        </div>
    );
}

function useAzureCommunicationServicesSetup() {
    const [userId, setUserId] = useState('');
    const [token, setToken] = useState('');
    const [groupId, setGroupId] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [threadId, setThreadId] = useState('');
    const [credential, setCredential] = useState<AzureCommunicationTokenCredential>();
    const [callWithChatAdapterArgs, setCallWithChatAdapterArgs] = useState<AzureCommunicationCallWithChatAdapterArgs>();

    useEffect(() => {
        // get user id
        (async () => {
            const client = new CommunicationIdentityClient(CONNECTION_STRING);
            setUserId((await client.createUser()).communicationUserId);
            setGroupId('');
            setThreadId('');
            setToken('');
        })();
    }, []);

    useEffect(() => {
        // get token
        (async () => {
            if (!userId) return;

            const client = new CommunicationIdentityClient(CONNECTION_STRING);
            const user = fromFlatCommunicationIdentifier(userId) as CommunicationUserIdentifier;
            const token = await client.getToken(
                user,
                ['chat', 'voip']);
            setToken(token.token);
            setCredential(new AzureCommunicationTokenCredential(token.token));
        })();
    }, [userId]);

    const createChatThread = async (topic: string) => {
        if (!credential) return;
        if (!userId) return;
        if (!displayName) return;
        if (!topic) return;

        const client = new ChatClient(ENDPOINT, credential);
        const result = await client.createChatThread(
            {
                topic,
            },
            {
                participants: [
                    {
                        id: fromFlatCommunicationIdentifier(userId),
                        displayName,
                    }
                ]
            }
        );

        if (!result.invalidParticipants) {
            setGroupId(uuidv4());
            setThreadId(result.chatThread?.id ?? '');
        } else {
            setGroupId('');
            setThreadId('');
        }
    };

    const addParticipantToChatThread = async (participantUserId: string) => {
        // チャットにユーザーを追加
        if (!credential) return;
        if (!threadId) return;
        if (!participantUserId) return;

        const client = new ChatClient(ENDPOINT, credential);
        const threadClient = client.getChatThreadClient(threadId);
        const result = await threadClient.addParticipants({
            participants: [
                { id: fromFlatCommunicationIdentifier(participantUserId) }
            ]
        });

        return !result.invalidParticipants;
    }


    useEffect(() => {
        const isValidInput = () => {
            const isValidMeetingInfo = () => {
                // Teams リンクか、groupIdとthreadIdの両方が入っているかチェック
                if (groupId?.startsWith("https://")) return true;
                return !!groupId && !!threadId;
            }
    
            // 入力情報がそろっているか確認
            return !!userId && !!credential && !!displayName && isValidMeetingInfo();    
        };

        if (!isValidInput) {
            setCallWithChatAdapterArgs(undefined);
            return;
        }

        const locator = groupId.startsWith("https://") ?
            { meetingLink: groupId } as TeamsMeetingLinkLocator :
            { callLocator: { groupId }, chatThreadId: threadId } as CallAndChatLocator;

        setCallWithChatAdapterArgs({
            endpoint: ENDPOINT,
            userId: fromFlatCommunicationIdentifier(userId) as CommunicationUserIdentifier,
            displayName,
            credential: credential!,
            locator,
        });
    }, [userId, displayName, credential, groupId, threadId]);

    const setCustomCallAndChatInfo = (groupId: string, threadId: string) => {
        setGroupId(groupId);
        setThreadId(threadId);
    };

    return {
        userId,
        token,
        groupId,
        threadId,
        displayName,
        setDisplayName,
        setCustomCallAndChatInfo,
        createChatThread,
        addParticipantToChatThread,
        callWithChatAdapterArgs,
    };
}

export default AzureCommunicationServicesSetup;
