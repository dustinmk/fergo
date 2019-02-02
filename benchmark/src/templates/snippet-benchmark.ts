
export default (
    name: string,
    call_fn: () => void,
    call_setup: () => void = () => {},
    call_teardown: () => void = () => {}
) => async () =>
{

    const start_time = performance.now();
    const min_time = 10 * 1000;
    const iter_batch = 1000;
    const min_iter = 10;
    let iter = 0;
    await new Promise(resolve => {
        const single_iteration = () => {

            call_setup();
            performance.mark("timer-start");
            let batch_count = iter_batch;
            while(--batch_count) {
                call_fn();
            }
            performance.mark("timer-end");
            call_teardown();

            performance.measure("timer", "timer-start", "timer-end");
            
            ++iter;
            if (iter < min_iter || performance.now() - start_time < min_time) {
                setTimeout(single_iteration);
            } else {
                resolve();
            }
        }
        single_iteration();
    });

    const times = performance.getEntriesByName("timer").map(entry => entry.duration);
    const mean = times.reduce((acc, time) => acc += time, 0) / times.length / iter_batch;

    return {
        name: name,
        time: mean
    }
}