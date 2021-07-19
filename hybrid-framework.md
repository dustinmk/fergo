# Hybrid Virtual DOM - DOM Wrapper Framework

// Create an array of elems that get updated with a diff of items
mapped(() => items, (item) => elem)

// Only creates the elem when needed and caches it later
lazy(() => elem)

elem.redraw() {
    if elem.parent:
        elem.parent.redraw()
    else:
        for each child: if child.update: child.update()
}

elem.update() {
    if functional: if this() !== this.elem: replace this.elem
    for each child: if child.update: child.update()
}

// Standard hyperscript
h("tag.class#id", {attr}, [children])

function some-view() {
    const items = [...stuff...];
    let conditional = true;

    const option-1 = lazy(() => h("p", "option-1");
    const option-2 = lazy(() => h("p", "option-2");

    h("div", [
        // Wrapped elem child
        h("h3", "title text"),
        
        // Mapped child. The items are stored on the elements. On update, the diff of the
        // result of the first function and the elements are produced, and the changes are made.
        // The update() call is propogated to all children
        mapped(() => this.items, item => h("p", item.name)),
        
        // When the parent update is called, this function is called to get the elem for this
        // spot. It returns a lazy elem so only what needs to be rendered is actually rendered
        () => {
            if (conditional) {
                return option-1;
            }
            return option-2;
        }
        
        // onclick triggers an update. The update propagates up through the parents and then back
        // down to all children.
        h("button", {
            onclick: elem => conditional = !conditional;
        }),
        
        // The event handlers accept a promise. The re-render is only done when the promise resolves.
        // A manual re-render can be triggered by calling elem.redraw()
        h("button", {
            onclick: async elem => {
                loading = true;
                elem.redraw();
                items = await api.load();
                loading = false;
            })
        })
    ]);
}
