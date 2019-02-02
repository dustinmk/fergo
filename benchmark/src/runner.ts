import benchmarks from "./benchmarks/benchmarks";

// Map query parameters
const query = window.location.search.substring(1);
const option_strings = query.split("&");
const options: {[index: string]: string} = {};
for (const option of option_strings) {
    const [key, value] = option.split("=");
    options[key] = value;
}

const root_elem = document.getElementById("root");
if (root_elem === null) {
    throw new Error("Root element could not be found");
}

// Route on ?component={name}
if (benchmarks[options.component] !== undefined) {
    benchmarks[options.component](root_elem).then(result => {
        // Output with JSON on <body><p>{name, time}</p></body>
        const result_elem = document.createElement("p");
        result_elem.textContent = JSON.stringify(result);
        document.body.appendChild(result_elem);
        document.title = "Benchmark - Done"
    })
} else {
    const msg_elem = document.createElement("p");
    msg_elem.textContent = `Could not locate route ${options.component}`;
    document.body.insertBefore(msg_elem, document.body.firstChild);
}
