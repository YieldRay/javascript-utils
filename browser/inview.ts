export function inView<T extends HTMLElement>(el: T, callback: (entry: IntersectionObserverEntry) => void) {
    const io = new IntersectionObserver(
        (entries, observer) => {
            const entry = entries[0];
            if (entry.intersectionRatio > 0) callback.call(el, entry);
        },
        {
            threshold: 0,
        }
    );
    io.observe(el);

    return () => io.unobserve(el);
}

export function outView<T extends HTMLElement>(
    el: T,
    callback: (entry: IntersectionObserverEntry) => void,
    ignoreInit = false
) {
    let isInit = ignoreInit;
    const io = new IntersectionObserver(
        (entries, observer) => {
            const entry = entries[0];
            if (isInit) {
                isInit = false;
                return;
            }
            if (entry.intersectionRatio === 0) callback.call(el, entry);
        },
        {
            threshold: 0,
        }
    );
    io.observe(el);
    return () => io.unobserve(el);
}

export function inAndOutView<T extends HTMLElement>(
    el: T,
    inCallback: (entry: IntersectionObserverEntry) => void,
    outCallback: (entry: IntersectionObserverEntry) => void,
    ignoreInit = false
) {
    const unobserveIn = inView(el, inCallback.bind(el));
    const unobserveOut = outView(el, outCallback.bind(el), ignoreInit);
    return () => {
        unobserveIn();
        unobserveOut();
    };
}
