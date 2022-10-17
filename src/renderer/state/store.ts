import { configureStore } from '@reduxjs/toolkit';
import loggerMiddleware from './middleware/logger';
import monitorReducerEnhancer from './enhancers/monitorReducer';
// eslint-disable-next-line import/no-cycle
import roodReducer from './reducers';
import asyncDispatchMiddleware from './middleware/asyncDispatchMiddleware';

export default function configureAppStore() {
    const store = configureStore({
        reducer: roodReducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware()
                .concat(loggerMiddleware)
                .concat(asyncDispatchMiddleware),
        enhancers: [monitorReducerEnhancer],
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (process.env.NODE_ENV !== 'production' && module.hot) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        module.hot.accept('./reducers', () =>
            store.replaceReducer(roodReducer)
        );
    }

    return store;
}

export const store = configureAppStore();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
