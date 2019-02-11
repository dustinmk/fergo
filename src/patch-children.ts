import {Vdom, BindPoint, VdomFragment} from "./vdom";
import {
    VDOM_NODE,
    VDOM_FRAGMENT,
    VDOM_FUNCTIONAL,
} from "./constants";
import {hasOwnProperty} from "./dom";
import {invariant} from "./invariant";
import update from "./update";
import lis from "./longest-increasing-subsequence";

interface Keyed {
    [index: string]: number | null;
}

interface Unkeyed {
    index: number;
    items: Array<number>;
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
    const old_node_indexes: number[] = [];

    let new_index = 0;
    let current_index: number = 0;
    while (new_index < new_children.length) {
        const new_child = new_children[new_index];
        const old_child_index = findOldVdomIndex(new_child, keyed, unkeyed);
        const old_child = old_child_index === null ? null : old_children[old_child_index];
        
        if (isFragment(new_child) || isFragment(old_child)) {
            let next_parent = findFragmentInsertPoint(current_index, old_children);
            if (next_parent === null) next_parent = parent_next_node;

            const old_fragment_children = isFragment(old_child) ? old_child.children : [old_child];
            const new_fragment_children = isFragment(new_child) ? new_child.children : [new_child];

            patchChildren(old_parent, old_fragment_children, new_fragment_children, next_parent, bindpoint);

        } else {
            // Otherwise, update and patch the element
            update(old_child, new_child, bindpoint);
            
            if (new_child !== null && old_child !== null && old_child_index !== null) {
                old_node_indexes.push(old_child_index);
                
                // Flag the old vdom as used
                if (old_child !== null) old_child.parent = null;
            }
        }

        ++new_index;
        ++current_index;
    }

    const lis_new_nodes = lis(old_node_indexes);
    patchElements(old_parent.elem, old_children, new_children, lis_new_nodes, parent_next_node === null ? null : parent_next_node.elem);
    clearExtraNodes(old_parent, old_children, keyed, unkeyed);

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

const isFragment = (vdom: Vdom): vdom is VdomFragment => {
    return vdom !== null && vdom._type === VDOM_FRAGMENT;
}

const clearExtraNodes = (old_parent: Vdom, old_children: Vdom[], keyed: Keyed, unkeyed: Unkeyed) => {
    if (old_parent === null || old_parent.elem === null) {
        throw new Error("Parent node is null");
    }

    while (unkeyed.index < unkeyed.items.length) {
        const removed_index = unkeyed.items[unkeyed.index];
        const removed = old_children[removed_index];
        if (removed !== null) {
            if (removed._type === VDOM_FRAGMENT) {
                const child_indexes = [];
                for (let i = 0; i < removed.children.length; ++i) {
                    child_indexes.push(i);
                }
                clearExtraNodes(old_parent, old_children, {}, {index: 0, items: child_indexes})
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
            const removed_index = keyed[key];
            const removed = removed_index === null ? null : old_children[removed_index];
            if (removed !== null && removed._type === VDOM_FRAGMENT && removed.parent !== null) {
                const child_indexes = [];
                for (let i = 0; i < removed.children.length; ++i) {
                    child_indexes.push(i);
                }
                clearExtraNodes(old_parent, old_children, {}, {index: 0, items: child_indexes})
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
    for (let index = 0;index < vdoms.length; ++index) {
        const vdom = vdoms[index];
        const key = keyOf(vdom);
        if (key !== null) {
            invariant(!(key in keyed), "Keys must be unique in a fragment");
            keyed[key] = index;
        } else {
            unkeyed.items.push(index);
        }
    }

    return [keyed, unkeyed] as [Keyed, Unkeyed]
}

const findOldVdomIndex = (new_vdom: Vdom, keyed: Keyed, unkeyed: Unkeyed): number | null => {
    const key = keyOf(new_vdom);
    if (key !== null) {
        if (hasOwnProperty(keyed, key) && keyed[key] !== null) {
            const old_vdom = keyed[key];
            keyed[key] = null;
            return old_vdom;
        } else {
            return null;
        }
        
    } else if (unkeyed.index < unkeyed.items.length) {
        return unkeyed.items[unkeyed.index++];
    }
    return null;
}

const patchElements = (root_node: Node, old_vdoms: Vdom[], new_vdoms: Vdom[], lis_indices: number[], end_node: Node | null) => {
    // Consider fragments
    // Old vdoms in same order as DOM children
    // keep all old in lis if elem is same
    // Replace when in lis if elem not same
    // Replace when new and old not in lis
    // Remove when old not in lis
    // Insert when new not in lis
    // When insert at end, insert at start of next fragment

    let old_index = 0;
    let lis_index = 0;
    let new_index = 0;
    while(new_index < new_vdoms.length) {
        const old_vdom = old_index < old_vdoms.length ? old_vdoms[old_index] : null;
        const new_vdom = new_vdoms[new_index];
        const lis_vdom = lis_index < lis_indices.length ? old_vdoms[lis_indices[lis_index]] : null;
        const old_node = old_vdom === null ? null : old_vdom.elem;
        const new_node = new_vdom === null ? null : new_vdom.elem;
        const lis_node = lis_vdom === null ? null : lis_vdom.elem;

        // Filter out fragments
        // TODO: Prove this is correct: LIS, OLD, NEW, FRAGMENT, NULL OLD, NULL NEW, NULL LIS
        if (new_vdom !== null && new_vdom._type === VDOM_FRAGMENT) {
            ++new_index;
            ++old_index;
            continue;
        }

        if (old_vdom !== null && old_vdom._type === VDOM_FRAGMENT) {
            ++old_index;
            ++new_index;
            continue;
        }

        if (lis_node === old_node && lis_node !== new_node) {
            new_node !== null && root_node.insertBefore(new_node, lis_node === null ? end_node : lis_node);
            ++new_index;

        } else if (lis_node === old_node && lis_node === new_node) {
            ++old_index;
            ++lis_index;
            ++new_index;

        } else if (lis_node !== old_node && lis_node !== new_node) {
            if (new_node !== null && old_node !== null) {
                root_node.replaceChild(new_node, old_node);
                if(old_vdom !== null) old_vdom.parent = null;
                ++new_index;
            } else {
                old_node !== null && root_node.removeChild(old_node);
                if(old_vdom !== null) old_vdom.parent = null;
            }
            ++old_index;

        } else if (lis_node !== old_node && lis_node === new_node) {
            // Do not remove elems that have already been used elsewhere
            old_node !== null && old_vdom !== null && old_vdom.parent !== null && root_node.removeChild(old_node);
            if(old_vdom !== null) old_vdom.parent = null;
            ++old_index;
        }
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
