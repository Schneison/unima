import React, { useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    CircularProgress,
    Stack,
    Typography,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import TextFormInput from '../../form/TextFormInput';
import {
    canDoCheck,
    checkLogin,
    isLoginInProgress,
    selectCredential,
    tryLogin,
} from '../../state/reducers/loginReducer';

const LoginPage: React.FC = () => {
    const dispatch = useDispatch();
    const credential = useSelector(selectCredential);
    const processing = useSelector(isLoginInProgress);
    const needCheck = useSelector(canDoCheck);
    useEffect(() => {
        if (!needCheck) {
            return;
        }
        dispatch(checkLogin());
    });
    const form = useForm<CredentialData>({
        defaultValues: {
            password: '',
            username: '',
        },
    });
    const { control, handleSubmit } = form;
    return (
        <Stack direction="row" alignItems="center" height="500">
            <div style={{ minWidth: 400 }}>
                <Box sx={{ display: 'flex' }}>
                    <Card
                        sx={{
                            p: 2,
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            width: 120,
                        }}
                    >
                        <CardHeader
                            style={{ flex: 1 }}
                            title={
                                <Typography
                                    variant="h5"
                                    style={{
                                        textAlign: 'center',
                                    }}
                                >
                                    Login
                                </Typography>
                            }
                        />
                        <CardContent>
                            <Stack direction="column" alignItems="center">
                                <TextFormInput
                                    name="username"
                                    control={control}
                                    label="Username"
                                    style={{ marginBottom: 25, marginTop: 15 }}
                                />
                                <TextFormInput
                                    name="password"
                                    control={control}
                                    label="Password"
                                    type="password"
                                />
                            </Stack>
                        </CardContent>
                        <Box sx={{ height: 80 }}>
                            <Stack
                                sx={{ m: 1 }}
                                direction="row"
                                justifyContent="center"
                            >
                                {processing ? (
                                    <CircularProgress color="success" />
                                ) : (
                                    credential.error && (
                                        <Box
                                            sx={{
                                                p: 1,
                                                borderRadius: 2,
                                                backgroundColor: '#fcdada',
                                            }}
                                        >
                                            <Typography
                                                style={{
                                                    textAlign: 'center',
                                                    color: '#7c2323',
                                                }}
                                            >
                                                {credential.error}
                                            </Typography>
                                        </Box>
                                    )
                                )}
                            </Stack>
                        </Box>
                        <Box sx={{ mb: 3 }}>
                            <Stack direction="row" justifyContent="center">
                                <Button
                                    variant="contained"
                                    color="success"
                                    onClick={() => {
                                        handleSubmit((data) =>
                                            dispatch(tryLogin(data))
                                        )();
                                    }}
                                >
                                    {' '}
                                    Submit{' '}
                                </Button>
                            </Stack>
                        </Box>
                    </Card>
                </Box>
            </div>
        </Stack>
    );
};

export default LoginPage;
