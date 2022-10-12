import { useState } from 'react';
import AzureCommunicationServicesSetup from './components/AzureCommunicationServicesSetup';
import CallAndChat from './components/CallAndChat';
import { AppState } from './models';

const ENDPOINT_URL = 'https://communicationservices-app-kaotaaca.communication.azure.com/';

/**
 * Entry point of your application.
 */
function App(): JSX.Element {
  const [appState, setAppState] = useState<AppState>({
    endopointUrl: ENDPOINT_URL
  });

  const updateAppState = (updatedValue: AppState) => setAppState({
    ...appState,
    ...updatedValue,
  });

  if (isFilled(appState)) {
    return (
      <CallAndChat
        endpoint={appState.endopointUrl}
        displayName={appState.displayName!}
        userId={appState.userId!}
        token={appState.token!}
        location={appState.groupId!}
        threadId={appState.threadId} />
    )
  } else {
    return (
      <AzureCommunicationServicesSetup
        appState={appState}
        updateAppState={updateAppState} />
    );
  }
}

function isFilled(appState: AppState) {
  return appState.displayName !== undefined &&
    appState.userId !== undefined &&
    appState.token !== undefined &&
    appState.groupId !== undefined;
}

export default App;
