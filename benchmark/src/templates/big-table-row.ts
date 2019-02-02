import faker from "faker";

export interface Row {
    name: string;
    street: string;
    city: string;
    phone: string;
    occupation: string;
    chicken_ownership: string;
    first_person_seen: string;
    harp_position: string;
}

export const generateRows = (count: number) => {
    const rows: Row[] = [];
    for (let i = 0; i < count; ++i) {
        rows.push({
            name: `${faker.name.firstName()} ${faker.name.lastName()}`,
            street: `${faker.address.streetAddress()} ${faker.address.streetName()} ${faker.address.streetSuffix()}`,
            city: `${faker.address.city()} ${faker.address.state()} ${faker.address.country()}`,
            phone: faker.phone.phoneNumber(),
            occupation: faker.name.jobTitle(),
            chicken_ownership: `${faker.random.number({min: 0, max: 10})}`,
            first_person_seen: `${faker.name.firstName()} ${faker.name.lastName()}`,
            harp_position: faker.hacker.noun()
        })
    }
    return rows;
}