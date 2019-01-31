import bigTable from "./big-benchmarkjs-table";
import {Benchmark} from "./benchmark-data";
import flatTableGenerator from "./flat-table-generator";
import componentTableGenerator from "./component-table-generator";
import rowWithEventHandlerGenerator from "./row-with-event-handler-generator";
import rowWithStaticEventHandlerGenerator from "./row-with-static-event-handler-generator";

const bigFlatTable = bigTable(flatTableGenerator);
const bigComponentTable = bigTable(componentTableGenerator);
const eventHandlerTable = bigTable(rowWithEventHandlerGenerator);
const staticEventHandlerTable = bigTable(rowWithStaticEventHandlerGenerator);

export default {
    "insert_rows": bigFlatTable("Insert 1000 rows into 5000", (rows, new_rows) => {
        rows.splice(rows.length / 2, 0, ...new_rows);
        return rows;
    }),
    "append_rows": bigFlatTable("Append 1000 rows to 5000", (rows, new_rows) => {
        return rows.concat(rows, new_rows);
    }),
    "insert_one_row": bigFlatTable("Insert a single row", (rows, new_rows) => {
        rows.splice(rows.length / 2, 0, new_rows[0]);
        return rows;
    }),
    "delete_one_row": bigFlatTable("Delete a single row", (rows, _) => {
        rows.splice(rows.length / 2, 1);
        return rows;
    }),
    "insert_rows_component": bigComponentTable("Insert 1000 rows into 5000: Component", (rows, new_rows) => {
        rows.splice(rows.length / 2, 0, ...new_rows);
        return rows;
    }),
    "append_rows_component": bigComponentTable("Append 1000 rows to 5000: Component", (rows, new_rows) => {
        return rows.concat(rows, new_rows);
    }),
    "insert_one_row_component": bigComponentTable("Insert a single row: Component", (rows, new_rows) => {
        rows.splice(rows.length / 2, 0, new_rows[0]);
        return rows;
    }),
    "delete_one_row_component": bigComponentTable("Delete a single row: Component", (rows, _) => {
        rows.splice(rows.length / 2, 1);
        return rows;
    }),
    "append_with_static_event_handler": staticEventHandlerTable("Static event handler append 1000", (rows, new_rows) => {
        return rows.concat(rows, new_rows);
    }),
    "append_with_inline_event_handler": eventHandlerTable("Inline event handler append 1000", (rows, new_rows) => {
        return rows.concat(rows, new_rows);
    }),
    
} as {[index: string]: Benchmark}