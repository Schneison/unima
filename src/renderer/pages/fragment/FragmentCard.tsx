import { FC } from 'react';
import {
    Box,
    ButtonGroup,
    Card,
    CardContent,
    CardHeader,
    Divider,
    IconButton,
    Stack,
    Tooltip,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { FragmentTitle } from './Styles';
import FragmentActions from './FragmentAction';

const FragmentHeader: FC<FragmentProps> = ({ member }) => {
    return (
        <Box sx={{ flex: 1 }}>
            <CardHeader
                title={
                    <Tooltip title={member.title}>
                        <FragmentTitle variant="body2">
                            {member.title}
                        </FragmentTitle>
                    </Tooltip>
                }
                sx={{ p: 1 }}
            />
        </Box>
    );
};

const FragmentOptions: FC<FragmentProps> = () => {
    return (
        <Box sx={{ px: 1 }}>
            <ButtonGroup>
                <Tooltip title="Hide">
                    <IconButton>
                        <VisibilityIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </ButtonGroup>
        </Box>
    );
};

let FragmentFolder: FC<FragmentCardProps>;

interface FragmentProps {
    member: LeafMember;
}

interface FragmentCardProps extends FragmentProps {
    optionsVisible: boolean;
}

const FragmentCard: FC<FragmentCardProps> = ({ member, optionsVisible }) => {
    const details = member.details as DetailSource;
    const resource = details?.resource;
    return (
        <Card
            sx={{
                flex: 1,
                minWidth: 150,
                m: 1,
            }}
            elevation={4}
        >
            <Stack
                direction="column"
                justifyItems="stretch"
                sx={{ height: '100%' }}
            >
                <FragmentHeader member={member} />
                <Divider />
                {member.children && (
                    <FragmentFolder
                        member={member}
                        optionsVisible={optionsVisible}
                    />
                )}
                {member.children && <Divider />}
                {optionsVisible && <FragmentOptions member={member} />}
                {optionsVisible && <Divider />}
                {resource && (
                    <FragmentActions
                        resource={resource}
                        type={details?.type}
                        sourceId={details?.id}
                        mainAction={details?.mainAction}
                    />
                )}
            </Stack>
        </Card>
    );
};

FragmentFolder = ({ member, optionsVisible }: FragmentCardProps) => {
    return (
        <CardContent sx={{ backgroundColor: 'lightgray', p: 0 }}>
            {...member.children.map((c) => (
                <FragmentCard
                    member={c as LeafMember}
                    optionsVisible={optionsVisible}
                />
            ))}
        </CardContent>
    );
};

export default FragmentCard;
