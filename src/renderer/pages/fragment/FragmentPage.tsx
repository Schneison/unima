import {
    FC,
    ReactElement,
    useEffect,
    useMemo,
    useState,
    MouseEvent,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
    AppBar,
    Box,
    Divider,
    Fab,
    Fade,
    IconButton,
    Paper,
    Stack,
    styled,
    Toolbar,
    Tooltip,
    Typography,
    useScrollTrigger,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import BackIcon from '@mui/icons-material/ArrowBack';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import EditIcon from '@mui/icons-material/Edit';
import EditOffIcon from '@mui/icons-material/EditOff';
import { NavigateFunction } from 'react-router/dist/lib/hooks';
import {
    requestFragment,
    selectFragment,
} from '../../state/reducers/fragmentReducer';
import { useAppSelector } from '../../state/hooks';
import { ModuleContainer } from '../../state/reducers/moduleReducer';
import FragmentCard from './FragmentCard';
import FragmentDrawer from './FragmentDrawer';

interface SectionProps {
    member: PlainMember;
    optionsVisible: boolean;
    index: number;
}

const SectionView: FC<SectionProps> = ({ member, index, optionsVisible }) => {
    return (
        <Paper
            sx={{
                borderColor: 'grey.500',
                borderRadius: 2,
                borderWidth: 2,
                backgroundColor: '#f5f5f533',
                m: 1,
                my: 3,
                p: 1,
                borderStyle: 'dashed',
                elevation: 5,
            }}
            id={`section-${index}`}
        >
            <Typography variant="body1" sx={{ mx: 1, fontWeight: 500 }}>
                {member.title}
            </Typography>
            <Stack direction="row" flexWrap="wrap">
                {...member.children
                    .map((m) => m as PlainMember)
                    .map((child: PlainMember) => (
                        <FragmentCard
                            member={child as LeafMember}
                            optionsVisible={optionsVisible}
                        />
                    ))}
            </Stack>
        </Paper>
    );
};

interface Props {
    children: ReactElement;
}

function ScrollTop(props: Props) {
    const { children } = props;
    const trigger = useScrollTrigger({
        disableHysteresis: true,
        threshold: 100,
    });

    const handleClick = (event: MouseEvent<HTMLDivElement>) => {
        const anchor = (
            (event.target as HTMLDivElement).ownerDocument || document
        ).querySelector('#back-to-top-anchor');

        if (anchor) {
            anchor.scrollIntoView({
                block: 'center',
            });
        }
    };

    return (
        <Fade in={trigger}>
            <Box
                onClick={handleClick}
                role="presentation"
                sx={{ position: 'fixed', bottom: 16, right: 16 }}
            >
                {children}
            </Box>
        </Fade>
    );
}

const MenuButton: FC<{ onClick: () => void }> = ({ onClick }) => {
    return (
        <Tooltip title="Menu">
            <IconButton
                edge="start"
                color="inherit"
                aria-label="menu"
                sx={{ mr: 1 }}
                onClick={onClick}
            >
                <MenuIcon />
            </IconButton>
        </Tooltip>
    );
};

const BackButton = () => {
    const navigate: NavigateFunction = useNavigate();

    return (
        <Tooltip title="Back">
            <IconButton
                onClick={() => navigate(-1)}
                edge="start"
                color="inherit"
                aria-label="back"
                sx={{ mr: 1, ml: 1 }}
            >
                <BackIcon />
            </IconButton>
        </Tooltip>
    );
};

interface EditButtonProps {
    optionsVisible: boolean;
    onClick: () => void;
}

const EditButton: FC<EditButtonProps> = ({ optionsVisible, onClick }) => {
    return (
        <Tooltip title={optionsVisible ? 'Stop Edit' : 'Start Edit'}>
            <IconButton
                edge="start"
                color="inherit"
                sx={{ mr: 1, ml: 1 }}
                onClick={onClick}
            >
                {optionsVisible ? <EditOffIcon /> : <EditIcon />}
            </IconButton>
        </Tooltip>
    );
};

const drawerWidth = 240;

const Main = styled('div', { shouldForwardProp: (prop) => prop !== 'open' })<{
    open?: boolean;
}>(({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    ...(open && {
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
        marginLeft: 0,
    }),
}));

const Page: FC = () => {
    const dispatch = useDispatch();
    const { moduleId } = useParams<{ moduleId: string }>();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const paramId: string = moduleId!;
    const modules: ModuleContainer = useAppSelector(
        (state) => state.modules.modules
    );
    const [optionsVisible, setOptionsVisible] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const module = useMemo(() => modules[paramId], [modules, paramId]);
    const fragment = useSelector(selectFragment);
    useEffect(() => {
        dispatch(requestFragment(paramId));
    }, [dispatch, paramId]);
    const sections = fragment?.children?.map((member, index) => (
        <SectionView
            member={member as PlainMember}
            optionsVisible={optionsVisible}
            index={index}
        />
    )) ?? [<Typography>Missing</Typography>];
    return (
        <>
            <AppBar
                position="fixed"
                sx={{
                    backgroundColor: module.color,
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                }}
            >
                <Toolbar variant="dense">
                    <MenuButton onClick={() => setDrawerOpen(!drawerOpen)} />
                    <Divider orientation="vertical" flexItem />
                    <BackButton />
                    <Divider orientation="vertical" flexItem />
                    <Typography
                        variant="h6"
                        color="inherit"
                        noWrap
                        component="div"
                        sx={{ ml: 1, flex: 1 }}
                    >
                        {module.title}
                    </Typography>
                    <EditButton
                        optionsVisible={optionsVisible}
                        onClick={() => setOptionsVisible(!optionsVisible)}
                    />
                </Toolbar>
            </AppBar>
            <FragmentDrawer
                members={fragment?.children?.map((m) => m as PlainMember) ?? []}
                open={drawerOpen}
                width={drawerWidth}
            />
            <Main open={drawerOpen}>
                <div id="back-to-top-anchor" />
                <Box sx={{ mt: 6 }}>{...sections}</Box>
            </Main>
            <ScrollTop>
                <Fab size="small" aria-label="scroll back to top">
                    <KeyboardArrowUpIcon />
                </Fab>
            </ScrollTop>
        </>
    );
};

export default Page;
