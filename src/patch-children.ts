import {Vdom, BindPoint, VdomFragment, VdomNode} from "./vdom";
import {
    VDOM_NODE,
    VDOM_FRAGMENT,
    VDOM_FUNCTIONAL,
} from "./constants";
import update from "./update";
import lis from "./longest-increasing-subsequence";

type Keyed = Map<any, number | null>;

interface Unkeyed {
    index: number;
    items: Array<number>;
}

export const patchChildren = (old_parent: Vdom, old_children: Array<Vdom | null>, new_children: Array<Vdom | null>, parent_next_node: Vdom | null, bindpoint: BindPoint, init_queue: VdomNode[]) => {
    if (old_parent === null || old_parent.elem === null) {
        throw new Error("Parent node must not be null");
    }

    // Fast path for matching beginning
    // TODO: Match unkeyed (key=null) nodes, but resort to LIS if mixed and unmatched keys
    // TODO: must handle insert (old=null) delete (new=null) append (new_index > old_children.length)
    let new_index = 0;
    let old_index: number = 0;
    while (new_index < new_children.length && old_index < old_children.length) {
        const new_child = new_children[new_index];
        const old_child = old_children[old_index];
        let new_elem: Node | null;
        if (new_child === null
            || old_child === null
            || new_child.key === null
            || new_child.key !== old_child.key
            || new_child._type !== old_child._type
            || new_child._type === VDOM_FRAGMENT
        ) {
            break;
        } else {
            new_elem = update(old_child, new_child, bindpoint, init_queue);
            if (old_child.elem !== new_elem
                && old_parent.elem !== null
                && new_elem !== null
                && old_child.elem !== null
            ) {
                old_parent.elem.replaceChild(new_elem, old_child.elem);
            }
        }
        ++new_index;
        ++old_index;
    }

    // TODO: Fastpath reverse keyed
    // TODO: Fastpath append keyed
    // TODO: Fastpath remove keyed
    // TODO: Fastpath unkeyed
    // TODO: Fastpath clear

    const lis_new_begin = new_index;
    const lis_old_begin = old_index;
    const lis_new_end = new_children.length;
    const lis_old_end = old_children.length;

    if (lis_new_end - lis_new_begin <= 0 && lis_old_end - lis_old_begin <= 0) {
        return old_parent.elem;
    } else {
        // Treat rest as a fragment
        // TODO: avoid slicing the arrays
        return reconcileWithLIS(
            old_parent,
            old_children.slice(lis_old_begin, lis_old_end),
            new_children.slice(lis_new_begin, lis_new_end),
            lis_old_end >= old_children.length ? parent_next_node : old_children[lis_old_end],
            bindpoint,
            init_queue);
    }

    // while old_key === new_key || old_tag === new_tag || either old or new are null: update()
    // Go from start to end, end to start, and reverse order
    // Then otherwise do splitKeyed on remaining nodes
    // Remeber fragments
    
}

const reconcileWithLIS = (old_parent: Vdom, old_children: Array<Vdom | null>, new_children: Array<Vdom | null>, parent_next_node: Vdom | null, bindpoint: BindPoint, init_queue: VdomNode[]) => {
    if (old_parent.elem === null) {
        throw new Error("Old parent elem must exist");
    }

    const [keyed, unkeyed] = splitKeyed(old_children);
    const common_node_indexes: number[] = [];   // Nodes shared between new and old
    const matching_vdoms: Array<number> = [];   // Old vdoms paired with new vdoms

    let new_index = 0;
    let old_index: number = 0;
    while (new_index < new_children.length) {
        const new_child = new_children[new_index];
        const matching_child_index = findOldVdomIndex(new_child, keyed, unkeyed);
        const matching_child = matching_child_index === null ? null : old_children[matching_child_index];
        
        if (isFragment(new_child) || isFragment(matching_child)) {
            let next_parent = findFragmentInsertPoint(old_index + 1, old_children);
            if (next_parent === null) next_parent = parent_next_node;

            const old_fragment_children = isFragment(matching_child) ? matching_child.children : [matching_child];
            const new_fragment_children = isFragment(new_child) ? new_child.children : [new_child];

            patchChildren(old_parent, old_fragment_children, new_fragment_children, next_parent, bindpoint, init_queue);

        } else {
            update(matching_child, new_child, bindpoint, init_queue);

            matching_vdoms.push(matching_child_index === null ? -1 : matching_child_index);
            if (new_child !== null && matching_child !== null && matching_child_index !== null && matching_child.elem === new_child.elem) {
                common_node_indexes.push(matching_child_index);
            }
        }

        ++new_index;
        ++old_index;
    }

    const lis_new_nodes = lis(common_node_indexes);
    patchElements(old_parent.elem, old_children, new_children, matching_vdoms, lis_new_nodes, parent_next_node === null ? null : parent_next_node.elem);
    clearExtraNodes(old_parent, old_children, keyed, unkeyed);

    return old_parent.elem;
}

const findFragmentInsertPoint = (next_index: number, old_children: Array<Vdom | null>): Vdom | null => {
    while (next_index < old_children.length) {
        const candidate = old_children[next_index++];

        if (candidate !== null && candidate._type === VDOM_FRAGMENT) {
            return findFragmentInsertPoint(0, candidate.children);

        } else if (candidate !== null && candidate.parent !== null) {
            return candidate;
        }
    }

    return null;
}

