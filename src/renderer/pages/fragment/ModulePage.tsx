import { useNavigate, useParams } from 'react-router-dom';
import React, { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import TreeView from '@mui/lab/TreeView';
import TreeItem from '@mui/lab/TreeItem';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Card,
    Divider,
    IconButton,
    Typography,
    CardActions,
    CardContent,
    CardHeader,
    CircularProgress,
    Container,
    List,
    Stack,
    ButtonGroup,
    Modal,
    Chip,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DeleteIcon from '@mui/icons-material/Delete';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import DownloadIcon from '@mui/icons-material/Download';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import OpenInBrowserIcon from '@mui/icons-material/OpenInBrowser';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ThumbsUpDownIcon from '@mui/icons-material/ThumbsUpDown';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import DriveFolderUploadIcon from '@mui/icons-material/DriveFolderUpload';
import SyncIcon from '@mui/icons-material/Sync';
import '../../App.css';
import { NavigateFunction } from 'react-router/dist/lib/hooks';
import {
    hide,
    requestSource,
    selectItems,
    show,
} from '../../state/reducers/sourceReducer';
import { useAppSelector } from '../../state/hooks';
import {
    checkExistence,
    requestResources,
} from '../../state/reducers/resourceReducer';
import { ModuleContainer } from '../../state/reducers/moduleReducer';
import MessageBroker from '../../bridge/MessageBroker';
import { modalStyle } from '../../FormCommon';
import {
    requestStructure,
    selectRoot,
} from '../../state/reducers/structureReducer';
import { FacadeEntry, FacadeFolder } from './Styles';

enum ResourceAction {
    DOWNLOAD_OR_OPEN,
    OPEN_LINK,
    OPEN_LINK_WINDOW,
}

interface ActionDescription {
    type: LinkType;
    defaultAction?: ResourceAction;
    resource?: ResourceInfo;
    source: Source;
}

function getDefaultAction(resource: ResourceType): ResourceAction {
    switch (resource) {
        case 'application/zip':
        case 'application/pdf':
        case 'text/plain':
            return ResourceAction.DOWNLOAD_OR_OPEN;
        case 'video/mpeg':
        case 'unknown':
        default:
            return ResourceAction.OPEN_LINK;
    }
}

const ResourceIcon: React.FC<{ resource: ResourceType }> = ({ resource }) => {
    switch (resource) {
        case 'application/zip':
            return <FolderZipIcon fontSize="small" />;
        case 'application/pdf':
            return <PictureAsPdfIcon fontSize="small" />;
        case 'text/plain':
            return <TextSnippetIcon fontSize="small" />;
        case 'video/mp4':
        case 'video/mpeg':
            return <VideoFileIcon fontSize="small" />;
        case 'unknown':
        default:
            return null;
    }
};

const ItemActionIcon: React.FC<{
    desc: ActionDescription;
}> = ({ desc }) => {
    const { source, resource } = desc;
    switch (desc.type) {
        case 'resource':
            if (!resource) {
                console.log(`Failed to find resource for ${source.id}.`);
                return null;
            }
            switch (desc.defaultAction) {
                case ResourceAction.DOWNLOAD_OR_OPEN:
                    if (!resource.downloaded) {
                        return <DownloadIcon fontSize="small" />;
                    }
                    return <FileOpenIcon fontSize="small" />;
                case ResourceAction.OPEN_LINK:
                    return <OpenInBrowserIcon fontSize="small" />;
                default:
                    return null;
            }
        case 'assign':
            return <DriveFolderUploadIcon fontSize="small" />;
        case 'quizzes':
            return <FactCheckIcon fontSize="small" />;
        case 'choice':
            return <ThumbsUpDownIcon fontSize="small" />;
        default:
            return null;
    }
};

const SectionItem: React.FC<{
    source: Source;
    index: number;
    edit: boolean;
    siblingsCount: number;
}> = ({ source, index, edit, siblingsCount }) => {
    // const action = getDefaultAction(source);
    const resource: ResourceInfo = useAppSelector(
        (state) => state.resources.cache[source.id]
    );
    const description: ActionDescription = useMemo(() => {
        return {
            type: source.type,
            defaultAction:
                resource != null
                    ? getDefaultAction(resource.type as ResourceType)
                    : undefined,
            source,
            resource,
        };
    }, [source, resource]);
    const dispatch = useDispatch();
    let resourceIcon = <div />;
    let resourceAction = null;
    const action = <ItemActionIcon desc={description} />;
    const onAction = () => {
        if (!resource) {
            return;
        }
        switch (description.defaultAction) {
            case ResourceAction.DOWNLOAD_OR_OPEN:
                if (!resource.downloaded || !resource.location) {
                    MessageBroker.requestDownload(source.id, true);
                    // dispatch(checkExistence(source.id.toString(), true));
                    break;
                }
                MessageBroker.openFile(resource.location);
                // window.electron.ipcRenderer.openFile(resource.location);
                break;
            case ResourceAction.OPEN_LINK:
                break;
            default:
                break;
        }
    };
    let editView = null;
    if (source.type === 'resource') {
        if (!resource) {
            console.log(`Failed to find resource for ${source.id}.`);
        } else {
            resourceIcon = (
                <ResourceIcon resource={resource.type as ResourceType} />
            );
        }
        resourceAction = <DeleteIcon fontSize="small" />;
    }
    if (edit) {
        const visibility = !source.visible ? (
            <VisibilityIcon fontSize="small" />
        ) : (
            <VisibilityOffIcon fontSize="small" />
        );
        editView = (
            <Stack direction="row" style={{ width: 'min-content' }}>
                <Divider
                    orientation="vertical"
                    style={{ height: '40px', marginRight: 15 }}
                />
                <IconButton
                    onClick={() =>
                        !source.visible
                            ? dispatch(
                                  show({
                                      sourceId: source.id,
                                  })
                              )
                            : dispatch(
                                  hide({
                                      sourceId: source.id,
                                  })
                              )
                    }
                    edge="start"
                >
                    {visibility}
                </IconButton>
            </Stack>
        );
    }
    const secondary = (
        <Stack
            direction="row"
            spacing={1}
            justifyContent="center"
            alignItems="center"
        >
            {resourceIcon}
            {resourceAction && (
                <IconButton edge="start">{resourceAction}</IconButton>
            )}
        </Stack>
    );
    return (
        <FacadeEntry
            dense
            isEven={index % 2 === 0}
            isFirst={index === 0}
            isLast={index === siblingsCount}
        >
            <Stack direction="row" flex="1">
                {action && (
                    <IconButton edge="start" onClick={onAction}>
                        {action}
                    </IconButton>
                )}
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    alignSelf="stretch"
                    flex="1"
                >
                    <Typography style={{ flex: '1' }} variant="body2">
                        {source.title}
                    </Typography>
                    <div style={{ width: 'min-content' }}>{secondary}</div>
                    {editView ?? editView}
                </Stack>
            </Stack>
        </FacadeEntry>
    );
};

let createItemViews: (
    children: ChildItem[],
    module: Module,
    edit: boolean
) => React.ReactElement[];

const SectionFolder: React.FC<{
    item: DisplayItem;
    edit: boolean;
    module: Module;
    index: number;
    siblingsCount: number;
}> = ({ item, edit, module, index, siblingsCount }) => {
    // // Flatten folders with just one child, they need to much room
    // if (item.children.length === 1) {
    //     return (
    //         <SectionItem
    //             source={
    //                 'section' in item.children[0]
    //                     ? item.children[0]
    //                     : item.children[0].source
    //             }
    //             index={index}
    //             edit={edit}
    //             siblingsCount={siblingsCount}
    //         />
    //     );
    // }
    const items = createItemViews(item.children, module, edit);
    return (
        <FacadeFolder
            isEven={index % 2 === 0}
            isFirst={index === 0}
            isLast={index === siblingsCount}
            elevation={0}
        >
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1a-content"
                id="panel1a-header"
                sx={{
                    minHeight: 48,
                    pl: 5,
                    '&content': {
                        margin: 'auto',
                        '&expanded': {
                            margin: 'auto',
                        },
                    },
                }}
            >
                <Typography variant="body2">
                    {item.source.title ?? ''}
                </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 1, py: 0 }}>
                <List dense style={{}}>
                    {items}
                </List>
            </AccordionDetails>
        </FacadeFolder>
    );
};

