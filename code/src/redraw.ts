import {VdomNode, Vdom} from "./vdom";

export function redraw(vdom: Vdom) {
    // TODO: Redraw only 60 times per second
    if(vdom.parent !== null && typeof vdom.value !== "function") {
        redraw(vdom.parent);

    } else {
        const new_vdom = typeof vdom.value === "function"
            ? vdom.value()
            : vdom;

        update(vdom, new_vdom);

        // Fix references so new_vdom data is referenced the same as vdom
        Object.assign(vdom, {
            elem: new_vdom.elem,
            node: new_vdom.node
        });

        if (new_vdom.node !== null && typeof new_vdom.node === "object") {
            new_vdom.node.children.forEach(child => child.parent = vdom);
        }

        // Bind result to parent elem
        if(vdom.parent !== null) {
            rebindChildren(vdom.parent);
        }
    }
}

function rebindChildren(vdom: Vdom) {
    if (typeof vdom.value === "object" && vdom.elem !== null) {
        vdom.elem.childNodes.forEach(child => child.remove());
        vdom.value.children.forEach(child => {
            if (child.elem !== null && vdom.elem !== null) {
                vdom.elem.appendChild(child.elem)
            };
        });
    }
}

function update(vdom: Vdom | null, new_vdom: Vdom) {

    // Strings are handled as children only, so update shouldn't be called on
    // string vdoms
    if (typeof new_vdom.value === "string") {
        throw new Error("Cannot update vdom with string.");

    // If the old DOM elem doesn't exist, create a brand new one
    } else if (vdom === null || vdom.node === null || vdom.elem === null) {
        createFromVdom(new_vdom);

    // If there is a previous DOM elem, find the most eficient way to
    // change it to match the new vdom
    } else {
        // TODO: make this efficient. Currently just recreates all children
        if (vdom !== new_vdom) {        // Prune tree down when same vdom returned on successive function calls
            createFromVdom(new_vdom);
        }
    }
}

// Ensure that the VdomNode has been instantiated, then create
// the DOM elem and child DOM elems
function createFromVdom(vdom: Vdom) {
    lazyNodeInstantiate(vdom);
    const node = ensureHasVdomNode(vdom);

    vdom.elem = elemFromNode(node, vdom);
    childElemFromNode(vdom, node);
}

function lazyNodeInstantiate(vdom: Vdom) {
    if (vdom.node === null) {
        if (typeof vdom.value !== "function") {
            throw new Error("Vdom node not initialized");
        }
        vdom.node = vdom.value().node;
    }
}

function ensureHasVdomNode(vdom: Vdom): VdomNode {
    if (vdom.node === null || typeof vdom.node === "string") {
        throw new Error("Invalid Vdom node value");
    }

    return vdom.node;
}

// Create a fresh DOM elem from a VdomNode
function elemFromNode(node: VdomNode, vdom: Vdom) {
    if (node.tag === "") {
        throw new Error("Invlaid tag");
    }

    const elem = document.createElement(node.tag);
    setAttributeIfExists(elem, "id", node.id);
    elem.className = node.classes.join(" ");

    Object.keys(node.attributes).forEach(key => {
        if (node.attributes.hasOwnProperty(key)) {
            if (typeof node.attributes[key] === "function") {
                elem.addEventListener(eventName(key), (evt: Event) => {
                    node.attributes[key](evt, vdom);
                    redraw(vdom);
                });

            } else if (node.attributes[key] !== false) {
                elem.setAttribute(key, node.attributes[key]);
            }
        }
    });
    
    return elem;
}

// Instantiate and bind the DOM elems of the children to the vdom's elem
function childElemFromNode(vdom: Vdom, node: VdomNode) {
    if (vdom.elem === null) {
        throw new Error("Vdom elem is null");
    }

    for(const child of node.children) {
        // Bind parent
        child.parent = vdom;

        // Handle string children. There can only be one child if using this
        if(typeof child.value === "string") {
            if(node.children.length > 1) {
                throw new Error("Elements may have only one child string");
            }
            vdom.elem.textContent = child.value;

        // Handle function and instantiated vdom children recursively
        } else {
            // Pass null as old vdom so new elem is created
            update(null, child);
            if (child.elem !== null) {
                vdom.elem.appendChild(child.elem);
            }
        }
    }
}