const isFragment = (vdom: Vdom | null): vdom is VdomFragment => {
    return vdom !== null && vdom._type === VDOM_FRAGMENT;
}

const clearExtraNodes = (old_parent: Vdom, old_children: Array<Vdom | null>, keyed: Keyed, unkeyed: Unkeyed) => {
    if (old_parent === null || old_parent.elem === null) {
        throw new Error("Parent node is null");
    }

    while (unkeyed.index < unkeyed.items.length) {
        const removed = old_children[ unkeyed.items[unkeyed.index] ];
        if (removed !== null) {
            // Fragment chidlren are all cleared in update()
            if (removed.elem !== null && removed.parent !== null) {
                old_parent.elem.removeChild(removed.elem);  
            }
            update(removed, null, null, []);
        }
        ++unkeyed.index;
    }

    keyed.forEach(removed_index => {
        if (removed_index !== null) {
            const removed = old_children[removed_index];
            if (removed !== null && removed.elem !== null && removed.parent !== null) {
                // Null check override because TS can't introspect type narrowing through callbacks
                old_parent.elem!.removeChild(removed.elem);
            }
            update(removed, null, null, []);
        }
    });
}

const splitKeyed = (vdoms: Array<Vdom | null>) => {
    const keyed: Keyed = new Map();
    const unkeyed: Unkeyed = {index: 0, items: []};
    for (let index = 0; index < vdoms.length; ++index) {
        const vdom = vdoms[index];
        const key = keyOf(vdom);
        if (key !== null) {
            if (keyed.has(key)) throw new Error("Keys must be unique in a fragment");
            keyed.set(key, index);
        } else {
            unkeyed.items.push(index);
        }
    }

    return [keyed, unkeyed] as [Keyed, Unkeyed]
}

const findOldVdomIndex = (new_vdom: Vdom | null, keyed: Keyed, unkeyed: Unkeyed): number | null => {
    const key = keyOf(new_vdom);
    if (key !== null) {
        const matched_id = keyed.get(key);
        if (matched_id !== undefined && matched_id !== null) {
            const old_vdom = matched_id;
            keyed.set(key, null);
            return old_vdom;
        }
        
    } else if (unkeyed.index < unkeyed.items.length) {
        return unkeyed.items[unkeyed.index++];
    }
    return null;
}

const patchElements = (
    root_node: Node,
    old_vdoms: Array<Vdom | null>,
    new_vdoms: Array<Vdom | null>,
    matching_vdoms: Array<number>,
    lis_indices: number[],
    end_node: Node | null
) => {
    let old_index = 0;
    let lis_index = 0;
    let new_index = 0;
    while(new_index < new_vdoms.length) {
        let old_vdom: Vdom | null = old_index < old_vdoms.length ? old_vdoms[old_index] : null;
        const new_vdom = new_vdoms[new_index];
        const matching_index = matching_vdoms[new_index];
        const matching_vdom = matching_index === -1 ? null : old_vdoms[matching_index];
        const lis_vdom = lis_index < lis_indices.length ? old_vdoms[lis_indices[lis_index]] : null;
        const old_node = old_vdom === null ? null : old_vdom.elem;
        const new_node = new_vdom === null ? null : new_vdom.elem;
        const lis_node = lis_vdom === null ? null : lis_vdom.elem;

        // Skip over null or reused nodes
        if (old_vdom !== null && old_vdom.parent === null) {
            ++old_index;
            continue;
        }

        // Filter out fragments
        if ( (new_vdom !== null && new_vdom._type === VDOM_FRAGMENT)
            || (old_vdom !== null && old_vdom._type === VDOM_FRAGMENT)
         ) {
            ++new_index;
            ++old_index;
            continue;
        }

        // lis_node is never null
        if (lis_node === old_node && lis_node !== new_node) {
            new_node !== null && root_node.insertBefore(new_node, lis_node === null ? end_node : lis_node);

            // If new_node is reusing an elem from the old vdom, mark it as removed
            if(matching_vdom !== null) matching_vdom.parent = null;
            ++new_index;

        } else if (lis_node === old_node && lis_node === new_node) {
            ++old_index;
            ++lis_index;
            ++new_index;

        } else if (lis_node !== new_node && new_node !== null && old_node !== null) {
            root_node.replaceChild(new_node, old_node);

            // If new_node is reusing an elem from the old vdom, mark it as removed
            if(matching_vdom !== null) matching_vdom.parent = null;

            // Mark the replaced node as removed
            if(old_vdom !== null) old_vdom.parent = null;
            ++new_index;
            ++old_index;
            
        } else {
            // Do not remove elems that have already been used elsewhere
            old_node !== null 
                && old_vdom !== null
                && old_vdom.parent !== null
                && root_node.removeChild(old_node);

            // Mark the replaced node as removed
            if(old_vdom !== null) old_vdom.parent = null;
            ++old_index;
        }
    }
}

const keyOf = (vdom: Vdom | null) => 
    vdom !== null
        && (vdom._type === VDOM_FUNCTIONAL || vdom._type === VDOM_NODE)
        && vdom.key !== undefined
    ? vdom.key
    : null;
