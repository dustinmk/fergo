import {Vdom, BindPoint} from "./vdom";
import {
    VDOM_NODE,
    VDOM_FRAGMENT,
    VDOM_FUNCTIONAL,
} from "./constants";
import {hasOwnProperty} from "./dom";
import {invariant} from "./invariant";
import update from "./update";

interface Keyed {
    [index: string]: Vdom | null;
}

interface Unkeyed {
    index: number;
    items: Array<Vdom>;
}

export const patchChildren = (old_parent: Vdom, old_children: Vdom[], new_children: Vdom[], parent_next_node: Vdom | null, bindpoint: BindPoint) => {
    // Recurse, passing the next node when entering a fragment
    // old_children are in order of DOM on elem
    // freely set old_child.elem to null to mark reused nodes
    // call onremove hooks

    if (old_parent === null || old_parent.elem === null) {
        throw new Error("Parent node must not be null");
    }

    const [keyed, unkeyed] = splitKeyed(old_children);

    let new_index = 0;
    let next_index: number | null = -1;
    let current_index: number | null = 0;
    while (new_index < new_children.length) {
        const new_child = new_children[new_index];
        const old_child = findOldVdom(new_child, keyed, unkeyed);
        next_index = findNextNode(current_index, old_children);
        const next_vdom = next_index !== null
            ? old_children[next_index]
            : parent_next_node;

        // If one or the other is a fragment, recurse
        const old_fragment_children = old_child !== null && old_child._type === VDOM_FRAGMENT
            ? old_child.children
            : [];
        const new_fragment_children = new_child !== null && new_child._type === VDOM_FRAGMENT
            ? new_child.children
            : [];
        
        if (old_fragment_children.length > 0 || new_fragment_children.length > 0) {
            let next_parent = next_index === null
                ? parent_next_node
                : findFragmentInsertPoint(next_index, old_children);
            next_parent = next_parent === null ? parent_next_node : next_parent;

            if (old_fragment_children.length === 0 && old_child !== null) {
                patchChildren(old_parent, [old_child], new_fragment_children, next_parent, bindpoint);
            } else if (new_fragment_children.length === 0 && new_child !== null) {
                patchChildren(old_parent, old_fragment_children, [new_child], next_parent, bindpoint);
            } else {
                patchChildren(old_parent, old_fragment_children, new_fragment_children, next_vdom, bindpoint);
            }

        } else {
            // Otherwise, update and patch the element
            update(old_child, new_child, bindpoint);
            patchElement(old_parent.elem, old_child, new_child, next_vdom);
        }

        ++new_index;
        if (current_index !== null) {
            ++current_index;
        } else if (current_index !== null && current_index > old_children.length) {
            current_index = null;
        }
        
    }

    clearExtraNodes(old_parent, keyed, unkeyed);

    // Clear out extras and call remove hooks
    return old_parent.elem;
}

const findFragmentInsertPoint = (next_index: number, old_children: Vdom[]): Vdom | null => {
    next_index++;
    if (next_index >= old_children.length) {
        return null;
    }

    const candidate = old_children[next_index]
    if (candidate === null || candidate.parent === null) {
        return findFragmentInsertPoint(next_index, old_children);

    } else if (candidate._type === VDOM_FRAGMENT) {
        return findFragmentInsertPoint(-1, candidate.children)
    }

    return candidate;
}

const clearExtraNodes = (old_parent: Vdom, keyed: Keyed, unkeyed: Unkeyed) => {
    if (old_parent === null || old_parent.elem === null) {
        throw new Error("Parent node is null");
    }

    while (unkeyed.index < unkeyed.items.length) {
        const removed = unkeyed.items[unkeyed.index];
        if (removed !== null) {
            if (removed._type === VDOM_FRAGMENT) {
                clearExtraNodes(old_parent, {}, {index: 0, items: removed.children})
            } else {
                removed.elem !== null && removed.parent !== null && old_parent.elem.removeChild(removed.elem);  
                removed.parent = null;  
                update(removed, null, null);
            }
        }
        ++unkeyed.index;
    }

    for (const key in keyed) {
        if (hasOwnProperty(keyed, key)) {
            const removed = keyed[key];
            if (removed !== null && removed._type === VDOM_FRAGMENT && removed.parent !== null) {
                clearExtraNodes(old_parent, {}, {index: 0, items: removed.children})
            } else if (removed !== null && removed.elem !== null) {
                removed.elem !== null && removed.parent !== null && old_parent.elem.removeChild(removed.elem);
                update(removed, null, null);
            }
        }
    }
}

const splitKeyed = (vdoms: Vdom[]) => {
    const keyed: Keyed = {};
    const unkeyed: Unkeyed = {index: 0, items: []};
    for (const vdom of vdoms) {
        const key = keyOf(vdom);
        if (key !== null) {
            invariant(!(key in keyed), "Keys must be unique in a fragment");
            keyed[key] = vdom;
        } else {
            unkeyed.items.push(vdom);
        }
    }

    return [keyed, unkeyed] as [Keyed, Unkeyed]
}

const findOldVdom = (new_vdom: Vdom, keyed: Keyed, unkeyed: Unkeyed): Vdom | null => {
    const key = keyOf(new_vdom);
    if (key !== null && hasOwnProperty(keyed, key)) {
        const old_vdom = keyed[key];
        keyed[key] = null;
        return old_vdom;
    } else if (unkeyed.index < unkeyed.items.length) {
        return unkeyed.items[unkeyed.index++];
    }

    return null;
}

const findNextNode = (next_index: number | null, vdoms: Vdom[]) => {
    // if (next_index !== null) next_index += 1;
    let vdoms_next_index = next_index === null ? null : vdoms[next_index];
    while (
        next_index !== null
        && next_index < vdoms.length
        && (vdoms_next_index === null || vdoms_next_index.elem === null || vdoms_next_index.parent === null)
    ) {
        ++next_index;
        vdoms_next_index = next_index === null ? null : vdoms[next_index];
    }
    if (next_index !== null && next_index >= vdoms.length) {
        return null;
    }

    return next_index;
}

const patchElement = (root_node: Node, old_vdom: Vdom | null, new_vdom: Vdom | null, next_vdom: Vdom | null) => {
    const old_node = old_vdom === null
        ? null
        : old_vdom.elem;
    const new_node = new_vdom === null
        ? null
        : new_vdom.elem;
    const next_node = next_vdom === null || next_vdom.parent === null
        ? null
        : next_vdom.elem;

    if (old_node === null || next_node === null) {
        new_node !== null && root_node.insertBefore(new_node, next_node);

    } else if (new_node === null) {
        next_node !== null && root_node.removeChild(next_node);
        if (next_vdom !== null) next_vdom.parent = null;

    } else if (next_node !== new_node) {
        next_node !== null && root_node.replaceChild(new_node, next_node);
        if (next_vdom !== null) next_vdom.parent = null;
    }

    if (old_vdom !== null) {
        old_vdom.parent = null;
    }
}

const keyOf = (vdom: Vdom | null) => {
    if (vdom === null) {
        return null;
    }

    if (vdom._type === VDOM_NODE && vdom.attributes.key !== undefined) {
        return vdom.attributes.key;
    }

    if (vdom._type === VDOM_FUNCTIONAL && vdom.key !== undefined) {
        return vdom.key;
    }

    return null;
}
