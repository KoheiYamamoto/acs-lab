import { FormEvent, FormEventHandler, useCallback, useEffect, useMemo, useState } from "react";
import { AppState } from "../models";
import { DefaultButton, getPropsWithDefaults, inputProperties, PrimaryButton, Stack, TextField } from "@fluentui/react";
import { CommunicationIdentityClient } from '@azure/communication-identity';
import { v4 as uuidv4 } from "uuid";
import { fromFlatCommunicationIdentifier } from "@azure/communication-react";
import { CommunicationUserIdentifier, AzureCommunicationTokenCredential } from "@azure/communication-common";
import { ChatClient } from "@azure/communication-chat";
import "./AzureCommunicationServicesSetup.css";
const ENDPOINT = process.env.REACT_APP_ACS_ENDPOINT;
const CONNECTION_STRING = process.env.REACT_APP_ACS_CONNECTION_STRING;

type AzureCommunicationServicesSetupProperties = {
    appState: AppState,
    updateAppState: (newValue: AppState) => void,
}

function AzureCommunicationServicesSetup(props: AzureCommunicationServicesSetupProperties) {
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
        isValidInput,
        submit,
    } = useAzureCommunicationServicesSetup(props);

    const [inputTopic, setInputTopic] = useState("");
    const [inputGroupId, setInputGroupId] = useState("");
    const [inputThreadId, setInputThreadId] = useState("");
    const [inputParticipantUserId, setInputParticipantUserId] = useState("");

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
                                            setInputParticipantUserId('');
                                        }
                                    })} />

                    </div>
                    <div className="set-exist-chat-info">
                        <h4>既存の会議情報を入力</h4>
                        <TextField
                            label="グループ ID"
                            value={inputGroupId}
                            onChange={(e, newValue) => setInputGroupId(newValue ?? '')}
                            className="input" />
                        <TextField
                            label="チャット スレッド ID"
                            value={inputThreadId}
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
                    disabled={!isValidInput} />
            </form>
        </div>
    );
}

function useAzureCommunicationServicesSetup({ appState, updateAppState }: AzureCommunicationServicesSetupProperties) {
    const [userId, setUserId] = useState(appState.userId);
    const [token, setToken] = useState(appState.token);
    const [groupId, setGroupId] = useState(appState.groupId);
    const [displayName, setDisplayName] = useState(appState.displayName);
    const [threadId, setThreadId] = useState(appState.threadId);
    const [credential, setCredential] = useState<AzureCommunicationTokenCredential>();

    useEffect(() => {
        // get user id
        (async () => {
            const client = new CommunicationIdentityClient(CONNECTION_STRING);
            setUserId((await client.createUser()).communicationUserId);
            setGroupId('');
            setThreadId('');
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

    const isValidInput = useMemo(() => {
        const isValidMeetingInfo = () => {
            if (!groupId) return false;
            if (groupId.startsWith("https://")) return true;
            return !!threadId;
        }

        return !!userId && !!token && !!displayName && isValidMeetingInfo();
    }, [userId, token, groupId, displayName, threadId]);

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
            setThreadId(result.chatThread?.id);
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


    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (!isValidInput) return;

        updateAppState({
            ...appState,
            userId,
            token,
            displayName: displayName,
            groupId: groupId,
            threadId,
        });
    };

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
        isValidInput,
        submit,
    };
}

export default AzureCommunicationServicesSetup;
