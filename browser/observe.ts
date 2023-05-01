export function observeMutation(target: Node, callback: MutationCallback, options?: MutationObserverInit) {
    const mo = new MutationObserver(callback);
    mo.observe(target, options);
    return () => mo.disconnect();
}

export function observeIntersection(
    target: Element,
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
) {
    const io = new IntersectionObserver(callback, options);
    io.observe(target);
    return () => io.disconnect();
}
