import React, { createRef, PropsWithChildren, useEffect, useMemo } from 'react';
import {
    CircularProgress,
    Dialog,
    Divider,
    Drawer,
    Toolbar,
    Tab,
    Tabs,
    Button,
    StepButton,
    Step,
    Stepper,
    Box,
    ButtonGroup,
} from '@mui/material';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import { useDispatch } from 'react-redux';
import { UseFormReturn } from 'react-hook-form';
import deepEqual from 'deep-equal';
import { UseFormSetValue } from 'react-hook-form/dist/types/form';
import { useAppSelector } from '../../state/hooks';
import {
    cacheModel,
    fetchDetected,
    selectModuleCache,
    selectModules,
    selectVesselCache,
    selectVessels,
    startProcess,
} from '../../state/reducers/detectedReducer';
import { useVesselForm, VesselForm } from '../vessel/VesselEditModal';
import { handleAddSubmit } from '../../FormCommon';
import { ModuleForm, useModuleForm } from '../module/ModuleEditModal';

interface BaseModel {
    id: number;
    title: string;
}

type ApplyModel<Model extends BaseModel> = (
    model: Model,
    setValue: UseFormSetValue<any>,
    detectedVessels: Record<string, DetectedVessel>
) => void;
type TitleModel<Model extends BaseModel> = (model: Model) => string;

interface StepperProps<Model extends BaseModel> {
    models: Model[];
    methods: UseFormReturn<any>;
    applyModel: ApplyModel<Model>;
    titleModel: TitleModel<Model>;
    repository: Repository;
    height: number;
}

