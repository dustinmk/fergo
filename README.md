
# fergo ##########

**WARNING: not ready for production**

Fergo is a lightweight (4kB gzipped) and performant front end Typescript framework with minimal API and compatible with most popular data flow paradigms. It includes a router and supports flux, portals, higher order components, fragments, persistant state, reactive, publish-subscribe, JSX, and single-direction data binding with ease. Everything is a function that produces a simple object, keeping the framework out of the way. The Todo list sample is only 50 lines long and performance is superior to React while approaching InfernoJS. Event handlers are proxied so inline event handlers have minimal performance cost. Inspired by mithril (state management), maquette (style), and ivi (patch algorithm).



# Design ##########

## Event Handlers
A single persistant event handler is attached to any element's DOM events as required. The user-supplied event handling function is called by the persistant handler. On a redraw, the user-supplied function is rebound to the persistant handler which is a simple JS assignment, rather than the much more expensive DOM event handler rebinding operation. This allows the user to not worry about recreating JS handler function objects because the operation is cheap. For slightly extra performance (perhaps 10-20% in extreme cases), the user provided functions can be made persistant as in React at the expense of more convoulted code.

## Functional Components
To eliminate unnecessary redraws on child or sibling components, functional components are used to create boundaries. Any functional components matching during a patch that either have the same props (as checked by the `shouldUpdate()` hook), or return the same Vdom instance do not redraw. Redraws also only bubble up to the nearest functional component parent. Any redraws required outside of the component context need outside orchestration to redraw the components. This job is fulfilled by publish-subscribe, flux, and reactive patterns. Alternatively, fergo is fast enough to use without functional components at all in many cases so that the entire Vdom is redrawn on every event.

## Node Patch Algorithm
The optimal nodes selected to be replaced or updated are selected using the Longest Increasing Subsequence as presented in Michael Fredman's paper: https://www.sciencedirect.com/science/article/pii/0012365X7590103X. This is an `n log n - n log log n + O(n)` worst case algorithm and is optimized for speed using V8's packed SMI integer arrays. However, running this algoirthm is avoided as much as possible using keyed elements. Any elements that match by key and type at the beginning, end, or reverse are implicitly flagged as not requiring a reordering patch. They are scanned recursively like all other elements for differences, even if the keys match. Elements without a key have an implicit integer key by index.

Keys are used as JS Map indexes, so any object that can be used as a Map index can be used as a key. This includes strings, numbers, objects, and functions. On JS VMs without native Map support, polyfills normally implement Maps using linear time lookup in an array, so patch performance may be sub-par on older platforms.

Battery usage is conserved on mobile platforms by batching redraw calls together and executing them at most as quickly as `requestAnimationFrame()` allows, usually 60 FPS. 

## Virtual DOM
The virtual DOM uses monomorphic plain JS objects with properties for the tag, attributes, state, and other book keeping. Maintaining monomprphic classes saves on memory in most JS VMs since the keys are indexed separately and the objects just store the values themseleves. Most optimizers also work better then the call sites always use the same shaped arguments.