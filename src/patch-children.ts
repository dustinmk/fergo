import {Vdom, BindPoint} from "src/vdom";
import {invariant} from "src/invariant";
import update from "src/update";

interface Keyed {
    [index: string]: PairedDOM;
}

type Unkeyed = Array<PairedDOM>;

interface PairedDOM {
    dom_index: number | null;
    new_dom: Node | null;
    old_vdom: Vdom | null;
    new_vdom: Vdom | null;
    children: PairedDOM[] | null;
}

// Pair new nodes with old nodes, recursively on fragments
// Pair DOM elements with flattened list of old nodes
export const patchChildren = (elem: Node, bindpoint: BindPoint, old_children: Vdom[], new_children: Vdom[]) => {

    if (new_children.length === 1) {
        const first_child = new_children[0];
        if (first_child._type === "VdomText"  && old_children.length === 1 && old_children[0]._type === "VdomText") {
            elem.textContent = first_child.text;
            return elem;
        }
    }

    // Call this once at root
    const paired_old_children = pairVdomWithDOM(0, old_children)[1];

    // Call this for each recurse
    const matched_vdoms = matchNewWithOld(elem, [], paired_old_children, new_children);

    const old_child_doms = matchPairsToDOM([], paired_old_children);

    // At root, update each of matched_vdoms
    const new_child_doms = updateVdoms(elem, bindpoint, matched_vdoms);

    // Finally, patch element children with generated doms
    patchDOMChildren(elem, old_child_doms, new_child_doms);

    return elem;
}

// Rebuild old_vdom with vdom, dom_index pairs
const pairVdomWithDOM = (dom_index: number, vdoms: Vdom[]): [number, PairedDOM[]] => {
    const buildPairedDOM = (old_vdom: Vdom | null, children: PairedDOM[] | null, dom_index: number | null) => {
        return {
            old_vdom: old_vdom,
            new_vdom: null,
            children: children,
            dom_index: dom_index,
            new_dom: null
        };
    }

    const result: PairedDOM[] = [];
    for (const vdom of vdoms) {
        if (vdom._type === "VdomNull") {
            result.push(buildPairedDOM(vdom, null, null));

        } else if (vdom._type === "VdomFragment") {
            const [new_dom_index, children] = pairVdomWithDOM(dom_index, vdom.children)
            dom_index = new_dom_index
            result.push(buildPairedDOM(vdom, children, null));

        } else {
            result.push(buildPairedDOM(vdom, null, dom_index++));
        }
    }
    return [dom_index, result];
}

const matchPairsToDOM = (flattened: PairedDOM[], paired_dom: PairedDOM[]) => {
    paired_dom.forEach(dom => {
        if (dom.children !== null) {
            matchPairsToDOM(flattened, dom.children);
        } else if (dom.dom_index !== null) {
            flattened.push(dom);
        }
    });

    return flattened;
}

const splitKeyed = (paired_children: PairedDOM[]) => {
    const keyed: Keyed = {};
    const unkeyed: Unkeyed= [];
    for (const old_pair of paired_children) {
        
        if (old_pair.old_vdom !== null && old_pair.old_vdom._type !== "VdomNull") {

            const key = keyOf(old_pair.old_vdom);
            if (key !== null) {
                invariant(!(key in keyed), "Keys must be unique in a fragment");
                keyed[key] = old_pair;
            } else {
                unkeyed.push(old_pair);
            }
        }
    }

    return [keyed, unkeyed] as [Keyed, Unkeyed]
}

