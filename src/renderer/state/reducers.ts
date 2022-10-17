import { combineReducers } from 'redux';
// Disable because cycle is coursed by type, which is not damaging
/* eslint-disable import/no-cycle */
import sourceReducer from './reducers/sourceReducer';
import resourceReducer from './reducers/resourceReducer';
import settingsReducer from './reducers/settingsReducer';
import moduleReducer from './reducers/moduleReducer';
import detectedReducer from './reducers/detectedReducer';
import demandReducer from './reducers/demandReducer';
import structureReducer from './reducers/structureReducer';
import loginReducer from './reducers/loginReducer';
import fragmentReducer from './reducers/fragmentReducer';
/* eslint-enable import/no-cycle */

const reducers = combineReducers({
    sources: sourceReducer,
    resources: resourceReducer,
    settings: settingsReducer,
    modules: moduleReducer,
    detected: detectedReducer,
    demand: demandReducer,
    fragments: fragmentReducer,
    structures: structureReducer,
    login: loginReducer,
});

export default reducers;
