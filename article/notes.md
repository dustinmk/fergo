
# Update
- Compare tree edit distance, child list edit distance, and using keyed elements
- Conditionals return false or null, so child list with conditionals is always same length and same order.
- Arrays as children so variable length embeddable lists can be used with their own keys
- Keys should be out of phase with the otherwise linear ordering of elements (so the user may use key={0})
- Keys don't solve the element lifting problem, but this can be hacked around with user state
- For variable length arrays, require a key
- All other cases must be handled in user state
- Examples: React loses focus on input elements when:
    - Input element is lifted or nested to parent/child/elsewhere in tree
    - Other input elements are added before or after in a child list
    - Any element is added before the input element
- Since React works well, we can just use its diff model instead of the complicated and time consuming edit distance diff models