
## Update
- Synthetic events
    - Bind event handler at top element only. Call event handler by associating event.target with vdom and/or element
- Reduce needless accessing of child dom nodes. Should be able to just provide way to access node
    - Storing parent node + index is not good if the parent's children are modified while being used
    - Can instead generate list of changes then act upon them
    - Can instead store dom elem on vdom, but ensure to consider old vdom to be somewhere in new vdom. Don't overwrite new.elem unless no old.elem is further needed. Can use frame-key-based double buffering.
- Fragments
- Longest common subsequence diff algorithm

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
