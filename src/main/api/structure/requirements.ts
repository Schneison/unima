import { RequirementContext, SessionContext } from './structure_common';

export interface RequirementProvider {
    criteria?: ResourceRequirement;
}

interface ResourceRequirement {
    type: string;
}

function isCollection(
    requirement: ResourceRequirement
): requirement is CollectionRequirement {
    return requirement.type === 'and' || requirement.type === 'or';
}

function isSection(
    requirement: ResourceRequirement
): requirement is SectionRequirement {
    return requirement.type === 'section';
}

interface SectionRequirement extends ResourceRequirement {
    type: 'section';
    start: number | null;
    end: number | null;
}

interface CollectionRequirement extends ResourceRequirement {
    type: 'and' | 'or';
    values: ResourceRequirement[];
}

function isName(
    requirement: ResourceRequirement
): requirement is NameRequirement {
    return (
        requirement.type === 'name_start' ||
        requirement.type === 'name_end' ||
        requirement.type === 'name_contain'
    );
}

function isTag(
    requirement: ResourceRequirement
): requirement is TagRequirement {
    return requirement.type === 'tag';
}

interface TagRequirement extends ResourceRequirement {
    type: 'tag_has';
    tag: string;
    item?: string;
}

interface NameRequirement extends ResourceRequirement {
    type: 'name_start' | 'name_end' | 'name_contain';
    value: string;
}

function testRequirement(
    req: ResourceRequirement,
    context: RequirementContext,
    session: SessionContext
): boolean {
    if (isCollection(req)) {
        if (req.type === 'or') {
            return req.values.some((r) => testRequirement(r, context, session));
        }
        // and
        return req.values.every((r) => testRequirement(r, context, session));
    }
    if (isName(req)) {
        if (req.type === 'name_start') {
            return context.fileName.startsWith(req.value);
        }
        if (req.type === 'name_end') {
            return context.fileName.endsWith(req.value);
        }
        if (req.type === 'name_contain') {
            const matches = context.fileName.match(req.value);
            return (matches?.length ?? 0) > 0;
        }
        throw new Error(`Failed to find implementation for type ${req.type}`);
    }
    if (isTag(req)) {
        return (
            req.tag in context.tags &&
            (!req.item || context.tags[req.tag] === req.item)
        );
    }
    if (isSection(req)) {
        return (
            !!req.start &&
            context.section >= req.start &&
            !!req.end &&
            context.section <= req.end
        );
    }
    return false;
}

export function testProvider(
    prov: RequirementProvider,
    context: RequirementContext,
    session: SessionContext
): boolean {
    return !prov.criteria || testRequirement(prov.criteria, context, session);
}