function setAttributeIfExists(elem: HTMLElement, attribute: string, value: string | undefined) {
    if (value !== undefined) {
        elem.setAttribute(attribute, value);
    }
}

// function updateVdom(old_vdom: Vdom, new_vdom: Vdom) {
//     if (old_vdom.node === null || new_vdom.node === null || typeof old_vdom.node === "string" || typeof new_vdom.node === "string" ) {
//         throw new Error("attempting to update a null vdom");
//     }

//     if (old_vdom.elem === null) {
//         throw new Error("Attempting to update null elem");
//     }

//     // Tag: jsut recreate
//     if (old_vdom.node.tag !== new_vdom.node.tag) {
//         return createFromVdom(new_vdom);
//     }

//     // ID
//     if (old_vdom.node.id !== new_vdom.node.id) {
//         if (new_vdom.node.id !== undefined) {
//             old_vdom.elem.setAttribute("id", new_vdom.node.id);
//         } else {
//             old_vdom.elem.removeAttribute("id");
//         }
//     }

//     // Classes
//     if (old_vdom.node.classes.join(" ") !== new_vdom.node.classes.join(" ")) {
//         old_vdom.elem.className = new_vdom.node.classes.join(" ");
//     }

//     // Attributes: Remove attr on old not on new
//     Object.keys(old_vdom.node.attributes).forEach(key => {
//         if (old_vdom.node === null || new_vdom.node === null || typeof old_vdom.node === "string" || typeof new_vdom.node === "string") {
//             throw new Error("Vdom node is null");
//         }

//         if (old_vdom.elem === null) {
//             throw new Error("Attempting to update null elem");
//         }

//         if (old_vdom.node.attributes[key] !== new_vdom.node.attributes[key]) {
//             if (typeof old_vdom.node.attributes[key] === "function") {
//                 old_vdom.elem.removeEventListener(eventName(key), old_vdom.node.attributes[key]);
//             } else {
//                 old_vdom.elem.removeAttribute(key);
//             }
//         }
//     });

//     // Attributes: add attr on new not on old
//     Object.keys(new_vdom.node.attributes).forEach(key => {
//         if (old_vdom.node === null || new_vdom.node === null || typeof old_vdom.node === "string" || typeof new_vdom.node === "string") {
//             throw new Error("Vdom node is null");
//         }

//         if (old_vdom.elem === null) {
//             throw new Error("Attempting to update null elem");
//         }

//         if (old_vdom.node.attributes[key] !== new_vdom.node.attributes[key]) {
//             if (typeof new_vdom.node.attributes[key] === "function") {
//                 old_vdom.elem.addEventListener(eventName(key), new_vdom.node.attributes[key]);
//             } else if (new_vdom.node.attributes[key] !== false) {
//                 old_vdom.elem.setAttribute(key, new_vdom.node.attributes[key]);
//             }
//         }
//     });

//     // Collect old children
//     const old_elem_children: Element[] = [];
//     for (let i = 0; i < old_vdom.elem.children.length; ++i) {
//         const elem = old_vdom.elem.children.item(i);
//         if (elem !== null) {
//             old_elem_children.push(elem);
//         }
//     }

//     // TODO: Not correct
//     for(let i = 0; i < old_vdom.node.children.length; ++i) {
//         const old_child = old_vdom.node.children[i];
//         const new_child = new_vdom.node.children[i];
//         if (old_child.node == new_child.node) {
//             update(old_child, new_child);
//         } else {
//             old_elem_children[i].remove();
//             update(null, new_child);
//         }
//     }

//     new_vdom.elem = old_vdom.elem;
// }

function eventName(key: string) {
    const regex_result = key.match(/on([\w]+)/);
    if(regex_result === null || regex_result.length < 2) {
        throw new Error(`Invalid handler: ${key}`);
    }
    return regex_result[1];
}

// function diff<ElemType>(a: ElemType[], b: ElemType[], compare: (a: ElemType, b: ElemType) => boolean = (a, b) => a === b) {
//     compare(a[0], b[0])
// }