createItemViews = (children: ChildItem[], module: Module, edit: boolean) => {
    return children.map((item, index) => {
        if ('section' in item) {
            return (
                <div
                    key={item.url}
                    style={{ flex: 1, display: 'flex', minHeight: 48 }}
                >
                    {(item.visible || edit) && (
                        <>
                            <SectionItem
                                source={item}
                                index={index}
                                edit={edit}
                                siblingsCount={children.length - 1}
                            />
                            {index < children.length - 1 && <Divider />}
                        </>
                    )}
                </div>
            );
        }
        return (
            <div key={item.source.url} style={{ flex: 1, minHeight: 48 }}>
                <SectionFolder
                    item={item}
                    edit={edit}
                    module={module}
                    index={index}
                    siblingsCount={children.length - 1}
                />
                {index < children.length - 1 && <Divider />}
            </div>
        );
    });
};

const ModuleSection: React.FC<{
    item: SectionItem;
    module: Module;
    edit: boolean;
    index: number;
}> = ({ item, module, edit, index }) => {
    const dispatch = useDispatch();
    const titleSource = module.sectionTitles?.[index];
    const items = createItemViews(item.children, module, edit);
    const onExistence = async () => {
        await Promise.all(
            item.children.map((source) =>
                'section' in source
                    ? dispatch(checkExistence(source.id, true))
                    : undefined
            )
        );
    };
    return (
        <Accordion
            sx={{
                root: {
                    minHeight: 48,
                },
            }}
        >
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1a-content"
                id="panel1a-header"
                sx={{
                    margin: 'auto',
                    '&expanded': {
                        margin: 'auto',
                    },
                }}
            >
                <Typography variant="subtitle1" style={{ fontWeight: 'bold' }}>
                    {titleSource?.title ?? ''}
                </Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Box sx={{ p: 1 }}>
                    <ButtonGroup>
                        <IconButton onClick={onExistence}>
                            <SyncIcon />
                        </IconButton>
                    </ButtonGroup>
                </Box>
                <List dense>{items}</List>
            </AccordionDetails>
        </Accordion>
    );
};

