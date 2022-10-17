import p from 'path';
import DataStorage from '../../resources/data_storage';
import StructureArchitecture from '../structure/structure_architecture';
import SourceArchitecture from './source_architecture';
import Api from '../api';

// export function isSource(element: Member): element is SourceMember {
//     return 'source' in element;
// }

export function isSource(item: ChildItem): item is Source {
    return 'section' in item;
}

export function isPlain(element: Member): element is PlainMember {
    return 'title' in element;
}
const architectures: Record<ArchitectureType, MemberArchitecture> = {
    source: new SourceArchitecture(),
    structure: new StructureArchitecture(),
};

const transformPath = (segments: string[]): string[] => {
    return segments
        .map((path) => path.split(p.sep))
        .reduce((left, right) => [...left, ...right]);
};

export async function applyAction(
    sourceId: number,
    archType: ArchitectureType,
    action: MemberAction
) {
    const architecture: MemberArchitecture = architectures[archType];
    return architecture.applyAction(sourceId, action);
}

export async function createMembers(
    moduleId: string,
    options: ArchitectureOptions
): Promise<RootMember> {
    const module = await Api.module().select(moduleId);
    if (!module) {
        return {
            children: [],
            title: '',
            lexicon: {},
        };
    }
    const architecture: MemberArchitecture = architectures[options.type];
    const lexicon: MemberLexicon = {};
    const root: RawMember = {
        children: {},
    };
    const addMember = (
        parent: RawMember,
        index: MemberIndex,
        segments: string[],
        factory: DetailsFactory,
        pathTotal: string
    ) => {
        if (segments.length === 0) {
            parent.details = factory();
            lexicon[index] = pathTotal;
        } else {
            const children = parent.children ?? {};
            let element = children[segments[0]];
            if (!element) {
                element = {
                    children: {},
                };
                children[segments[0]] = element;
            }
            addMember(element, index, segments.slice(1), factory, pathTotal);
        }
    };
    await architecture.addMemberTree(
        module,
        (factory, index, ...pathSegments) =>
            addMember(
                root,
                index,
                transformPath(pathSegments),
                factory,
                p.join(...pathSegments)
            )
    );
    const bakeMember = (raw: RawMember, name: string): PlainMember => {
        if (raw.children && Object.keys(raw.children).length) {
            return {
                children: Object.keys(raw.children).map((key) =>
                    bakeMember(raw.children[key], key)
                ),
                title: name,
            };
        }
        return {
            title: name,
            details: raw.details,
        } as LeafMember;
    };
    const rootPlain: PlainMember = bakeMember(root, '.');
    return { ...rootPlain, lexicon };
}

export async function selectMembers(moduleName: string): Promise<RootMember> {
    return createMembers(moduleName, {
        type: 'structure',
        sorting: 'ascending',
    });
}

function getSourceIndex(source: Source) {
    return source.section?.index ?? 0;
}

function getIndex(source: ChildItem) {
    return getSourceIndex(isSource(source) ? source : source.source);
}

function insertSorted(root: ProviderItem<ChildItem>, current: ChildItem) {
    const { children } = root;
    const value = getIndex(current);
    for (let i = 0; i <= children.length; i += 1) {
        if (i === children.length || value < getIndex(children[i])) {
            children.splice(i, 0, current);
            return;
        }
    }
}

export async function selectSectionItems(
    moduleName: string
): Promise<SectionRoot> {
    const sources: Source[] = await DataStorage.applyAction({
        repository: 'sources',
        type: 'select',
        criteria: {
            module: moduleName,
        },
    }).then((result) => result.payload ?? []);
    const sections: SectionRoot = {};
    const children: Record<number, Source[]> = {};
    sources
        .map((value) => {
            if (value.parent) {
                if (!(value.parent in children)) {
                    children[value.parent] = [];
                }
                children[value.parent].push(value);
            }
            return value;
        })
        .forEach((value) => {
            if (value.section) {
                const index = value.section.sectionIndex;
                let section = sections[index];
                if (!section) {
                    section = {
                        children: [],
                        index,
                    };
                    sections[index] = section;
                }
                insertSorted(
                    section,
                    children[value.id]
                        ? {
                              children: children[value.id] ?? [],
                              source: value,
                          }
                        : value
                );
            }
        });
    return sections;
}

export function onSourceUpdate() {}
