---
title: Designing a Virtual DOM Browser UI Framework
---

Declarative UI programming has been popular for well over a decade and it doesn't have to be difficult to implement or be large in size. This process will walk through the design process of designing and implementing a declarative UI framework for the web browser or equivalent platforms. This framework will have the objective to be small and flexible: with a minimal learning curve and code footprint, yet compatible with most popular web UI architectural patterns. Some code size and readability will be compromised for performance in well isolated, generic algorithms and data structures. Details regarding tests, mundane code will be skipped and deferred to the source code in order to give a clearer view of the process and design. However, the design will be thorough and could be made production ready with sufficient environmental testing. Many similar frameworks exist with similar goals and will be far more suited to production use being more reliable, complete, maintained, and with a bigger ecosystem, such as Maquette, Mithril, and virtual-dom.

The web browser DOM API is not immediately conducive to declarative programming since all actions on it, such as adding and removing nodes, changing classes, and changing sizes are immediately applied. Some performance gain can be had by manipulating a DOM detached from the document so that it isn't rendered, then re-attaching it. This becomes difficult to do manually so it naturally should be abstracted. 

Two principal methods to abstract these operations are using virtual DOMs, lightweight JavaScript objects that represent DOM nodes, and wrapped DOM nodes. Virtual DOMs are constructed in parallel to the DOM and are manipulated and compared to find the most efficient method of updating the real DOM to match the declarative description by the user. These frameworks will normally have uni-directional databinding, where changes in the contents of the DOM, including inputs, must be handled through events. Wrapped DOM frameworks extend the interface of a DOM element by composition so that they may be used more efficiently. Such frameworks often provide bi-directional data binding since it is much more natural to implement in such a design. This article will focus on the design of a virtual DOM framework.


# Designing for Common State Patterns

There are many virtual DOM frameworks available, so a number of common patterns of state management have appeared. Perhaps the simplest approach is a stateless design where the entire virtual DOM is re-created whenever there is a state change. This is the approach favoured by Mithril and Maquette. At the end of DOM event handlers, a redraw function is called that calls a root rendering function, producing a new copy of the virtual DOM. The old virtual DOM and the new virtual DOM are deeply compared by value, and actual DOM nodes are either replaced or modified as needed. This approach is much faster than recreating the actual DOM, but it can be faster. 

The process of re-rendering the virtual DOM can be viewed as a tree, with each component as a node and the edges representing a parent-child relationship. An event starts at a node, bubbles up or skips to the root node, and then the tree is traversed, rendering the new virtual DOM for each node. It is clear that to improve performance, the tree can be pruned either when bubbling up and when being traversed down.

One of the most common patterns with React-like frameworks are variants of the Flux architecture, including Redux [todo: link]. Application state is represented as an immutable tree structure which is updated with pure-functional reducers. The reducers take the previous state and an action to produce a new state. Actions are usually simple messages but can have side effects such as interacting with an external API. The DOM is rendered declaratively, and components are re-rendered when the parts of the state it depends on is updated. Components which did not have their bound state changed are pruned from the re-rendering tree.

Another common family of approaches is using a form of event messaging or publish-subscribe. Components retain state internally and through some means offer callbacks to other components that depend on that state. The callbacks can then either redraw the components or fire other events. One approach, close to the traditional observer pattern, has components directly accepting callbacks using either a composed or inherited event dispatcher interface. Another approach is to have an external event bus to which components register, approximating the publisher-subscriber pattern. In these patterns, nodes join themselves manually to the redraw tree and are otherwise pruned by default.

React uses a more restrictive variant of the publish-subscribe family of patterns, allowing messages to pass only vertically in the parent-child tree so that the data flow is easier to think about. A component can initiate a re-render on itself by modifying its state with a call to `setState()` on itself. Components directly offer callbacks to immediately higher components only, which is the only way a re-render event may propagate upwards. The parent component may call setState on itself to re-render itself. Child components listen to their parents by re-rendering when the parent's inputs to the children are changed (the props). If the child's inputs aren't changed, it along with all of its children are pruned from the redraw tree. The children can add more behaviour to this through lifecycle hooks.

Reactive UI programming has also become popular. It has many similarities to the publish-subscribe family of patterns, but doesn't retain state outside of event handler closures. Angular 2+ adopted reactive programming as the canonical way of building with it. [TODO: MORE]

