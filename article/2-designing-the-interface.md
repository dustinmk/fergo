---
title: Designing a Virtual DOM Browser UI Framework
---

Declarative UI programming has been popular for well over a decade and it doesn't have to be difficult to implement or be large in size. A declarative UI framework allows application UIs to be written without immediate regard for managing application state, separating the logic an data in an application from how it is represented. 

This article will walk through the design process of designing and implementing a declarative UI framework for the web browser or similar HTML/JavaScript based platforms. The framework will be designed to be small and flexible: with a minimal learning curve and code footprint, yet compatible with most popular web UI architectural patterns. Details regarding tests, mundane code will be skipped and deferred to the source code in order to give a clearer view of the process and design. However, the design will be thorough and could be made production ready with sufficient environmental testing. Many similar frameworks exist with similar goals and will be far more suited to production use being more reliable, complete, maintained, and with a bigger ecosystem, such as Maquette, Mithril, and virtual-dom.

To maintain good performance in the browser, most declarative JavaScript UI frameworks use a parallel lightweight version of the document called a *virtual DOM* or *v-DOM*. The browser immediately re-renders the document every time a change is made to the document to ensure that reads from the DOM are up to date with writes to it. For example, the `inner_width` variable in the following code:

```js
document.body.width = "400px";
const inner_width = document.body.innerWidth;
```

would be expected to have the correct size, already adjusted for any other CSS styles and surrounding elements. Making a large number of changes to the DOM can therefore be quite performance intensive. Instead, a parallel DOM is created, often of plain JavaScript objects, that record enough information to recreate the DOM from but minimizing the cost in manipulating them. The *v-DOM* nodes can be manipulated or even completely recreated, and a smart algorithm can compare the old *v-DOM* and new *v-DOM* to find the smallest amount of changes required to bring the actual DOM up to date.

# Designing the Virtual DOM

An interactive application will have it's state changed over time, and it is good design to separate this state from the visual representation of it. With a *v-DOM* framework, it should be possible to write visual representation in a static structure, like a template, but perhaps allowing conditional elements and mapped lists of elements. The simplest method of separating state from the *v-DOM* declaration, at least from the user's perspective, is to have the *v-DOM* redrawn whenever the state changes.

In a graphical UI, most state changes arise from user input. Since the framework handles the UI input, the *v-DOM* redraw can be triggered whenever a UI action completes. For any other case, the user can be allowed to manually trigger a redraw. When the *v-DOM* is redrawn, an algorithm can be compare it to the old version and find the minimal number of changes required to the actual *DOM*, and then apply them. Since manipulating the *v-DOM* is relatively fast, there shouldn't be any major performance problems outside of extreme cases.



# Implementing the Virtual DOM

## v()

## mount()

## redraw()

## diff()

## update()




# Pruning the Redraw Tree with Deferred Components

An unmanaged state solution as described so far will be sufficiently performant for most cases. While the *v-DOM* paradigm is much faster than using the *DOM* directly, it still performs a large number of computations when the DOM is updated frequently, is comprised of very large lists, or is comprised of deep, complicated nodes. Mobile devices may have limited processing power and using more of it drains the battery faster. It might be worth the effort to attempt to reduce the number of computations which can be justified by measuring performance improvements using a new state management method.

The most immediate way of reducing the number of computations is to only update relevant parts of the *v-DOM* tree when the application state changes rather than redrawing the entire tree. This will, however, require that the application somehow keeps track of which changes in application state correspond to which nodes need updating. The the component managing the state can then trigger a manual redraw on its managed *v-DOM* node, ensuring that no other nodes are redrawn. This concept is a compromise since it reduces the declarativeness of the view. It will no longer be immediately clear what will be rendered given a series of inputs since the view is no longer a pure function.

## State Management Patterns

Thankfully, there are several popular state management patterns which are easy to adopt in the framework. 

## Pruning up the tree

The process of redrawing the *v-DOM* from a triggered node can be represented as a tree. The calls to other nodes are edges, and the redraw calls themselves are the nodes. The leaves are the nodes that don't update any children. In an unmanaged state paradigm, a redraw call on a node should propagate to the root of the tree and then have the entire tree replaced. 

To reduce this, the top of a component needs to be marked in some way. This can be done with a flag value on the *v-DOM* node itself, but a more flexible method is to flag it with a *v-DOM* node creator function that takes no arguments. This function can be a closure that the users can store state related to the view inside. Conveniently, this function looks like the one used in the `mount()` call used to redraw the *v-DOM* from the root. It would be good to still support plain *v-DOM* objects to reduce the number of function calls required when rendering the *v-DOM*. The `redraw()` call propagation to the parent can then easily be stopped if the current node is a functional node.

