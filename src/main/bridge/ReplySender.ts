import ipcMain from 'electron';

class ReplySender implements MessageReplySender {
    private static instance?: ReplySender;

    private webId?: number;

    static get(): ReplySender {
        if (!ReplySender.instance) {
            ReplySender.instance = new ReplySender();
        }

        return ReplySender.instance;
    }

    setWebId(webId: number) {
        this.webId = webId;
    }

    clearWebId() {
        this.webId = undefined;
    }

    getWebId(): number | undefined {
        return this.webId;
    }

    sendReply<M extends ReplyType>(reply: MessageReply<M>): void {
        const webId = reply.webId ?? this.webId;
        if (!webId) {
            console.log(
                `Failed to send reply "${reply}", because no web id was defined.`
            );
            return;
        }
        ipcMain.webContents.fromId(webId).send('message/reply', reply);
    }

    processReply = (type: string, params: any, webId?: number): void => {
        this.sendReply({
            type: 'processResult',
            params: [type, params],
            webId,
        });
    };

    processCancel = (type: string, params: any, webId?: number): void => {
        this.sendReply({
            type: 'processCancel',
            params: [type, params],
            webId,
        });
    };
}

export default ReplySender.get();
