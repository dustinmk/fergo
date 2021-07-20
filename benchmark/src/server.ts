
import express from "express";
import fs from "fs";
import path from "path";
import mustache from "mustache";
import {Builder, Capabilities, By, until} from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome";
import benchmarks from "./benchmarks/benchmarks";
import { BenchmarkResult, BenchmarkSet } from "./benchmark-data";

const app = express();
const port = 8080;
const cache_file = path.resolve(__dirname, "./benchmark-cache.json");
const template_file = path.resolve(__dirname, "./index.html.mustache");

app.use(express.static(__dirname));

// Spin up server
// Go to /
// Click on run()
// Webdriver opens a tab, runs the benchmark, then get the result
// Responds with JSON data that the page updates with
// No polling right now, so you might have to refresh after the run is done

const loadResults = (): Promise<BenchmarkSet[]> => {
    return new Promise(resolve => fs.exists(cache_file, does_exist => {
        if (does_exist) {
            fs.readFile(cache_file, (_, data) => {
                const results = JSON.parse(data.toString());
                resolve(results);
            })
        } else {
            resolve([])
        }
    }));
}

const saveResults = (results: BenchmarkSet[]) => {
    return new Promise(resolve => {
        fs.writeFile(cache_file, JSON.stringify(results), resolve);
    });
}

app.get("/", (_, res) => {
    // Serve up the results home page
    fs.readFile(template_file, (_, data) => {
        const template = data.toString();
        const html = mustache.render(template, {scripts: {src: "./results.js"}});
        res.send(html);
    });
})

app.get("/results", async (_, res) => {
    // Fetch all results as JSON response
    const results = await loadResults();
    res.json(results);
});

app.get("/run", async (req, res) => {
    // Start selenium benchmarks. Respond once done, but also save to disk
    let service = new chrome.ServiceBuilder(path.join(__dirname, "..", "..", "node_modules", ".bin", "chromedriver.cmd")).build();
    chrome.setDefaultService(service);

    let driver = new Builder()
        .withCapabilities(Capabilities.chrome())
        .build();

    const results = await loadResults();
    
    try {
        const base_name = req.query.name === undefined
            ? (new Date()).toTimeString()
            : req.query.name as string;
        let name = base_name;

        let name_suffix = 1;
        while (results.findIndex(result => result.name === name) >= 0) {
            name = `${base_name} ${name_suffix++}`;
        }

        const benchmark_set: BenchmarkSet = {name, results: {}};

        const window_handle = await driver.getWindowHandle();
        await driver.switchTo().window(window_handle);

        for (const benchmark of Object.keys(benchmarks)) {
            await driver.get(`http://localhost:${port}/benchmark/?component=${benchmark}`);
            await driver.wait(until.elementLocated(By.css("body>p")));
            const result_elem = await driver.findElement(By.css("body>p"));
            const benchmark_result = JSON.parse(await result_elem.getText()) as BenchmarkResult;
            benchmark_set.results[benchmark_result.name] = benchmark_result;
        }

        driver.quit();
        results.push(benchmark_set);

        await saveResults(results);
        res.json(results);

    } finally {
        await driver.quit();
        service.kill();
    }
});

app.get("/delete", async (req, res) => {
    // Remove a result from cache and save to disk
    const results = await loadResults();
    const name = req.query.name;
    const index = results.findIndex(result => result.name === name);
    if (index >= 0) {
        results.splice(index, 1);
        await saveResults(results);
    }
    res.json(results);
});

app.get("/benchmark", (_, res) => {
    // serve up the benchmark html file
    fs.readFile(template_file, (_, data) => {
        const template = data.toString();
        const html = mustache.render(template, {scripts: [
            {src: "/lodash.js"},
            {src: "/benchmark.js"},
            {src: "/runner.js"}
        ]});
        res.send(html);
    });
});

app.listen(port);