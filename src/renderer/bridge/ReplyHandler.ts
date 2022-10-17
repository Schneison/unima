import { store } from '../state/store';

class ReplyHandler implements MessageReplyHandler, MessageReplyConsumer {
    private static instance?: ReplyHandler;

    static get(): ReplyHandler {
        if (!ReplyHandler.instance) {
            ReplyHandler.instance = new ReplyHandler();
        }

        return ReplyHandler.instance;
    }

    processResult = (type: string, arg: any): void => {
        store.dispatch({
            type: `${type}`,
            payload: arg,
        });
    };

    processCancel = (type: string, arg: any): void => {
        store.dispatch({
            type: `${type}/canceled`,
            payload: arg,
        });
    };

    handleReply<M extends ReplyType>(reply: MessageReply<M>): void {
        const handler = this[reply.type];
        if (handler) {
            handler.call(undefined, ...reply.params);
        }
    }
}

export default ReplyHandler.get();
