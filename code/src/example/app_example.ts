import { mount } from "src/mount";
import { v } from "src/vdom";

// Maintain state separate from the view. The state can then
// store the view and update it as needed in response to events

// State can be maintained by:
//   Construct state outside of vdom
//   Store state in vdom (state prop on Functional vdom)
//   Pass constructor to v() and let it construct an object
   
// One top instance
class App {
    private categories = new Categories();
    private mode = "select_category";

    constructor() {
    }

    public view() {
        return v("div", [
            v("p", "App"),
            v(this.select_mode(), {})   // This will only redraw if the props change upon redraw of the top component
        ]);
    }

    private select_mode() {
        switch(this.mode) {
            case "select_category":
                return this.categories.view
            default:
                return this.categories.view;
        }
    }
}

class Categories {
    private categories: Category[] = [];

    public view() {
        return v("div", [
            v("p", "Categories")
        ]);
    }
}

interface Category {
    name: string;
    children: Category[];
}

// class Tree {

// }

// class TreeNode {

// }

const app = new App();
const root = document.getElementById("root");
if (root === null) {
    throw new Error("Invalid HTML");
}
mount(root, () => app.view());

