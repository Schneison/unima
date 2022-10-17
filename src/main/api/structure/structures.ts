// module, instance
import p from 'path';
import { RequirementProvider, testProvider } from './requirements';
import {
    getValue,
    loadFolder,
    ProviderSupplier,
    RequirementContext,
    SessionContext,
} from './structure_common';

const structuresByModule: Record<string, Structure[]> = {};
// instances
const structures: Structure[] = [];

type StructureMember = string | StructureEntry;

interface StructureContext {
    provided: string[];
}

interface Structure extends RequirementProvider, ProviderSupplier {
    path: StructureMember[];
    rank?: StructureRank;
}

interface StructureRank {
    dominant?: boolean;
    weight?: number;
}

interface StructureEntry {
    provider: number;
}

interface WeightedPath {
    weight: number;
    path: string;
}

function isProviderStructure(prov: StructureMember): prov is StructureEntry {
    return typeof prov === 'object' && 'provider' in prov;
}

export function initStructureContext(
    structure: Structure,
    context: RequirementContext,
    session: SessionContext
): StructureContext {
    return {
        provided: (structure.providers ?? []).map((pr) =>
            getValue(pr, context, session)
        ),
    };
}

function applyStructure(
    structure: Structure,
    context: StructureContext
): string {
    return structure.path
        .map((member) => {
            if (typeof member === 'string') {
                return member;
            }
            if (isProviderStructure(member)) {
                return context.provided[member.provider];
            }
            return '';
        })
        .join('');
}

/**
 * Creates path for the given source based on the structure models created for the module of the source.
 */
export function createPath(
    criteriaContext: RequirementContext,
    session: SessionContext,
    module: string
): string {
    const instances: Structure[] = [
        ...structures,
        ...(structuresByModule[module] ?? []),
    ];
    let paths: WeightedPath[] = [];
    let foundDominant = false;

    instances.forEach((instance) => {
        if (
            foundDominant ||
            !testProvider(instance, criteriaContext, session)
        ) {
            return;
        }
        const context = initStructureContext(
            instance,
            criteriaContext,
            session
        );
        const { rank } = instance;
        const weight = rank?.weight ?? 0;
        const dominant = rank?.dominant ?? false;
        if (dominant) {
            paths = [];
            foundDominant = true;
        }
        paths.push({
            weight,
            path: applyStructure(instance, context),
        });
    });
    paths.sort((a, b) => a.weight - b.weight);
    return p.join(...paths.map((wP) => wP.path));
}

/**
 * Loads all json files in the given location as structure files if possible.
 */
export function loadStructures(confPath: string, module?: string) {
    loadFolder<Structure>(confPath, (v) => {
        let instances = structures;
        if (module) {
            instances = structuresByModule[module];
            if (!instances) {
                instances = [];
                structuresByModule[module] = instances;
            }
        }
        instances.push(v);
    });
}
