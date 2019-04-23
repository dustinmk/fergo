## Optimizations
- Reuse unused keyed for new keyed elements elements after matching is complete (Krausest replace)
- Implement synthetic events: Map nodes to vdoms, put event handler on root. Do bubbling
- Extra fast paths in patch_children: reverse, swap
- Have single string as child when possible
- Find out why Krausest update every 10th is slow (probably refactor and implement other opts before doing)
- Test non-monomorphic on a branch.
- Fastpath for removing child elements (textContent = ""))

## Update
- Refactor
- Tests
    - Build benchmarks: benchmark.js
    - Fill in missing tests
    - Test for minimal node replacement
- Performance
    - JSDOM benchmarks for actual JS code and fine resolution timers
    - Monomorphic call sites
    - Garbage collection: Pool vdoms and nodes
    - Ukkonen-Berghel-Roach Levenshtein diff on nodes - use current pairing algorithm though for consistency
    - Alternate LCS:
        - if new !== LCS and old !== LCS: replace
        - else if old !== LCS: delete old
        - else if new !== LCS: insert new, advance LCS
        - else okay
    - Alternate LIS (longest increasing subsequence)
        - All nodes in LIS are in same order as in old, so LIS can be indexes of old
        - New refers to old, so new string can have increasing values, and -1 otherwise
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
- Dependency injection
- Pubsub (component): use prop/generator culling
- Non-component class: just a render () function and update component as necessary, using equal component culling
- Call as library inside class (like etch)
- object classes: click handlers on state object in order to modify state without resetting click handlers.
- **TODO MVC**

## Article
- Synthetic events: useCapture=true, inject event handlers on children (react doesn't allow this)
- LCS diffing
TODO: Article - functional components: explain pruning up, pruning down, pruning with props, state, keys
Provide reasons why these behaviours are necessary and what would happen without them
State: consider a list of card components where the user can toggle the comments on or off
     the state can be stored outside of the v() calls, on the vdom, or a constructor can be called as needed
Pruning with props: if a parent redraws, the children generators will be called. Unless they handle
     their memoization otherwise, they will be regenerated unecessarily

## Resources
- https://github.com/sindresorhus/leven
- https://github.com/sunesimonsen/ukkonen
- https://ac.els-cdn.com/S0019995885800462/1-s2.0-S0019995885800462-main.pdf?_tid=f0f6e024-14ed-4567-9c23-8eaacebf67ff&acdnat=1549041982_fdad9e3df33d5909ee8bc9a61affaf63
- http://www.berghel.net/publications/asm/asm.php
- https://arxiv.org/pdf/1311.4552.pdf
- LCIS: https://www.sciencedirect.com/science/article/pii/S1570866711000438
- LIS: https://ac.els-cdn.com/0012365X7590103X/1-s2.0-0012365X7590103X-main.pdf?_tid=a9bd3c7d-79bd-4913-b29d-f7256d8f022d&acdnat=1549379025_5a9638650c3a3b536d4206d0c148d2f5
