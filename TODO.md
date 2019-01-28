
## Update
- Synthetic events
    - Bind event handler at top element only. Call event handler by associating event.target with vdom and/or element
    - Especially useful for HOC that add event handles without needing to wrap it with a DOM element
    - Use addEventListener(..., useCapture=true)    **AT LEAST MENTION THIS IN ARTICLE**
    - Can instead find way go manipulate created dom, including components: event handler can move up to nearest functional and check if it has a callback
    - Can instead find way to manipulate wrapped component event handlers - also useful to modify other attributes.
        - Components may apply unknown attributes to its root element. This is recursive.
        - Consider HOC that wraps all children with something - HOC reads and writes children for component or vdom
        - gen = (vdom) => Vdom; HOC = (gen) => (vdom) => {`mutate props and state`; const v = gen(vdom); `mutate instance attribtues`; return v;}; export default HOC(gen);
- Disable errors in production mode
- Remove makecomponent from class component. generator can be private templated static, rest. an be in view()
- Find better component pattern
    - Copy over hooks from old vdom to new vdom
    - Create initiaizeWith() function for components: initializeWith(generator, attributes) => (vdom) => Vdom;
- Flatten props - all unknowns should be sent to props
- Test for minimal node replacement
- Remove error strings from production code - replace with `throw ""`
- Minification: repeated web API functions with long names can be replaced with own functions if they are shorter: a.hasOwnProperty(k) to h(a,k) plus h=(a,k)=>{return a.hasOwnProperty(k)}
- Object.prototype.hasOwnProperty.call(obj, prop)

## Performance
- Closure memory leaks: parent func refers to child func context, child refers to parent context
- Monomorphic call sites
- Minimise dom manipulation
- Minimise garbage collection
- Closure compiler for inlining
- Minimize reflow
- jsPerf and benchmark.js
- Pool vdoms
- Pool nodes
- O(ND) or Levenshtein diff on nodes - use current pairing algorithm though for consistency
- Have a key-only pairing algorithm - add keys on nodes when not provided.
- Linked list memory leaks

## Features
- Router

## Supporting Code
- Refactor and systematically complete testing
- Benchmark
- Examples
    - Reactive
    - Calendar
    - Todo
    - State
    - Component
    - Portals
    - SVG: graph
    - On not clicked
    - HOC: draggable
    - Flux
    - Pubsub (component): use prop/generator culling
    - Non-component class: just a render () function and update component as necessary, using equal component culling
    - Call as library inside class (like etch)
    - object classes: click handlers on state object in order to modify state without resetting click handlers.

## Article
- Synthetic events
- LCS diffing