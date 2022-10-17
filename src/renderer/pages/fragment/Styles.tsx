import styled from '@emotion/styled';
import { Accordion, ListItem, ListItemProps, Typography } from '@mui/material';
import { FilteringStyledOptions } from '@emotion/styled/base';

export const filterProps = <CustomProps extends Record<string, unknown>>(
    props: Array<keyof CustomProps>,
    prop: PropertyKey
): boolean => !props.includes(prop as string);

export const filteredStyle = <CustomProps extends Record<string, unknown>>(
    props: Array<keyof CustomProps>
) =>
    ({
        shouldForwardProp: (propName) =>
            filterProps<CustomProps>(props, propName),
    } as FilteringStyledOptions);

type FacadeEntryProps = {
    isEven: boolean;
    isFirst: boolean;
    isLast: boolean;
};

export const FacadeEntry = styled(
    ListItem,
    filteredStyle<FacadeEntryProps>(['isFirst', 'isEven', 'isLast'])
)<FacadeEntryProps & ListItemProps>`
    background-color: ${(props) =>
        props.isEven ? 'rgba(68,68,68,0.3)' : 'rgba(68,68,68,0.2)'};
    border-top-left-radius: ${(props) => (props.isFirst ? '6px' : '0px')};
    border-top-right-radius: ${(props) => (props.isFirst ? '6px' : '0px')};
    border-bottom-left-radius: ${(props) => (props.isLast ? '6px' : '0px')};
    border-bottom-right-radius: ${(props) => (props.isLast ? '6px' : '0px')};
    border-color: transparent;
    ':last-of-type': {
        border-radius: 0;
    }
    '.first-of-type': {
        border-radius: 0;
    }
`;
export const FacadeFolder = FacadeEntry.withComponent(Accordion);

export const FragmentTitle = styled(Typography)(() => ({
    display: '-webkit-box',
    overflow: 'hidden',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 2,
    fontWeight: 500,
}));
