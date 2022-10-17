import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import React from 'react';
import { Provider, shallowEqual } from 'react-redux';
import './App.css';
import { store } from './state/store';
import { useAppSelector } from './state/hooks';
import { selectCredential } from './state/reducers/loginReducer';
import LoginPage from './pages/credentials/LoginPage';
import FragmentPage from './pages/fragment/FragmentPage';
import DashboardPage from './pages/dashboard/DashboardPage';

// https://unsplash.com/s/photos/background-covers
// https://dribbble.com/shots/8081827/attachments/541429?mode=media
// https://dribbble.com/shots/14998286/attachments/6719356?mode=media
// https://www.pinterest.de/pin/8444318042850483/?nic_v3=1a3IG1fAk

const RestrictedView: React.FC = () => {
    const credentials = useAppSelector(selectCredential, shallowEqual);
    if (!credentials.verified) {
        return <LoginPage />;
    }
    return <DashboardPage />;
};

export default function App() {
    return (
        <div className="flexFrame">
            <Provider store={store}>
                <Router>
                    <Routes>
                        <Route path="/" element={<RestrictedView />} />
                        <Route
                            path="/module/:moduleId/*"
                            element={<FragmentPage />}
                        />
                    </Routes>
                </Router>
            </Provider>
        </div>
    );
}