## Pruning down the tree

Since nodes can be functions, nodes can have children that are functions. These provide natural barriers in propagating the `redraw()` call down the tree since those children will update themselves. However, a node with functional children can replace its children, so there must be a way to determine if they have changed. One convenient method is to call these functional components and check if the instance of the child's root *v-DOM* has changed. If it changed, then the `redraw()` call may be propagated. If it didn't change, then it will be assumed that the child handles any necessary changes itself and the `redraw()` call does not need to be propagated.

This method needs care in implementation. One problem that may arise is that if the returned *v-DOM*s from a functional component are compared with shallow value-equality, a child component may return the a similar root *v-DOM* but be very different:

```HTML
<!-- BEFORE -->
<div id="navbar">
    <div>
        <p>"Login Here"</p>
    </div>
</div>

<!-- AFTER -->
<div id="navbar">   <!-- Root is value-equal to before -->
    <!-- Contents are very different -->
    <div>
        <ul>
            <li>Menu 1</li>
            <li>Menu 2</li>
            <li>Menu 3</li>
        </ul>
    <div>
</div>
```

The `redraw()` call must obviously be propagated down in this case, but wouldn't occur if the root nodes are compared for the same tag, children, and attributes. A more restrictive requirement of the successive return values of functional components is required. Since the functional components are closures, they are capable of remembering the last *v-DOM* they produced and always return the same instance. If the instance needs to be updated, the *v-DOM* instance can be replaced and returned. For example:

```js

// Child component closure
function makeSomeComponent() {
    const render = (value) =>
        v("div", [
            v("p", value),
            v("button", {
                onclick: () => view = render("false")
            })
        ]);

    view = render("false");

    return () => view;
}

// Instantiate the child component
const child_component = makeSomeComponent();

// Parent component mounted to document
mount(document.body, () =>
    v("div", [
        v("", "HEADER"),
        child_component
    ])
);
```

The view is given a default value and is replaced when the button is clicked, but the parent component will only have the one function as a child which is not changed. The child updates itself from user interaction and the parent doesn't need to be influenced.

If the parent is redrawn, the child will not be redrawn since it exists in the parent component function's closure. It's returned *v-DOM* will simply be reused in the new parent *v-DOM* tree.


## Deferred Components

It would be cleaner and more convenient if the static components could be declared inline with the static *v-DOM* components like so:

```js
() =>
    v("div", [
        v("", "HEADER"),
        makeSomeComponent()
    ])
```

[TODO: Explain more]
However, this would cause the child component to be recreated every time the parent redraws. To avoid this, the *v-DOM* can be created once and returned every time the component function is called:

```js
const makeParentComponent = () => {
    const view = v("div", [
        v("", "HEADER"),
        v("p", state_value),    // Only called once
        makeSomeComponent()
    ]);

    return () => v;
}
```

Any explicitly static *v-DOM* nodes will however not be able to change based on external state. A solution is to write similar functional components which will be called on a redraw:

```js
const makeParentComponent = () =>
    const view = v("div", [
        v("", "HEADER"),
        () => v("p", state_value),  // Called on every redraw
        makeSomeComponent()
    ]);

    return () => v;
```

However, any child components of the functional component will now be recreated on a redraw. This is similar to the problem that was just solved, so one solution would be to remove the functional component into its own function. This can be done inline by using an immediately executed inline function (IIFE).

```js
const makeParentComponent = () =>
    const view = v("div", [
        v("", "HEADER"),
        (() => {
            const expensive = createExpensiveComponent();

            return () => conditional 
                ? v("div", [
                    v("p", value_1)]) 
                : expensive
        })(),
        
        makeSomeComponent()
    ]);

    return () => v;
```

The main difficulty in cleaning this code by removing the closure-scope `expensive` variable in the local closure scope is the conditional. Any way the `createExpensiveComponent()` function is called inside the function component, it can't be made to be called only once unless it tracks how many times it was called. Since many of these expensive components may need to be called, tracking this in module scope will be difficult at best. Tracking it in the local closure scope forces variables to be declared in it, and therefore leads to the same problem. A simple LISP-like conditional function can be written to easily deal with this:

```js
const cond = (condition, if_true, if_false) =>
    () => condition() ? if_true : if_false

const view = defer(v("div", [
    v("", "HEADER"),
    cond(() => condition,
        v("div", [ () => v("p", value_1) ]),
        createExpensiveComponent()
    ),
    makeSomeComponent()
]));
```

