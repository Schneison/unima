import { v4 as uuidv4 } from 'uuid';
import ReplySender from './ReplySender';

export default class ProcessManager {
    private static instance?: ProcessManager;

    private static get(): ProcessManager {
        if (!ProcessManager.instance) {
            ProcessManager.instance = new ProcessManager();
        }

        return ProcessManager.instance;
    }

    molds: Record<string, ProcessMold> = {};

    processes: Record<string, Process> = {};

    listeners: ProcessManagerListener[] = [];

    private constructor() {
        this.molds = {
            download: {
                id: 'download',
                steps: [
                    {
                        title: 'Check login',
                    },
                    {
                        title: 'Try download',
                    },
                ],
            },
        };
    }

    public static requestProcess(moldId?: string): Process {
        return this.get().createProcess(moldId);
    }

    createProcess(moldId?: string): Process {
        const id = uuidv4();
        const process: Process = {
            id,
            webId: ReplySender.getWebId(),
            moldId,
        };
        this.processes[id] = process;
        this.listeners.forEach((listener) => {
            if (listener.onStart) {
                listener.onStart(process);
            }
        });
        return process;
    }

    killProcess(processID: string) {
        const process = this.processes[processID];
        if (process) {
            this.listeners.forEach((listener) => {
                if (listener.onKill) {
                    listener.onKill(process);
                }
            });
        }
        delete this.processes[processID];
    }

    public static listenKill(listener: (process: Process) => void) {
        this.get().listeners.push({
            onKill: listener,
        });
    }

    public static kill(processID: string) {
        this.get().killProcess(processID);
    }
}
