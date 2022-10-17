import DataStorage from '../../resources/data_storage';

export default class StructureArchitecture implements MemberArchitecture {
    addMemberTree = async (module: Module, addMember: AddMember) => {
        const infos: StructureInfo[] =
            await DataStorage.getController().loadStructureComplete(module);
        infos.forEach((info) =>
            addMember(
                () => {
                    return {
                        tags: info.tags,
                    };
                },
                info.source.id,
                info.pathName,
                info.resource.fileName ?? ''
            )
        );
    };

    applyAction = async (_id: number, _action: MemberAction) => {};
}
