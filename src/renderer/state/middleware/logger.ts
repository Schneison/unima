import { Middleware } from 'redux';

const logger: Middleware = (storeApi) => (next) => (action) => {
    console.group(action.type);
    console.info('dispatching', action);
    const result = next(action);
    console.log('next state', storeApi.getState());
    console.groupEnd();
    return result;
};

export default logger;
