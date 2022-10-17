import { loadFolder } from './structure_common';

interface TagInstance {
    name: string;
    values: TagDefinition;
}

interface TagDefinition {
    type: string;
}

function isNumberTag(def: TagDefinition): def is NumberTag {
    return def.type === 'number';
}

function isSectionTag(def: TagDefinition): def is TagDefinition {
    return def.type === 'section';
}

function isEnumTag(def: TagDefinition): def is EnumTag {
    return def.type === 'enum';
}

interface NumberTag extends TagDefinition {
    type: 'number';
    start: number;
    end: number;
}

interface EnumTag extends TagDefinition {
    type: 'enum';
    values: string[];
}

// incName, itemName[]
const tags: Record<string, string[]> = {};

function createItems(instance: TagInstance): string[] {
    const items: string[] = [];
    const def = instance.values;
    if (isNumberTag(def)) {
        for (let i = def.start; i < def.end; i += 1) {
            items.push(i.toString());
        }
    }
    if (isEnumTag(def)) {
        items.push(...def.values);
    }
    if (isSectionTag(def)) {
        // TODO: load / cache section names!!
    }
    return items;
}

export default function loadTags(confPath: string) {
    const instances: TagInstance[] = [];
    loadFolder<TagInstance>(confPath, (v) => instances.push(v));
    instances.forEach((tag) => {
        tags[tag.name] = createItems(tag);
    });
}