This design will consider these five common state management patterns, and hopes to be used with more by providing a simple and flexible interface.

## Fulfilling the Stateless State Management Pattern

[TODO: MORE] The interface needs something that produces a virtual DOM node, so for now, let that be function `v()`. The user will need to specify the tag, attributes, and children in a node, so this function can have arguments for them: `v(tag, attributes, children)`, where attributes is an object and children is an array. This does not necessarily have to be a function; it can be a class, plain object, or anything else that can take properties of a DOM node, but a function is both simple and flexible enough for the interface's needs.

Fulfilling the stateless state management pattern is simple in this case. The top render function simply calls `v()` for the root element, and calls other functions that returns the results of other calls to `v()` as its children. A `mount()` function can take this render function and a plain DOM node and replace the DOM node with the resulting rendered virtual DOM.

```javascript
mount(document.getElementById("root"), topComponent);

function topComponent() {
    return v("div", {}, [
        childComponent1(properties...),
        childComponent2(properties...)
    ])
}

function childComponent(properties) {
    return v("p", {}, [properties.text])
}

// and so on
```

DOM events can will call an `redraw()` function on the virtual DOM node that will propagate to the root node. The top render function can then be called, the new virtual DOM created, and the actual DOM adjusted to match.

```javascript
// Call redraw manually,
v("button", {onclick: vdom => redraw(vdom)})

// or the handler calls redraw(vdom) after the promise resolves
v("button", {onclick: () => return Promise(...)}) 
```

Arrays can be rendered by simply mapping the data to virtual DOM elements:

```javascript
v("ul", items.map(item => v("li", item)))
```

Conditional nodes can be selected out by returning null or undefined:

```javascript
v("div", [
    condition ? v("p", "enabled") : null
])
```

## Fulfilling the Flux Pattern

The Flux patterns are very similar to the stateless patterns from the viewpoint of the view framework since the view is stateless in both. However, the view components need to be transparently bound to the store so that they are recreated when needed. A store can be created with a `store()` function like so:

```javascript
const s = store(initial_state, reducer)
```

The store can receive actions which it provides to the reducer:

```javascript
s.dispatch(action)

store.dispatch = (action) => this.state = this.reducer(this.state, action)
```

Components must be bindable to a subset of the state of a store. When the state of the store changes, the component must re-render and be rebound to its parent. This is easy to do by wrapping a component with a new one:

```javascript
const component = store.bind(
    state => substate,  // state selector
    substate => v(...)  // component
)

const higher_component = () => v("div", [component])
```

The `dispatch()` function can issue the redraw call to every element for whose substate has been changed by the reducer. However, the redraw call should not propagate to the parents. Instead, the redrawn DOM should be reattached to its parent. This can be done by extending the interface of the framework with new functions, but there is a simpler way of dealing with this. 

The result of `bind()` can return a function `() => vdom` instead of an instantiated `vdom`. Now, the function returned by `bind()` can either return the same virtual DOM instance or a new one. The `redraw()` call can then be allowed to propagate up to the parent, but will have slightly modified behaviour. If a virtual DOM child is an instantiated `vdom`, then that `vdom` will be diffed as normal and the redraw tree will continue down. If the virtual DOM child is a function, the function is called and the redraw tree only continues down if the previous `vdom` is a different instance. The tree can then be pruned by simply returning the same instance as last time. 

The redraw call can propagate to the parents, but it should not propagate back down. Allowing functional virtual DOM children makes controlling this easier as well. The `mount()` call can wrap the top component in a root `vdom`. Passing a function to `mount()` will cause it to call the function on `redraw()`, but passing an instantiated `vdom` will do nothing. If a new `vdom` is returned by the component passed to `mount()`, the diff process will begin between the old and new versions.

This completes the behaviour required by the Flux pattern, and it turns out that the addition of functional components can be used to implement the other patterns as well.

## Fulfilling the Publish-Subscribe and Observer Patterns

