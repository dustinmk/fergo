
import {v, mount, redraw} from "fergo";
import {BenchmarkSet} from "./benchmark-data";

// on click, fetch /run
// on response, refresh table
// poll /results just in case
// fetch /results on load

// TODO: Toggle benchmarks on or off: in left column
const generateDocument = () => {
    const benchmark_names = new Set<string>();
    state.benchmark_sets
        .forEach(set =>
            Object.keys(set.results).forEach(name =>
                benchmark_names.add(name)));

    return v("div", [
        v("h1", "Fergo: Benchmark"),
        v("hr"),
        v("label", "Name\xA0"),
        v("input", {
            disabled: state.running,
            oninput: (ev: Event) => state.next_name = (<HTMLInputElement>ev.target).value,
            value: state.next_name,
            defaultValue: (new Date()).toDateString()
        }),
        v("button", {
            onclick: async () => await runAndUpdateResults()
        }, "Run"),
        state.running && v("p", "Running..."),

        v("table", [
            v("tr", [
                v("th", ""),
                state.benchmark_sets.map(set =>
                    v("th", [
                        v("button", {
                            onclick: async () => await deleteResult(set.name)
                        }, "X"),
                        v("br"),
                        set.name
                    ])
                )
            ]),

            setToArray(benchmark_names).map(benchmark_name => v("tr", [
                v("th", benchmark_name),

                state.benchmark_sets.map(set => {
                    const result = set.results[benchmark_name];
                    return v("td", result === undefined ? "" : result.time.toPrecision(5))
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
    state.benchmark_sets = await fetch("http://localhost:8080/results").then(res => res.json());
}

const TIMEOUT = 5 * 60 * 1000;  // 5 minute timeout
const runAndUpdateResults = async () => {
    const name = state.next_name;
    state.next_name = "";
    state.running = true;
    redraw(root_vdom);

    const starting_result_count = state.benchmark_sets.length;
    const start_time = Date.now();
    fetch(`http://localhost:8080/run?name=${name}`);

    state.benchmark_sets = await new Promise<BenchmarkSet[]>((resolve, reject) => {
        const interval = setInterval(async () => {
            const results: BenchmarkSet[] = await fetch("http://localhost:8080/results").then(res => res.json());

            if (results.length > starting_result_count) {
                clearInterval(interval);
                resolve(results);
                
            } else if (Date.now() - start_time > TIMEOUT) {
                clearInterval(interval);
                reject();
            }
        }, 2000)
    });

    state.running = false;
}

const deleteResult = async (name: string) => {
    state.benchmark_sets = await fetch(`http://localhost:8080/delete?name=${name}`).then(res => res.json());
}

const state = {
    benchmark_sets: [] as BenchmarkSet[],
    running: false,
    next_name: ""
}

const root_vdom = v(generateDocument);

const root_elem = document.getElementById("root");
if (root_elem !== null) {
    mount(root_elem, root_vdom);
}

fetchResults().then(() => redraw(root_vdom));