function StepperDrawer<Model extends BaseModel>({
    models,
    children,
    methods,
    applyModel,
    titleModel,
    height,
    repository,
}: PropsWithChildren<StepperProps<Model>>) {
    const dispatch = useDispatch();
    const [stepRefs, setStepRefs] = React.useState(
        [] as React.RefObject<HTMLDivElement>[]
    );
    const [activeStep, setActiveStep] = React.useState(0);
    const [completed, setCompleted] = React.useState<{
        [k: number]: boolean;
    }>({});
    const { setValue, reset, watch } = methods;
    useEffect(() => {
        setStepRefs((elRefs) =>
            Array(models.length)
                .fill(null)
                .map((_, i) => elRefs[i] || createRef())
        );
    }, [models.length]);

    useEffect(() => {
        const ref = stepRefs[activeStep];
        if (ref && ref.current) {
            ref.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'center',
            });
        }
    }, [stepRefs, activeStep]);
    const cache = useAppSelector(
        repository === 'modules' ? selectModuleCache : selectVesselCache
    );
    const detectedVessels = useAppSelector(selectVessels);
    useEffect(() => {
        const model = models[activeStep];
        if (!model) {
            return;
        }
        const cached: Record<string, any> = cache[model.id];
        reset();
        console.log('cache', cached);
        if (cached) {
            Object.keys(cached).forEach((key) => {
                setValue(key, cached[key]);
            });
        } else {
            applyModel(model, setValue, detectedVessels);
        }
    }, [
        activeStep,
        reset,
        setValue,
        models,
        applyModel,
        cache,
        detectedVessels,
    ]);

    useEffect(() => {
        const subscription = watch((data) => {
            const oldData = cache[models[activeStep].id];
            if (!deepEqual(oldData, data)) {
                dispatch(
                    cacheModel({
                        repository,
                        model: data,
                        cacheId: `${models[activeStep].id}`,
                    })
                );
            }
        });
        return () => subscription.unsubscribe();
    }, [watch, dispatch, repository, activeStep, models, cache]);

    const totalSteps = () => {
        return models.length;
    };

    const completedSteps = () => {
        return Object.keys(completed).length;
    };

    const isLastStep = () => {
        return activeStep === totalSteps() - 1;
    };

    const allStepsCompleted = () => {
        return completedSteps() === totalSteps();
    };

    const handleNext = () => {
        const newActiveStep =
            isLastStep() && !allStepsCompleted()
                ? // It's the last step, but not all steps have been completed,
                  // find the first step that has been completed
                  models.findIndex((_step, i) => !(i in completed))
                : activeStep + 1;
        setActiveStep(newActiveStep);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleStep = (step: number) => () => {
        setActiveStep(step);
    };

    const handleComplete = () => {
        const { handleSubmit } = methods;
        handleSubmit(
            (data) => {
                if (repository === 'vessels') {
                    dispatch(
                        startProcess([
                            models[activeStep] as unknown as DetectedVessel,
                            data as ModuleVessel,
                        ])
                    );
                }
                handleAddSubmit(
                    dispatch,
                    completed[activeStep] ? 'create' : 'edit',
                    repository,
                    data
                );
            },
            (errors) => {
                console.log('submit-errors', errors);
            }
        )();
        const newCompleted = completed;
        newCompleted[activeStep] = true;
        setCompleted(newCompleted);
        handleNext();
    };

    // const handleReset = () => {
    //     setActiveStep(0);
    //     setCompleted({});
    // };

    const drawerWidth = 270;
    return (
        <Box
            sx={{
                display: 'flex',
                height: '100%',
                alignContent: 'center',
                justifyContent: 'center',
                p: 0,
            }}
        >
            <Box
                component="main"
                sx={{
                    flexDirection: 'column',
                    display: 'flex',
                    flex: 1,
                    bgcolor: 'background.default',
                    height,
                    alignContent: 'stretch',
                    justifyContent: 'stretch',
                }}
            >
                <Box
                    sx={{
                        flex: 1,
                        p: 0,
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    {children}
                </Box>
                <Box sx={{}}>
                    <Divider />
                    <Toolbar sx={{ pt: 2 }}>
                        <div>
                            <ButtonGroup
                                aria-label="small button group"
                                sx={{
                                    display: 'flex',
                                    alignContent: 'stretch',
                                }}
                            >
                                <Button
                                    disabled={activeStep === 0}
                                    onClick={handleBack}
                                    sx={{
                                        flex: 1,
                                    }}
                                >
                                    Back
                                </Button>
                                <Button
                                    color="success"
                                    onClick={handleComplete}
                                    sx={{
                                        flex: 2,
                                    }}
                                >
                                    {completed[activeStep] ? 'Update' : 'Add'}
                                </Button>
                                <Button
                                    disabled={isLastStep()}
                                    onClick={handleNext}
                                    sx={{
                                        flex: 1,
                                    }}
                                >
                                    Next
                                </Button>
                            </ButtonGroup>
                            {/* {allStepsCompleted() ? ( */}
                            {/*    <> */}
                            {/*        <Typography sx={{ mt: 2, mb: 1 }}> */}
                            {/*            All steps completed - you&apos;re */}
                            {/*            finished */}
                            {/*        </Typography> */}
                            {/*        <Box */}
                            {/*            sx={{ */}
                            {/*                display: 'flex', */}
                            {/*                flexDirection: 'row', */}
                            {/*                pt: 2, */}
                            {/*            }} */}
                            {/*        > */}
                            {/*            <Box sx={{ flex: '1 1 auto' }} /> */}
                            {/*            <Button onClick={handleReset}> */}
                            {/*                Reset */}
                            {/*            </Button> */}
                            {/*        </Box> */}
                            {/*    </> */}
                            {/* ) : ( */}
                            {/*    <> */}
                            {/*        <Typography sx={{ mt: 2, mb: 1 }}> */}
                            {/*            Step {activeStep + 1} */}
                            {/*        </Typography> */}
                            {/*        <Box */}
                            {/*            sx={{ */}
                            {/*                display: 'flex', */}
                            {/*                flexDirection: 'row', */}
                            {/*                pt: 2, */}
                            {/*            }} */}
                            {/*        > */}
                            {/*            <Button */}
                            {/*                color="inherit" */}
                            {/*                disabled={activeStep === 0} */}
                            {/*                onClick={handleBack} */}
                            {/*                sx={{ mr: 1 }} */}
                            {/*            > */}
                            {/*                Back */}
                            {/*            </Button> */}
                            {/*            <Box sx={{ flex: '1 1 auto' }} /> */}
                            {/*            <Button */}
                            {/*                onClick={handleNext} */}
                            {/*                sx={{ mr: 1 }} */}
                            {/*            > */}
                            {/*                Next */}
                            {/*            </Button> */}
                            {/*            {activeStep !== models.length && */}
                            {/*                (completed[activeStep] ? ( */}
                            {/*                    <Typography */}
                            {/*                        variant="caption" */}
                            {/*                        sx={{ */}
                            {/*                            display: 'inline-block', */}
                            {/*                        }} */}
                            {/*                    > */}
                            {/*                        Step {activeStep + 1}{' '} */}
                            {/*                        already completed */}
                            {/*                    </Typography> */}
                            {/*                ) : ( */}
                            {/*                    <Button */}
                            {/*                        onClick={handleComplete} */}
                            {/*                    > */}
                            {/*                        {completedSteps() === */}
                            {/*                        totalSteps() - 1 */}
                            {/*                            ? 'Finish' */}
                            {/*                            : 'Complete Step'} */}
                            {/*                    </Button> */}
                            {/*                ))} */}
                            {/*        </Box> */}
                            {/*    </> */}
                            {/* )} */}
                        </div>
                    </Toolbar>
                </Box>
            </Box>
            <Drawer
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                    },
                }}
                PaperProps={{
                    style: {
                        paddingLeft: 14,
                        position: 'absolute',
                    },
                }}
                variant="permanent"
                anchor="right"
            >
                <Box
                    sx={{
                        overflowX: 'auto',
                        paddingTop: 6,
                        paddingRight: 6,
                        paddingBottom: 6,
                    }}
                >
                    <Box>
                        <Stepper
                            nonLinear
                            activeStep={activeStep}
                            orientation="vertical"
                        >
                            {models.map((model, index) => (
                                <Step
                                    key={titleModel(model)}
                                    completed={completed[index]}
                                    ref={stepRefs[index]}
                                >
                                    <StepButton
                                        color="inherit"
                                        onClick={handleStep(index)}
                                        style={{ justifyContent: 'start' }}
                                    >
                                        {titleModel(model)}
                                    </StepButton>
                                </Step>
                            ))}
                        </Stepper>
                    </Box>
                </Box>
            </Drawer>
        </Box>
    );
}