The implementation of publish-subscribe 
```javascript
class Component {
    constructor(external_event) {
        this.vdom = render("default value");
        this.child_component = new ChildComponent();
        external_event.listen(value => this.vdom = this.render(value))
        this.elems = map(some_array, item => v("li", item));
    }

    view() {
        return this.vdom;
    }

    render(value) {
        return v("div", [
            () => this.child_component.view(),
            v("p", value),
            v("ul", some_array.map(item => v("li", item))
            v("ul", mapped_view(this.elems))
        ])
    }
}

function map(arr, f) {
    const mapped_elem = arr.map(item => ({
        item,
        elem: f(item)
    }));
}

function map_view(mapped) {
    return mapped.map(item => item.elem);
}

```

## Fulfilling Vertical Events State Management Pattern

Enforcing a React-style strictly vertical event propagation can be done very similarity to the above publish-subscribe solution. Instead of events, callbacks that eventually call `redraw()` can be passed to the children. One additional problem arises with this approach: The `redraw()` call will be propagated too all of a redrawn component's children. Since these components will inherit from a base class, it is however easy to resolve the problem. Much like in React, the props provided to a child can be compared by value by default to prevent a redraw. It would also be convenient to instantiate the child components inline in the `render()` function rather than somewhere else. A `component()` function can return a closure that instantiates the component once, and then replaces the `vdom` for it as needed.

```javascript
function component(Component, props) {
    if Component is class:
        const component = new Component(props);
        return () => component.view();
    else if Component is function:
        const component = Component();
        return () => component();
    else if Component is instantiated vdom:
        return Component;
    
}
```

```javascript
class Component {
    constructor(props) {
        this.props = props;
        this.state = {text: "no clicked"};
        this.vdom_creator = this.render();
        this.vdom = this.vdom_creator();
    }

    onClick = vdom => {
        this.state = {text: "clicked"};
        this.vdom = this.vdom_creator();
        redraw(vdom);
    }

    view() {
        return this.vdom;
    }

    render() {
        return component("div", [
            component("p", {
                onclick = this.onClick
            }, this.state.text),
            component(ChildComponent, {...props})
        ])
    }
}
```

## Fulfilling Reactive UI State Management

TODO

## High-Performance Arrays

A redrawn array will not have the same `Vdom` nodes as in the previous call, even though most of the nodes might be identical. The virtual DOM diff algorithm will minimize the real DOM changes, but it would be best if those checks could be pruned altogether. If the children of an array return closures rather than explicit `Vdom`s, this can be possible. However, each element of the

# Implementing the Virtual DOM

## v()

To keep the interface as simple as possible, virtual DOM nodes should be a simple plain object, and `v()` will take the user input to form one:

```typescript
interface Vdom {}
function v() => Vdom;
```

Since `v()` is the most used function, it should have a flexible interface. The user may want to omit attributes or children, and it should be easy to choose the tags, classes, and ids. The first parameter can be a CSS selector that will specify some properties of the node. An object can be passed to specify attributes, and an array can be passed to specify children:

```typescript
function v(selector: string);
function v(selector: string, attributes: object);
function v(selector: string, children: Array);
function v(selector: string, attributes: object, children: Array);
```

The `Vdom` object needs to record enough information to reliably diff the old and new versions of the DOM:

```typescript
interface Vdom {
    tag: string;
    classes: string[];
    attributes: object & Attributes;
    children: Child[];
    parent: Vdom | null;
}

interface Attributes {
    oninit: Vdom => void;
    onremove: Vdom => void;
    // ... HTML attributes
}

interface Child {
    child_value: Vdom | () => Vdom;
    vdom: Vdom;
}
```

The `parent` parameter can be passed to the child in the `v()` call:

```javascript
function v(selector, children)
    // ...
    vdom.children = children.map(child => {
        // if child is vdom
            child_vdom = child
        // if child is function
            child_vdom = child()
        child_vdom.parent = vdom
        return {
            child_value: child,
            vdom: child,
            element: null
        }
    })
```

## mount()

As discussed in [TODO: section], `mount()` will simply wrap the provided component, instantiate the real DOM by calling `redraw()`, and attach it to the attachment point provided.

```typescript
function mount(root: Element, vdom: Vdom | () => Vdom) {
    const root_vdom = v(root.tag, [vdom]);
    redraw(root_vdom);
    root.replace(root_vdom.children[0].element);
}
```

## redraw()

