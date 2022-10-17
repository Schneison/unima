import { AnyAction, StoreEnhancer, StoreEnhancerStoreCreator } from 'redux';
import { Reducer } from 'react';

const round = (number: number) => Math.round(number * 100) / 100;

// @ts-ignore
const monitorReducerEnhancer: StoreEnhancer<any, AnyAction> =
    (createStore: StoreEnhancerStoreCreator<any, AnyAction>) =>
    (reducer: Reducer<any, AnyAction>, initialState) => {
        const monitoredReducer: Reducer<any, AnyAction> = (state, action) => {
            const start = performance.now();
            const newState = reducer(state, action);
            const end = performance.now();
            const diff = round(end - start);

            console.log('reducers process time:', diff);

            return newState;
        };

        return createStore(monitoredReducer, initialState);
    };

export default monitorReducerEnhancer;