Another problem arises with conditionals: both of the results are created, even when only one is necessary. The instantiation of each component can be delayed quite simply:

```js
const lazy = (component) => {
    let instantiated = null;

    return () => {
        if (instantiated === null) {
            instantiated = component();
        }
        return instantiated;
    }
}

const view = defer(v("div", [
    v("", "HEADER"),
    cond(() => condition,
        // Now each vdom will only be created when needed
        lazy(v("div", [ () => v("p", value_1) ])),
        lazy(createExpensiveComponent())
    ),
    makeSomeComponent()
]));
```

If it becomes common to have both `cond()` arguments lazily created, both functions can be combined:

```js
const lazycond = (condition, if_true, if_false) =>
    cond(condition, lazy(if_true), lazy(if_false))
```

To clean up the code, a simple function can be introduced that forwards ... [TODO]

```js
const defer = (value) => {
    if (typeof value === "function") {
        // Handle IIFEs
        const ret = value();
        return () => ret
    } else {
        // Defer values
        return () => value;
    }
}

const makeParentComponent = defer(
    v("div", [
        v("", "HEADER"),
        () => v("div", [
            conditional 
                ? v("div", [
                    v("p", value_1)]) 
                : v("p", "No text")
            ])
        )
        makeSomeComponent()
    ])
)
```


## Arrays

One way to render a list of items is to map the plain JS representation into an array of *v-DOM* nodes and have the resulting array become the child of a root node:

```js
() => v("ul", items.map(item => v("li", item)))
```

When the value of `items` changes, the component can be redrawn and all of the child elements may be recreated. To improve performance for large lists or complex list nodes, the list *v-DOM* nodes should be retained and reused for as long as possible. A copy of list of items from the last render should also be retained so that it will be fast to find out what has changed since. This can be stored in the component's closure.

```js
const makeComponent = () => {
    let last_items = [];
    const item_vnodes = [];

    const updateItems = (items) = { /* ... */ }

    return () => {
        updateItems(items); // Update last_items and item_vnodes base on new items
        return v("ul", item_vnodes)
    };
}
```

A function, `updateItems()` is run every time the component is drawn that finds the differences between the last copy of the items and the newest copy of the items. It then modifies the `item_vnodes` array and replaces `last_items` with the new copy. The component can then use the updated `item_vnodes` to redraw the list.

This behaviour can be wrapped into a higher order component that accepts a couple functions:

```js
const list = (items, draw_children, draw_parent) => {
    let last_items = null;
    const item_vnodes = [];

    const updateItems = (items) = {
        // use draw_children(item)
    }

    updateItems(items());

    return () => {
        updateItems(items())
        return draw_parent(item_vnodes);
    }
}

const makeComponent = () => {
    const items = [];
    return list(() => items, item => v("li", item), children => v("ul", children);
}
```

The `draw_parent` callback can be extracted for more flexibility if `v()` is modified to handle functions that may return arrays of *v-DOM* nodes:

```typescript
type Vnode = string | undefined | Vnode[] | () => Vnode | () => Vnode[];
function v(/* ... */ () => Vnode[]);
```

The `list()` creator can then simply return the `item_vnode` list rather than a complete component:

```typescript
const list = (items: () => Item[], to_vdom: item => Vdom) => {
    // ...

    return () => {
        updateItems(items())
        return item_vnodes;
    }
}

() => v("div", [
    v("ul", [
        list(items, item => v("li", item))
    ]),
    v("button", {onclick: () => {
            items.push(some_string());  // The state manager will handle the redraw() trigger
        }
    })
])
```

The extra array around the `list()` call is extraneous if there are not other children, so `v()` can be made to handle a single array-returning function as well:

```js
defer(v("ul", 
    list(items, item => v("li", item))
))
```

## Conclusion

Several helpers have been added in the name of performance and are stylistically functional: `defer()`, `lazy()`, `cond()`, and `list()`. The `v()` function has also been amended to be much more flexible. JavaScript is not always convenient to use in a functional way however, so in some instances, this design may impede more than help. Also, the unmanaged pattern will likely be performant enough in most situations, but these few functions show how performance can be easily improved. The actual performance gains will be measured in later sections. 



# Supporting Publish-Subscribe State Management

## Publish-Subscribe Variants

## Vertical State Management

## Component Class

```typescript
class Component {
    private view_component;

    protected abstract render();

    public view() {
        return this.view_component;
    }
}

class SomeComponent extends Component {
    public render() {
        
    }
}

```

## Arrays



# Supporting Flux State Management

## Dispatch

## Bind




# Supporting Reactive State Management



# Implementing a Router



# Measuring and Comparing Performance