
import {v, mount, redraw} from "minim";
import {BenchmarkSet} from "./benchmark-data";

// on click, fetch /run
// on response, refresh table
// poll /results just in case
// fetch /results on load

const generateDocument = (benchmark_sets: BenchmarkSet[], running: boolean) => {
    const benchmark_names = new Set();
    benchmark_sets
        .forEach(set =>
            Object.keys(set.results).forEach(name =>
                benchmark_names.add(name)));

    // TODO: Clear all or remove individual sets
    return v("div", [
        v("h1", "Minim: Benchmark"),
        v("hr"),
        v("button", {
            onclick: async () => await runAndUpdateResults()
        }, "Run"),
        running && v("p", "Running..."),

        v("table", [
            v("tr", [v("th", ""), benchmark_sets.map(set => v("th", set.name))]),

            setToArray(benchmark_names).map(benchmark_name => v("tr", [
                v("th", benchmark_name),

                benchmark_sets.map(set => {
                    const result = set.results[benchmark_name];
                    return v("td", result === undefined ? "" : `${result.time}`)
                })
            ]))
        ])
    ]);
}

const setToArray = <ValueType>(set: Set<ValueType>) => {
    const result: ValueType[] = [];
    for(const v of set.values()) {
        result.push(v);
    }
    return result;
}

const fetchResults = async () => {
    benchmark_sets = await fetch("http://localhost:8080/results").then(res => res.json());
    console.log(JSON.stringify(benchmark_sets))
}

const runAndUpdateResults = async () => {
    running = true;
    redraw(root_vdom);
    benchmark_sets = await fetch("http://localhost:8080/run").then(res => res.json());
    running = false;
}

let benchmark_sets: BenchmarkSet[] = [];
let running = false;
const root_vdom = v(() => generateDocument(benchmark_sets, running));

const root_elem = document.getElementById("root");
if (root_elem !== null) {
    mount(root_elem, root_vdom);
}

fetchResults().then(() => redraw(root_vdom));
