import fs from 'fs';
import p from 'path';
import moment from 'moment';

export interface RequirementContext {
    fileName: string;
    section: number;
    sectionName: string;
    timeCreation?: number;
    timeModification?: number;
    // tagName, tagValue
    tags: Record<string, string>;
    // tagName, classificationPath
    classification: Record<string, string>;
    module: string;
}

export interface SessionContext {
    provider?: ValueProvider;
    providers: Record<string, ValueProvider>;
    // currently used providers cached to prevent cycle dependencies
    currentProviders: string[];
}

export interface ProviderSupplier {
    provider?: ValueProvider;
    providers?: ValueProvider[];
}

export type ValueSupplier = ValueProvider | InheritProvider | string;

interface ValueProvider {
    type: string;
    id?: string;
}

interface InheritProvider extends ValueProvider {
    type: 'provider';
}

function isInherit(prov: ValueProvider): prov is InheritProvider {
    return prov.type === 'provider';
}

function isTagProvider(prov: ValueProvider): prov is TagValueProvider {
    return prov.type === 'tag';
}

function isTimeProvider(prov: ValueProvider): prov is TimeValueProvider {
    return prov.type === 'time';
}

function isFileNameProvider(prov: ValueProvider): prov is FileNameProvider {
    return prov.type === 'file_name';
}

function isSectionProvider(prov: ValueProvider): prov is SectionValueProvider {
    return prov.type === 'section';
}

function isConstantProvider(prov: ValueProvider): prov is ConstantProvider {
    return prov.type === 'text';
}

interface ConstantProvider extends ValueProvider {
    type: 'text';
    value: string;
}

interface SectionValueProvider extends ValueProvider {
    type: 'section';
    variant?: 'index' | 'name';
    offset?: number;
}

interface TagValueProvider extends ValueProvider {
    type: 'tag';
    tag: string;
}

interface TimeValueProvider extends ValueProvider {
    type: 'time';
    format: string;
    value: string;
    duration?: number;
    durationOffset?: number;
    durationTag?: string;
    modification?: false;
}

interface FileNameProvider extends ValueProvider {
    type: 'file_name';
    pattern: RegExp;
}

/**
 * Gets provider by the given id or any provider in the hope that the is only one.
 */
function getProviderById(session: SessionContext, id?: string): ValueProvider {
    return id ? session.providers[id] : session.provider ?? { type: 'empty' };
}

function getProviderValue(
    provider: ValueProvider,
    context: RequirementContext,
    session: SessionContext
): string {
    if (isInherit(provider)) {
        // if(){
        //     throw new ResourceError(
        //         'The action type \"' + action.type + "\" is invalid, this id is not used."
        //     );
        // }
        return getProviderValue(
            getProviderById(session, provider.id),
            context,
            session
        );
    }
    if (isFileNameProvider(provider)) {
        const matches = context.fileName.match(provider.pattern);
        return matches ? matches[0].valueOf() : '';
    }
    if (isTagProvider(provider)) {
        return context.tags[provider.tag];
    }
    if (isSectionProvider(provider)) {
        if (provider.variant === 'name') {
            return context.sectionName;
        }
        return (context.section - (provider.offset ?? 0)).toString();
    }
    if (isConstantProvider(provider)) {
        return provider.value;
    }
    if (isTimeProvider(provider)) {
        const time = moment(provider.value, 'YYYY/MM/DD');
        if (
            provider.duration &&
            provider.durationOffset &&
            provider.durationTag
        ) {
            const duration = moment.duration(provider.duration);
            const tagValue = parseInt(context.tags[provider.durationTag], 10);
            for (let i = 0; i < tagValue - provider.durationOffset; i += 1) {
                time.add(duration);
            }
        }
        return time.format(provider.format);
    }
    throw new ResourceError(
        `The provider type "${provider.type}" is invalid, there is no provider with this id.`
    );
}

export function getValue(
    provider: ValueSupplier,
    context: RequirementContext,
    session: SessionContext
): string {
    if (typeof provider === 'string') {
        return provider;
    }
    return getProviderValue(provider, context, session);
}

function injectProvider(
    provider: ValueProvider,
    _context: RequirementContext,
    session: SessionContext
) {
    if (provider.id) {
        session.providers[provider.id] = provider;
    } else {
        session.provider = provider;
    }
}

export function injectProviders(
    supplier: ProviderSupplier,
    context: RequirementContext,
    session: SessionContext
) {
    if (supplier.provider) {
        if (supplier.providers) {
            throw new ResourceError(
                'Both "providers" and "provider" properties of the given object are used, please use only one of these properties.'
            );
        }
        injectProvider(supplier.provider, context, session);
    }
    if (supplier.providers) {
        supplier.providers.forEach((provider) =>
            injectProvider(provider, context, session)
        );
    }
}

export function loadFile<T>(
    path: string,
    onLoad: (json: T, path: string) => void
) {
    fs.readFile(path, 'latin1', (err, data) => {
        if (err) throw err;
        const jsonData = JSON.parse(data);
        onLoad(jsonData, path);
    });
}

export function loadFolder<T>(
    path: string,
    onLoad: (json: T, path: string) => void
) {
    if (!fs.existsSync(path)) {
        return;
    }
    fs.stat(path, (_, folderStat) => {
        if (!folderStat.isDirectory()) {
            return;
        }
        fs.readdir(path, (err, files) => {
            if (err) throw err;
            files.forEach((file) => {
                const newPath = p.join(path, file);
                fs.stat(p.join(path, file), (e, stats) => {
                    if (e) throw e;
                    if (stats.isDirectory()) {
                        loadFolder(newPath, onLoad);
                    } else if (stats.isFile() && p.extname(file) === '.json') {
                        loadFile(newPath, onLoad);
                    }
                });
            });
        });
    });
}
