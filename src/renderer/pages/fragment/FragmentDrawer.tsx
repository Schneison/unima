import { FC, MouseEvent, useState } from 'react';
import {
    Box,
    Divider,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Toolbar,
    Tooltip,
} from '@mui/material';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import InventoryIcon from '@mui/icons-material/Inventory2Outlined';
import FolderOpenIcon from '@mui/icons-material/FolderOpenOutlined';

interface DrawerProps {
    members: PlainMember[];
    open: boolean;
    width: number;
}

const FragmentDrawer: FC<DrawerProps> = ({ members, open, width }) => {
    const [sorting, setSorting] = useState<string>('ascending');
    const [archy, setArchy] = useState<string>('sources');

    const handleSorting = (
        _event: MouseEvent<HTMLElement>,
        newSorting: string | null
    ) => {
        if (newSorting != null) {
            setSorting(newSorting);
        }
    };
    const handleArchy = (
        _event: MouseEvent<HTMLElement>,
        newArchy: string | null
    ) => {
        if (newArchy != null) {
            setArchy(newArchy);
        }
    };
    return (
        <Drawer
            sx={{
                width,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width,
                    boxSizing: 'border-box',
                    boxShadow: 12,
                },
            }}
            variant="persistent"
            anchor="left"
            open={open}
        >
            <Toolbar variant="dense" />
            <Box sx={{ p: 2 }}>
                <Stack
                    direction="row"
                    spacing={4}
                    justifyContent="space-between"
                >
                    <ToggleButtonGroup
                        value={sorting}
                        exclusive
                        onChange={handleSorting}
                        size="small"
                    >
                        <ToggleButton value="ascending">
                            <Tooltip title="Ascending">
                                <KeyboardDoubleArrowDownIcon />
                            </Tooltip>
                        </ToggleButton>
                        <ToggleButton value="descending">
                            <Tooltip title="Descending">
                                <KeyboardDoubleArrowUpIcon />
                            </Tooltip>
                        </ToggleButton>
                    </ToggleButtonGroup>
                    <ToggleButtonGroup
                        value={archy}
                        exclusive
                        onChange={handleArchy}
                        size="small"
                    >
                        <ToggleButton value="sources">
                            <Tooltip title="All">
                                <InventoryIcon />
                            </Tooltip>
                        </ToggleButton>
                        <ToggleButton value="structure">
                            <Tooltip title="Only Files">
                                <FolderOpenIcon />
                            </Tooltip>
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Stack>
            </Box>
            <Divider />
            <List>
                {members.map((member, index, a) => (
                    <ListItem
                        key={member.title}
                        disablePadding
                        divider={index + 1 < a.length}
                    >
                        <ListItemButton
                            onClick={() => {
                                const section = document.getElementById(
                                    `section-${index}`
                                );
                                section?.scrollIntoView({
                                    block: 'center',
                                });
                            }}
                        >
                            <ListItemText
                                primary={member.title}
                                sx={{
                                    display: '-webkit-box',
                                    overflow: 'hidden',
                                    WebkitBoxOrient: 'vertical',
                                    WebkitLineClamp: 1,
                                }}
                            />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Drawer>
    );
};

export default FragmentDrawer;
