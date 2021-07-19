import {v, VdomFunctional, redraw} from "minim/index";

const range = (start: number, end: number, step: number = 1) => {
     const result = [];
     for (let i = start; i < end; i += step) {
         result.push(i);
     }
     return result;
}

export default () => {
    
    const weekdays = ["S", "M", "T", "W", "T", "F", "S"];
    const Month = (vdom: VdomFunctional<{
        month: number,
        year: number,
        selected_date: Date | null,
        onSelect: (date: Date) => void
    }>) => {
        
        // About 75% of the total redraw time and 85% of this function is spent
        // calculating these date strings and numbers
        const first_date = new Date(vdom.props.year, vdom.props.month, 1);
        const day_of_first = first_date.getDay();
        const days_in_month = (new Date(vdom.props.year, vdom.props.month + 1, 0)).getDate();
        const selected_month = vdom.props.selected_date !== null && vdom.props.selected_date.getMonth()
        const selected_year = vdom.props.selected_date !== null && vdom.props.selected_date.getFullYear()
        const selected_day = vdom.props.selected_date !== null && vdom.props.selected_date.getDate()
        const month_name = first_date.toLocaleString("en-us", { month: "long" })

        const ret = v("div.month", [
            v("h3", month_name),
            v("table", [
                v("tr", range(0, 7).map(day => {
                    return v("th", weekdays[day])
                })),
                range(0, 6).map(week => v("tr", [
                    range(0, 7).map(day_of_week => {
                        const date = (week * 7) + day_of_week - day_of_first + 1;                            
                        const style: {[index: string]: string} = selected_day === date
                            && selected_month === vdom.props.month
                            && selected_year === vdom.props.year
                            ? {"background-color": "blue", "color": "white"}
                            : {};

                        return v("td", {
                            style: style,
                            onclick: () => (date > 0 && date <= days_in_month)
                                && vdom.props.onSelect(new Date(vdom.props.year, vdom.props.month, date))
                        }, date < 1 || date > days_in_month
                            ? ""
                            : `${date}`
                        );
                    })])
                )
            ])
        ])
        return ret
    }

    const style_elem = document.createElement("style");
    style_elem.textContent = `
        .month {
            margin: 1em;
        }

        .month_container {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            margin: 1em;
        }

        .calendar button {
            display: inline;
        }

        .calendar h1 {
            display: inline;
            margin: 1em;
        }

        .year_selector {
            text-align: center;
        }

        .year_selector > * {
            text-align: center;
            display: inline-block;
        }

        .year_selector_container {
            width: 100%;
        }

        td, th {
            text-align: center;
        }

        td {
            cursor: pointer;
        }
    `
    document.head.appendChild(style_elem);

    let year = (new Date()).getFullYear();
    let selected_date = new Date();

    // Inlining this as a prop causes a redraw for every month on selection
    // Instead, redraw only one or two months on date selection
    const onSelect = (date: Date) => {
        selected_date = date
        redraw(vdom);
    }

    const vdom = v(() => {
        return v("div.calendar", [
            v("div.year_selector_container", [
                v("div.year_selector", [
                    v("button", {onclick: () => --year}, "<"),
                    v("h1", `${year}`),
                    v("button", {onclick: () => ++year}, ">"),
                    v("br"),
                    v("p", `Selected date: ${selected_date.toDateString()}`),
                ])
            ]),
            v("div.month_container", range(0, 12).map(month => {
                return v(Month, {props: {
                    month,
                    year,
                    selected_date: selected_date.getMonth() === month && selected_date.getFullYear() === year
                        ? selected_date
                        : null,
                    onSelect
                }});
            }))
        ])
    })

    return vdom;
}