const matchNewWithOld = (elem: Node, matched_vdoms: PairedDOM[], paired_old_vdoms: PairedDOM[], new_vdoms: Vdom[]): PairedDOM[] => {
    const [keyed, unkeyed] = splitKeyed(paired_old_vdoms);

    // Call for each recurse
    let unkeyed_index = 0;
    for (const new_vdom of new_vdoms) {

        // Find paired_vdom for new_vdom
        const key = keyOf(new_vdom);
        const paired_vdom = key !== null && keyed.hasOwnProperty(key)
            ? keyed[key]
            : unkeyed_index < unkeyed.length
                ? unkeyed[unkeyed_index++]
                : {old_vdom: null, children: null, dom_index: null, new_vdom, new_dom: null};
        paired_vdom.new_vdom = new_vdom;

        if (paired_vdom.old_vdom === null) {    
            matched_vdoms.push(paired_vdom);

        } else {
            const old_children = paired_vdom.old_vdom._type === "VdomFragment"
                ? paired_vdom.children === null ? [] : paired_vdom.children
                : [];
            const new_children = new_vdom._type === "VdomFragment"
                ? new_vdom.children
                : [];

            if (old_children.length > 0 || new_children.length > 0) {
                matched_vdoms = matchNewWithOld(elem, matched_vdoms, old_children, new_children);

                if (new_children.length <= 0) {
                    matched_vdoms.push(paired_vdom);
                }

            } else {
                matched_vdoms.push(paired_vdom);
            }
        }
    }

    // Call remove hooks for ignored keys
    for (const key in keyed) {
        if (keyed.hasOwnProperty(key) && keyed[key].new_vdom === null) {
            const dom_index = keyed[key].dom_index;
            if (dom_index !== null) {
                update(getChild(elem, dom_index), keyed[key].old_vdom, null, null);
            }
        }
    }

    while (unkeyed_index < unkeyed.length) {
        const removed_child = unkeyed[unkeyed_index];
        if (removed_child.dom_index !== null) {
            update(getChild(elem, removed_child.dom_index), removed_child.old_vdom, null, null);
        }
        ++unkeyed_index;
    }

    return matched_vdoms;
}

const updateVdoms = (elem: Node, bindpoint: BindPoint, matched_vdoms: PairedDOM[]) => {
    return matched_vdoms.map(paired_vdom => {
        paired_vdom.new_dom = update(
            paired_vdom.dom_index === null
                ? null
                : getChild(elem, paired_vdom.dom_index),
            paired_vdom.old_vdom,
            paired_vdom.new_vdom,
            bindpoint
        )
        return paired_vdom;
    });
}

// According to flattened old_vdom_children
const patchDOMChildren = (elem: Node, old_children: PairedDOM[], new_children: PairedDOM[]) => {
    let old_index = 0;
    let new_index = 0;

    const old_dom = getChildNodes(elem)

    while (new_index < new_children.length) {
        const old_child = old_index < old_children.length
            ? old_children[old_index]
            : null;
        const new_child = new_index < new_children.length
            ? new_children[new_index]
            : null;
        const next_index = findFirstFrom(child => child !== null && child.dom_index !== null, old_index, old_children) || null;

        const next_node = next_index !== null && next_index.dom_index !== null 
            ? old_dom[next_index.dom_index]
            : null;
        const new_node = new_child !== null
            ? new_child.new_dom
            : null;
        const old_node = old_child !== null && old_child.dom_index !== null
            ? getChild(elem, old_child.dom_index)
            : null;

        if (new_node === null) {
            next_node !== null && elem.removeChild(next_node);

        } else if (next_node === null || old_node === null) {
            elem.insertBefore(new_node, next_node);
            if (new_child !== null) new_child.dom_index = null;

        } else if (new_node !== next_node && new_node !== null && next_node !== null) {
            elem.replaceChild(new_node, next_node);
            if (new_child !== null) new_child.dom_index = null;
        }

        if (old_child !== null) {
            old_child.dom_index = null;
        }

        ++new_index;
        ++old_index;
    }

    while (old_index < old_children.length) {
        const old_child = old_children[old_index];
        if (old_child !== null && old_child.dom_index !== null) {
            elem.removeChild(old_dom[old_child.dom_index]);
        }
        ++old_index;
    }
}

const keyOf = (vdom: Vdom | null) => {
    if (vdom === null) {
        return null;
    }

    if (vdom._type === "VdomNode" && vdom.attributes.key !== undefined) {
        return vdom.attributes.key;
    }

    if (vdom._type === "VdomFunctional" && vdom.key !== undefined) {
        return vdom.key;
    }

    return null;
}

const findFirstFrom = <ValueType>(predicate: (item: ValueType) => boolean, start: number, array: ValueType[]) => {
    for (let i = start; i < array.length; ++i) {
        if (predicate(array[i])) {
            return array[i];
        }
    }

    return undefined;
}

const getChildNodes = (elem: Node) => {
    const children: Node[] = [];
    elem.childNodes.forEach(child => children.push(child));
    return children;
}

const getChild = (elem: Node, index: number) => {
    return elem.childNodes.item(index);
}