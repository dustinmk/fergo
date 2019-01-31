
## Update
- Refactor
- Tests
    - Build benchmarks: benchmark.js
    - Fill in missing tests
    - Test for minimal node replacement
- Performance
    - Monomorphic call sites
    - Garbage collection: Pool vdoms and nodes
    - Ukkonen-Berghel-Roach Levenshtein diff on nodes - use current pairing algorithm though for consistency
    - Minimize reflow
- Memory leaks
    - Linked list memory leaks
    - Extra nodes
    - Closure memory leaks: parent func refers to child func context, child refers to parent context
- Build
    - UglifyJS with mangle-props: see preact
    - Remove webpack - use requirejs in examples
    - Disable errors strings in production mode
- Supporting Code
    - Router
    - Examples
- Article


## Examples
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
- Synthetic events: useCapture=true, inject event handlers on children (react doesn't allow this)
- LCS diffing