const createStructureItems = (member: PlainMember, module: Module) => {
    let children: JSX.Element[] = [];
    if (member.children) {
        children = member.children.map((item) =>
            createStructureItems(item as PlainMember, module)
        );
    }
    return (
        <TreeItem
            key={member.title}
            nodeId={member.title}
            sx={{ maxWidth: 400 }}
            label={
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: 0.5,
                        pr: 0,
                    }}
                >
                    <Typography sx={{ fontWeight: 'inherit', flexGrow: 1 }}>
                        {member.title}
                    </Typography>
                    {'details' in member && (
                        <Stack direction="row">
                            {Object.entries(
                                (
                                    (member as LeafMember)
                                        .details as DetailStructure
                                ).tags
                            ).map((keyValuePair) => (
                                <Chip
                                    size="small"
                                    variant="outlined"
                                    color="success"
                                    key={keyValuePair.toString()}
                                    label={`${keyValuePair[0]}: ${keyValuePair[1]}`}
                                />
                            ))}
                        </Stack>
                    )}
                </Box>
            }
        >
            {...children}
        </TreeItem>
    );
};

const StructureTest: React.FC<{
    module: Module;
}> = ({ module }) => {
    // const items = createStructureItems(item.children, module, edit);
    const rootMember = useSelector(selectRoot);
    return (
        <Box>
            <Typography
                id="modal-modal-title"
                variant="h6"
                component="h2"
                style={{ marginBottom: 10 }}
            >
                Structure Test
            </Typography>
            <div
                style={{
                    backgroundColor: '#E8E8E8',
                    borderRadius: 5,
                    paddingLeft: 10,
                    paddingRight: 10,
                }}
            >
                <TreeView
                    aria-label="file system navigator"
                    defaultCollapseIcon={<ExpandMoreIcon />}
                    defaultExpandIcon={<ChevronRightIcon />}
                    defaultExpanded={['.']}
                    sx={{
                        height: 335,
                        flexGrow: 1,
                        overflowY: 'auto',
                        overflow: 'hide',
                    }}
                >
                    {createStructureItems(rootMember, module)}
                </TreeView>
            </div>
        </Box>
    );
};

