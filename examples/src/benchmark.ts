import {v, redraw, mount} from "minim/index";
import faker from "faker";

interface Row {
    firstname: string;
    lastname: string;
    state: string;
    address: string;
    phone: string;
    occupation: string;
    priority: number;
    salary: string;
    counter: number;
}

let rows: Array<Array<Row>> = [];
const MAX_ROWS = 100;
const MAX_COPIES = 5;
let current_copy = 0;

for(let copy = 0; copy < MAX_COPIES; ++copy) {
    const row_data: Row[] = [];

    for(let row = 0; row < MAX_ROWS; ++row) {
        row_data.push({
            firstname: faker.name.firstName(),
            lastname: faker.name.lastName(),
            state: faker.address.state(),
            address: `${faker.address.streetAddress()} ${faker.address.streetName()} ${faker.address.streetSuffix()}`,
            phone: faker.phone.phoneNumber(),
            occupation: faker.name.jobTitle(),
            priority: faker.random.number(),
            salary: faker.finance.amount(10000, 100000),
            counter: faker.random.number(),
        })
    }

    rows.push(row_data);
}

const view = v(() => {
    const children = rows[current_copy].map(row => {
        return v("tr", [
            row.firstname,
            row.lastname,
            row.state,
            row.address,
            row.phone,
            row.occupation,
            `${row.priority}`,
            row.salary,
            `${row.counter}`
        ].map(item => v("td", item)))
    });

    return v("table", children);
})

let iter = 0;
const MAX_ITER = 1000;
let total_time = 0;
setInterval(() => {
    const start = performance.now();
    if (iter < MAX_ITER) {
        current_copy = (current_copy + 1) % MAX_COPIES;
        redraw(view);
        ++iter;
    }
    total_time += performance.now() - start;
    console.log(total_time);
})

const root_elem = document.getElementById("root");
if (root_elem === null) {
    throw Error("root div not found in HTML");
}

mount(root_elem, view);