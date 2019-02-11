
// Best case linear time, worst case nlogn - nloglogn + O(n)
// See https://www.sciencedirect.com/science/article/pii/0012365X7590103X
export default (x: number[]) => {
    const max_lis: number[] = [0];
    const prev: number[] = [];

    if (x.length <= 0) {
        return [];
    }

    for (let i = 0; i < x.length; ++i) {
        if (x[i] > x[max_lis[max_lis.length - 1]]) {
            prev.push(max_lis[max_lis.length - 1]);
            max_lis.push(i);

        } else {
            // binary search
            let left = 0;
            let right = max_lis.length;
            while (left <= right) {
                const mid = ((left + right) / 2) | 0;
                if (x[max_lis[mid]] < x[i]) {
                    left = mid + 1;
                } else {
                    right = mid - 1;
                }
            }
            
            prev.push(max_lis[left - 1]);
            max_lis[left] = i   // Maintains Packed SMI representation since left <= max_lis.length
        }
    }

    // Reconstruct the lis
    const ret: number[] = max_lis;  // Reuse max_lis array to maintain Packed SMI while filling backward
    let k = max_lis[max_lis.length - 1];
    for(let i = max_lis.length - 1; i >= 0; --i) {
        ret[i] = x[k];
        k = prev[k];
    }

    return ret;
}