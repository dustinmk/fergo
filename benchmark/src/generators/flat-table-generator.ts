import {v} from "fergo";
import {Row} from "../templates/big-table-row";

export default (props: {rows: Row[]}) => v(() => v("table", props.rows.map(row => {
    return v("tr", {key: row}, [
        v("td", row.name),
        v("td", row.street),
        v("td", row.city),
        v("td", row.phone),
        v("td", row.occupation),
        v("td", row.chicken_ownership),
        v("td", row.first_person_seen),
        v("td", row.harp_position),
    ])
})));