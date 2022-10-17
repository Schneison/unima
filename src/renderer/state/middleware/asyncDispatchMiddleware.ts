import { Action, Middleware } from 'redux';
import { DispatchAction } from '../actionDispatch';
// https://lazamar.github.io/dispatching-from-inside-of-reducers/
const asyncDispatchMiddleware: Middleware = (store) => (next) => (action) => {
    let syncActivityFinished = false;
    let actionQueue: Action[] = [];

    function flushQueue() {
        actionQueue.forEach((a) => store.dispatch(a)); // flush queue
        actionQueue = [];
    }

    function asyncDispatch(asyncAction: Action) {
        actionQueue = actionQueue.concat([asyncAction]);

        if (syncActivityFinished) {
            flushQueue();
        }
    }

    const actionWithAsyncDispatch: DispatchAction = {
        ...action,
        asyncDispatch,
    };

    const res = next(actionWithAsyncDispatch);

    syncActivityFinished = true;
    flushQueue();

    return res;
};
export default asyncDispatchMiddleware;