interface TabPanelProps extends PropsWithChildren {
    index: number;
    value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
};

const applyModule: ApplyModel<DetectedModule> = (
    model,
    setValue,
    detectedVessels
) => {
    const { title, url, vesselId, sectionTitles, moduleInternal } = model;
    setValue('title', title);
    setValue('url', url);
    setValue('sectionTitles', sectionTitles);
    setValue('internalId', moduleInternal);
    const vessel = detectedVessels[vesselId];
    if (!vessel || !vessel.instanceId) {
        return;
    }
    setValue('vessel', vessel.instanceId);
};
const applyVessel: ApplyModel<DetectedVessel> = (model, setValue) => {
    setValue('title', model.title);
};

const VesselTab: React.FC = () => {
    const detectedVessels = useAppSelector(selectVessels);
    const vessels = useMemo(
        () => Object.values(detectedVessels) as DetectedVessel[],
        [detectedVessels]
    );
    const formVessel = useVesselForm();
    return (
        <StepperDrawer
            models={vessels}
            methods={formVessel}
            applyModel={applyVessel}
            titleModel={(model: DetectedVessel) => model.title}
            height={340}
            repository="vessels"
        >
            <VesselForm
                mode="create"
                methods={formVessel}
                handleClose={() => null}
                includeAdd={false}
            />
        </StepperDrawer>
    );
};

const ModuleTab: React.FC = () => {
    const detectedModules = useAppSelector(selectModules);
    const formModule = useModuleForm();
    const modules = useMemo(
        () => Object.values(detectedModules) as DetectedModule[],
        [detectedModules]
    );
    return (
        <StepperDrawer
            models={modules}
            methods={formModule}
            applyModel={applyModule}
            titleModel={(module: DetectedModule) => module.title}
            height={500}
            repository="modules"
        >
            <ModuleForm
                mode="create"
                methods={formModule}
                handleClose={() => null}
                includeAdd={false}
            />
        </StepperDrawer>
    );
};

const DetectModal: React.FC<{
    tab: number;
    handleChange: (_event: React.SyntheticEvent, newValue: number) => void;
}> = ({ tab, handleChange }) => {
    const dispatch = useDispatch();
    const needsLoading = useAppSelector(
        (state) => state.detected.status === 'idle'
    );
    const loading: boolean = useAppSelector(
        (state) => state.detected.status === 'loading'
    );
    useEffect(() => {
        if (needsLoading) {
            dispatch(fetchDetected());
        }
    }, [dispatch, needsLoading]);
    return (
        <Box sx={{ height: '100%' }}>
            <Box
                sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    display: 'flex',
                }}
            >
                <Tabs
                    value={tab}
                    onChange={handleChange}
                    aria-label="basic tabs"
                    style={{ width: 600 - 270 }}
                >
                    <Tab
                        label="Vessels"
                        id="simple-tab-0"
                        aria-controls="simple-tabpanel-0"
                        style={{ flex: 1 }}
                    />
                    <Tab
                        label="Modules"
                        id="simple-tab-1"
                        aria-controls="simple-tabpanel-1"
                        style={{ flex: 1 }}
                    />
                </Tabs>
            </Box>
            <TabPanel value={tab} index={0}>
                {loading ? <CircularProgress /> : <VesselTab />}
            </TabPanel>
            <TabPanel value={tab} index={1}>
                {loading ? <CircularProgress /> : <ModuleTab />}
            </TabPanel>
        </Box>
    );
};

const DetectButton: React.FC = () => {
    const [open, setOpen] = React.useState(false);
    const [tab, setTab] = React.useState(0);

    return (
        <div>
            <Button
                variant="contained"
                onClick={() => setOpen(true)}
                startIcon={<CloudSyncIcon />}
            >
                Add Moodle Course
            </Button>
            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
                PaperProps={{
                    style: {
                        minWidth: 600,
                        minHeight: 400,
                    },
                }}
            >
                <DetectModal
                    tab={tab}
                    handleChange={(_event, value: number) => setTab(value)}
                />
            </Dialog>
        </div>
    );
};

export default DetectButton;