export const StructureButton: React.FC<
    {
        module: Module;
    } & PropsWithChildren
> = ({ children, module }) => {
    const [open, setOpen] = React.useState(false);
    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };
    return (
        <div>
            <Button variant="contained" onClick={handleClickOpen}>
                {children}
            </Button>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box
                    sx={{
                        ...modalStyle,

                        width: 450,
                    }}
                >
                    <StructureTest module={module} />
                </Box>
            </Modal>
        </div>
    );
};

const ModuleOverview: React.FC<{
    module: Module;
    clickEdit: () => void;
}> = ({ clickEdit, module }) => {
    const navigate: NavigateFunction = useNavigate();
    return (
        <Card
            style={{
                marginLeft: 24,
                marginRight: 24,
                marginBottom: 36,
            }}
        >
            <CardHeader title={module.title} subheader="Sources" />
            <CardContent>
                <Typography style={{ fontSize: 14 }} gutterBottom>
                    Word of the Day
                </Typography>
            </CardContent>
            <CardActions>
                <Stack
                    direction="row"
                    spacing={2}
                    alignContent="center"
                    justifyContent="space-between"
                    width="100%"
                >
                    <Stack
                        direction="row"
                        spacing={2}
                        alignContent="center"
                        justifyContent="center"
                    >
                        <Button
                            onClick={() => navigate(-1)}
                            variant="contained"
                        >
                            Back
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() =>
                                window.electron.ipcRenderer.openBrowser(
                                    'https://moodle.uni-kassel.de/'
                                )
                            }
                        >
                            Open Moodle
                        </Button>
                        <StructureButton module={module}>
                            Structure
                        </StructureButton>
                    </Stack>
                    <Stack
                        direction="row"
                        spacing={2}
                        alignContent="center"
                        justifyContent="center"
                    >
                        <Button onClick={clickEdit} variant="contained">
                            Edit
                        </Button>
                    </Stack>
                </Stack>
            </CardActions>
        </Card>
    );
};

const ModulePage: React.FC = () => {
    const dispatch = useDispatch();
    const { moduleId } = useParams<{ moduleId: string }>();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const paramId: string = moduleId!;
    const modules: ModuleContainer = useAppSelector(
        (state) => state.modules.modules
    );
    const module = useMemo(() => modules[paramId], [modules, paramId]);
    const activeItems = useSelector(selectItems);
    const loadingSources = useAppSelector(
        (state) => state.sources.status === 'succeeded'
    );
    const loadingResources = useAppSelector(
        (state) => state.resources.fetchStatus === 'succeeded'
    );
    useEffect(() => {
        dispatch(requestSource(paramId));
        dispatch(requestResources(paramId));
        dispatch(requestStructure(paramId));
    }, [dispatch, paramId]);
    const [edit, setEdit] = useState(false);
    const sectionItems = Object.values(activeItems).map((sectionItem) => {
        // if (!(edit || sourceList.some((value) => value.visible))) {
        //     return <div key={sectionItem.index} />;
        // }
        return (
            <ModuleSection
                key={sectionItem.index}
                item={sectionItem}
                module={module}
                edit={edit}
                index={sectionItem.index}
            />
        );
    });
    const mainContent =
        !loadingSources || !loadingResources ? (
            <Box sx={{ display: 'flex' }}>
                <CircularProgress />
            </Box>
        ) : (
            <Container>{sectionItems}</Container>
        );
    return (
        <div style={{ marginTop: '30px' }}>
            <ModuleOverview module={module} clickEdit={() => setEdit(!edit)} />
            {mainContent}
        </div>
    );
};

export default ModulePage;
