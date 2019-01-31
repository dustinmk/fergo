declare global {
    interface Window {
        Benchmark: any;
        call_fn: () => void;
        call_setup: () => void;
        call_teardown: () => void;
    }
}

import { v, mount, redraw, selectRedraw, redrawSync } from "minim";
import faker from "faker";

selectRedraw(redrawSync);

interface Row {
    name: string;
    street: string;
    city: string;
    phone: string;
    occupation: string;
    chicken_ownership: string;
    first_person_seen: string;
    harp_position: string;
}

const generateRows = (count: number) => {
    const rows: Row[] = [];
    for (let i = 0; i < count; ++i) {
        rows.push({
            name: `${faker.name.firstName()} ${faker.name.lastName()}`,
            street: `${faker.address.streetAddress} ${faker.address.streetName} ${faker.address.streetSuffix}`,
            city: `${faker.address.city} ${faker.address.state} ${faker.address.country}`,
            phone: faker.phone.phoneNumber(),
            occupation: faker.name.jobTitle(),
            chicken_ownership: `${faker.random.number({min: 0, max: 10})}`,
            first_person_seen: `${faker.name.firstName()} ${faker.name.lastName()}`,
            harp_position: faker.hacker.noun()
        })
    }
    return rows;
}

// TODO: Make generic big table benchmark template and modify the rows in different ways
// TODO: Try performance counter variant - compute mean, std dev, t-test
export default (root_elem: HTMLElement) => {

    return new Promise<{
        name: string,
        time: number
    }>(resolve => {
        let rows: Row[] = []
        let new_rows: Row[] = generateRows(1000);

        const root = v(() => v("table", rows.map(row => {
            return v("tr", v("td", row))
        })));

        // Benchmarkjs decompiles the provided hooks to a string then compiles it back
        // In order to keep the closure, put the hooks on global scope so the compiled
        // functions can reach them.
        // This however defeats the purpose of decompilation in benchmark.js
        window.call_setup = () => {
            rows = generateRows(5000);
            new_rows = generateRows(1000);
            mount(root_elem, root);
            rows.splice(rows.length / 2, 0, ...new_rows);
        }

        window.call_teardown = () => {
            root_elem.childNodes.forEach(child => root_elem.removeChild(child));
        }

        window.call_fn = () => {
            redraw(root);
        }

        const benchmark = new window.Benchmark("foo", {
            setup: function() { window.call_setup() },
            fn: function() { window.call_fn() },
            teardown: function() { window.call_teardown() },
            onComplete: function() {
                resolve({
                    name: "Insert Rows",
                    time: benchmark.stats.mean
                })
            }
        });
        benchmark.run();
    });
}