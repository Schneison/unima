// module, <name, instances>
import {
    getValue,
    injectProviders,
    loadFolder,
    ProviderSupplier,
    RequirementContext,
    SessionContext,
    ValueSupplier,
} from './structure_common';
import { RequirementProvider, testProvider } from './requirements';

const classifications: Record<string, Classification[]> = {};

interface Classification extends RequirementProvider, ProviderSupplier {
    action: ClassificationAction;
    name: string;
}

interface ClassificationAction {
    type: string;
}

interface TagAction extends ClassificationAction {
    type: 'tag';
    tag: string;
    value: ValueSupplier;
}

export function loadClassifications(module: string, confPath: string) {
    const instances: Classification[] = [];
    loadFolder(confPath, (values) => {
        if (Array.isArray(values)) {
            instances.push(...(values as Classification[]));
            return;
        }
        instances.push(values as Classification);
    });
    classifications[module] = instances;
}

function isTagAction(action: ClassificationAction): action is TagAction {
    return action.type === 'tag';
}

function applyAction(
    action: ClassificationAction,
    clas: string,
    context: RequirementContext,
    session: SessionContext
): void {
    if (isTagAction(action)) {
        context.tags[action.tag] = getValue(action.value, context, session);
        context.classification[action.tag] = clas;
        return;
    }
    throw new ResourceError(
        `The action type "${action.type}" is invalid, there is no provider with this id.`
    );
}

function applyClassification(
    cl: Classification,
    context: RequirementContext,
    session: SessionContext
): void {
    if (!testProvider(cl, context, session)) {
        return;
    }
    injectProviders(cl, context, session);
    applyAction(cl.action, cl.name, context, session);
}

export function applyClassifications(
    context: RequirementContext,
    session: SessionContext
): void {
    (classifications[context.module] ?? [])
        .filter((clas) => testProvider(clas, context, session))
        .forEach((clas) => applyClassification(clas, context, session));
}
