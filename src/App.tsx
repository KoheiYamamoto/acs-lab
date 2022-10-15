import { AzureCommunicationCallWithChatAdapterArgs } from '@azure/communication-react';
import { useState } from 'react';
import AzureCommunicationServicesSetup from './components/AzureCommunicationServicesSetup';
import CallAndChat from './components/CallAndChat';

/**
 * Entry point of your application.
 */
function App(): JSX.Element {
  const [callWithChatAdapterArgs, setCallWithChatAdapterArgs] = useState<AzureCommunicationCallWithChatAdapterArgs>();
  if (!!callWithChatAdapterArgs) {
    return (
      <CallAndChat
        callWithChatAdapterArgs={callWithChatAdapterArgs} />
    )
  } else {
    return (
      <AzureCommunicationServicesSetup
        setCallWithChatAdapterArgs={setCallWithChatAdapterArgs} />
    );
  }
}

export default App;