The `redraw()` function is the most complicated and most performance sensitive part of this design. It will handle performing a diff between `Vdom` trees, applying those changes to the actual DOM, and ensuring that a minimal number of virtual DOM nodes are re-rendered. It will need to traverse the tree both up and down.

In a stateless pattern, `redraw()` should do nothing except pass the message up the tree until it reaches the root node created by `mount()`. It should then call the function passed to `mount()` to create a fresh `Vdom` tree, diff the old tree and new tree, and apply the changes to the real DOM.

```typescript
function redraw(vdom) {
    // Propagate the redraw event up the tree
    // Pass this vdom to notify parent where the call comes from
    redraw(vdom.parent, vdom)

    // Propagate the redraw event down the tree, but don't redraw anything that is already done
    for (const child of vdom.children) {
        if (isFunction(child.child_value)) {
            const new_child = child.child_value();
            if (new_child !== child.vdom) {
                // Diff the vdom, patch the real dom
                update(child, new_child)
                child[index] = new_child;
            }
        }
    }
}

function update(old_vdom, new_vdom) {
    // Diff the old and new vdoms
    // Apply changes to the actual cached elements
}
```

This happens to produce the correct behaviour for the other patterns as well. The `redraw()` calls will propagate to the root node, but they won't propagate down unless the result of the `Vdom` creator functions returns a different result. The static `Vdom` nodes are already ignored.

However, if multiple disconnected nodes are changed on a single `redraw()` call, there is too much needless scanning of the children of the nodes near the root. It probably won't affect performance in most cases, but if there is a very large list at multiple levels, it could become a problem. If the child passes itself to the parent when propagating the `redraw()` event, things can be done more efficiently:

```typescript
function redraw(vdom, initiator) {
    if (DEBUG) {
        // Assert that `initiator` is a child of `vdom`
    }

    // Path this vdom with the child if it is different
    if (isFunction(initiator.child_value)) {
        const new_child = initiator.child_value();
        if (new_child !== initiator.vdom) {
            // Diff the vdom, patch the real dom
            update(child, new_child)
            children[indexOf(initiator)] = new_child;
        }
    } else {
        // Don't propagate to parent if initiator is a function - prune the
        // update tree above that.
        redraw(vdom.parent, vdom)
    }
}
```

All other children can be ignored until they ask for a redraw as well. Arrays and conditional nodes only change when a new `Vdom` is rendered, so `redraw()` can ignore those cases except during the `update()` call.

The new `Vdom` generated by a functional node will have zero or more children, which may be of a different number and order than the previous instantiation of the `Vdom`. Some of the children instances may be shared between the old and new `Vdom` if using a stateful state management pattern. An efficient diff algorithm can be used to determine the minimal number of changes needed to the DOM in linear time. Some nodes that are removed may be added back, so they can be cached through the update. Additionally, the attributes, tag, and classes, and event listeners may have changed for the node. These can be checked updated with simple value comparisons.

For a diff algorithm to work, nodes must be compared for equality efficiently. Comparing instances, while a good shortcut, may not provide the best performance since under a stateless system, nodes may be produced identically but be of different instances. This especially arises from non-functional explicit components, such as labels, headings, and div's. However in these cases, the number of attributes and classes are low, so value comparison should be relatively quick. Not being able to rely on solely comparing instances forces an non-matching components to be compared by value. This is not optimal, but it may be sufficient for these purposes. Attributes which are likely to change can be prioritised to make the comparisons shorter. Also, the differences can be cached while running the algorithm so that they can easily be changed once the diff is finished.

Many web UI frameworks use a `key` attribute to make comparisons faster in arrays. It is easy to add this as an option to the `Attribute` interface, and if it exists, will speed up the diff process. If the keys match, an exact match is assumed, and if the keys don't match, a match failure is assumed. This should not cause problems with consistency if the nodes change their representation since the `update()` call is propagated to all children. It only aids with minimizing the number of DOM nodes to create, destroy, and replace, and provides the best matches of old nodes to new nodes for comparison.



# Implementing State Management

## Flux

`createStore()`

`bind()`

`dispatch()`

## PubSub

`class Component`

## React

`createComponent()`

`class Component`

JSX Webpack Plugin


# Implementing A Router

# Implementing a Sample Application

# Measuring and Comparing Performance