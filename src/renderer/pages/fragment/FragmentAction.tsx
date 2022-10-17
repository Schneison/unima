import { FC } from 'react';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import DriveFolderUploadIcon from '@mui/icons-material/DriveFolderUpload';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import ThumbsUpDownIcon from '@mui/icons-material/ThumbsUpDown';
import { Box, CardActionArea, Stack, Tooltip, Typography } from '@mui/material';
import { useDispatch } from 'react-redux';
import { fragmentAction } from '../../state/reducers/fragmentReducer';

const ResourceIcon: FC<{ type: ResourceType | undefined }> = ({ type }) => {
    switch (type) {
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
            return <></>;
    }
};

const getResourceName = (type: ResourceType): string => {
    switch (type) {
        case 'application/zip':
            return 'Zip';
        case 'application/pdf':
            return 'PDF';
        case 'text/plain':
            return 'Text';
        case 'video/mp4':
        case 'video/mpeg':
            return 'Video';
        case 'unknown':
        default:
            return 'Unknown';
    }
};

interface ActionIconProps {
    type: LinkType;
    resource: DetailsResource | undefined;
}

const ActionIcon: FC<ActionIconProps> = ({ type, resource }) => {
    switch (type) {
        case 'resource':
            return <ResourceIcon type={resource?.fileType as ResourceType} />;
        case 'assign':
            return <DriveFolderUploadIcon fontSize="small" />;
        case 'quizzes':
            return <FactCheckIcon fontSize="small" />;
        case 'choice':
            return <ThumbsUpDownIcon fontSize="small" />;
        default:
            return <></>;
    }
};

const getActionTitle = (mainAction: MainAction) => {
    switch (mainAction) {
        case 'file_open':
        case 'link_open':
            return 'Open';
        case 'file_download':
            return 'Download';
        default:
            return 'Missing';
    }
};

interface ActionProps {
    resource: DetailsResource;
    type: string;
    sourceId: number;
    mainAction: MainAction;
}

const FragmentActions: FC<ActionProps> = ({
    resource,
    type,
    sourceId,
    mainAction,
}) => {
    const dispatch = useDispatch();
    return (
        <CardActionArea
            style={{
                backgroundColor: resource?.downloaded
                    ? 'lightgreen'
                    : 'lightcyan',
            }}
            sx={{
                px: 1.5,
                py: 1,
            }}
            onClick={() => {
                dispatch(fragmentAction({ sourceId, action: mainAction }));
            }}
        >
            <Stack
                direction="row"
                alignItems="center"
                justifyItems="center"
                sx={{ flex: 1 }}
            >
                <Tooltip
                    title={getResourceName(resource.fileType as ResourceType)}
                >
                    <Box>
                        <ActionIcon
                            type={type as LinkType}
                            resource={resource}
                        />
                    </Box>
                </Tooltip>
                <Stack direction="row" sx={{ flex: 1 }}>
                    <Typography
                        style={{
                            fontWeight: 700,
                            textAlign: 'center',
                            overflow: 'clip',
                            textOverflow: 'ellipsis',
                            flex: 1,
                        }}
                    >
                        {getActionTitle(mainAction)}
                    </Typography>
                </Stack>
            </Stack>
        </CardActionArea>
    );
};

export default FragmentActions;
