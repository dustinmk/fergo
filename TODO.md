
## Update
- Synthetic events
    - Bind event handler at top element only. Call event handler by associating event.target with vdom and/or element
    - Especially useful for HOC that add event handles without needing to wrap it with a DOM element
    - Use addEventListener(..., useCapture=true)
    - Can instead find way go manipulate created dom, including components: event handler can move up to nearest functional and check if it has a callback
    - Can instead find way to manipulate wrapped component event handlers - also useful to modify other attributes.
        - Components may apply unknown attributes to its root element. This is recursive.
        - Consider HOC that wraps all children with something - HOC reads and writes children for component or vdom
        - gen = (vdom) => Vdom; HOC = (gen) => (vdom) => {`mutate props and state`; const v = gen(vdom); `mutate instance attribtues`; return v;}; export default HOC(gen);
- Reduce needless accessing of child dom nodes. Should be able to just provide way to access node
    - Storing parent node + index is not good if the parent's children are modified while being used
    - Can instead generate list of changes then act upon them
    - Can instead store dom elem on vdom, but ensure to consider old vdom to be somewhere in new vdom. Don't overwrite new.elem unless no old.elem is further needed. Can use frame-key-based double buffering.
    - Can instead cache dom tree on functional components
- Fragments
- Longest common subsequence diff algorithm or proof reason why not using: 1-1 null nodes
    - Can use for Fragments only
- Component Children put on props.children
- Disable errors in production mode
- Replace VDomNull with just null
- Type tags as single char in prod
- Remove patchID
- Speed up event handlers: have same event handler always, put user event handler and params in data/this. Create new func object when mounting listener and save the instance. Modify its context to update.
- Remove makecomponent from class component. generator can be private templated static, rest. an be in view()
- Find better component pattern
    - Copy over hooks from old vdom to new vdom
    - Create initiaizeWith() function for components: initializeWith(generator, attributes) => (vdom) => Vdom;
- Turn VdomText into just string
- Key can be number or string
- Flatten props - all unknowns should be sent to props
- Test for minimal node replacement

## Performance
- Closure memory leaks: parent func refers to child func context, child refers to parent context
- Monomorphic call sites
- Minimise dom manipulation
- Minimise garbage collection
- Closure compiler for inlining

## Features
- Router

## Supporting Code
- Refactor and systematically complete testing
- Rollup
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
    - Non-component class: just a render () function and update component as necessay, using equal component culling
    - Call as library inside class (like etch)
