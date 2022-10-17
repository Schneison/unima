import { createRoot } from 'react-dom/client';
import App from './App';
import ReplyHandler from './bridge/ReplyHandler';

const container = document.getElementById('root');
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(container!);
root.render(<App />);

window.electron.ipcRenderer.on('message/reply', (arg: MessageReply<any>) => {
    ReplyHandler.handleReply(arg);
});
