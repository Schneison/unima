import * as React from 'react';
import { useSelector } from 'react-redux';
import { selectArch } from '../../state/reducers/fragmentReducer';

interface MemberFacadeProps {
    element: () => React.ReactElement;
    architecture: ArchitectureType;
}

const MemberFacade: React.FC<MemberFacadeProps> = ({
    architecture,
    element,
}) => {
    const currentArch = useSelector(selectArch);
    if (currentArch === architecture) {
        // eslint-disable-next-line react/jsx-props-no-spreading
        return element();
    }
    return <></>;
};

export default MemberFacade;
