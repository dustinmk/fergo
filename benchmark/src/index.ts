
class A {
    public a = "steve";
}

const root = document.getElementById("root")
if (root !== null) {
    const a = new A();
    const c = document.createElement("p");
    c.textContent = a.a;
    root.append(c);
}

// Array of tests
// Run all tests
// Save in IndexedDB/localStorage by time, name
// Load all from IndexedDB
// Report in table