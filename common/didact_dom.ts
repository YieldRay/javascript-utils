export namespace Didact {
    export type FC<P = any> = (props: P) => DidactElement;

    export interface DidactElement<P = any, T extends string | FC<P> = string | FC<P>> {
        type: T; // react 内部会使用 Symbol 作为 type
        props: P & { children?: Array<DidactElement | DidactElement[]> }; // 注意 children 的类型
        // 没有实现 key属性 key: Key | null
    }

    export type DidactNode = DidactElement | Array<DidactNode> | string | number | boolean | null | undefined;
    // 简化版类型，@types/react 中写的是 Iterable<ReactNode> 而不是数组

    export type DidactFragment = Array<DidactNode>;

    // Fragment 函数的实现非常简单，它只是一个特殊的函数组件
    export function Fragment(props: { children?: DidactNode[] }): DidactFragment {
        return [props.children] || [];
    }

    interface Fiber<T extends string | FC = string | FC> extends DidactElement<any, T> {
        dom: Node | null;
        parent: Fiber | null;
        child: Fiber | null;
        sibling: Fiber | null;
        alternate: Fiber | null;
        effectTag: "UPDATE" | "PLACEMENT" | "DELETION";
        // hookIndex 用于索引 hooks
        hooks?: Array<{
            state: any;
            queue: Array<(prevState: any) => any>;
        }>;
    }

    // 将 Didact 对象转换为 Didact 元素
    export function createElement(
        type: string,
        props?: Record<string, any> | null,
        ...children: DidactNode[]
    ): DidactElement {
        // 注意返回值
        function nodeToElement(node: DidactNode): DidactElement | DidactElement[] {
            if (node === null) return createNullElement(); // falsy 值，不渲染
            if (Array.isArray(node)) return node.map(nodeToElement) as DidactElement[]; // 处理数组
            if (typeof node === "object") return node;
            if (typeof node === "string") return createTextElement(node);
            if (typeof node === "number") return createTextElement(String(node));
            if (Boolean(node) === false) return createNullElement(); // falsy 值，不渲染
            return createTextElement(String(node)); // 强转为字符串
        }
        return {
            type,
            props: {
                ...props,
                children: children.map(nodeToElement),
            },
        };
    }

    // 辅助函数，将字符串转换为 Didact 元素
    function createTextElement(text: string): DidactElement {
        return {
            type: "TEXT_ELEMENT",
            props: {
                /**
                 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Node/nodeValue)
                 * 使用 nodeValue 属性方便在 render 函数中操作
                 */
                nodeValue: text,
                children: [],
            },
        };
    }

    // 辅助函数，将 falsy 值转换为 Didact 元素
    function createNullElement(): DidactElement {
        return {
            type: "NULL_ELEMENT",
            props: {
                children: [],
            },
        };
    }

    function createDom(fiber: Fiber<string>): Node | null {
        if (fiber.type === "NULL_ELEMENT") return null;
        const dom = fiber.type == "TEXT_ELEMENT" ? document.createTextNode("") : document.createElement(fiber.type);
        updateDom(dom, {}, fiber.props);
        return dom;
    }

    const isEvent = (key: string) => key.startsWith("on");
    const isProperty = (key: string) => key !== "children" && !isEvent(key);
    const isNew = (prev: Record<keyof any, any>, next: Record<keyof any, any>) => (key: keyof any) =>
        prev[key] !== next[key];
    const isGone = (prev: Record<keyof any, any>, next: Record<keyof any, any>) => (key: keyof any) => !(key in next);

    function updateDom(dom: Node, prevProps: Record<keyof any, any>, nextProps: Record<keyof any, any>) {
        Object.keys(prevProps)
            .filter(isEvent)
            // 选取旧的和改变的监听器
            .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
            // 移除之
            .forEach((name) => {
                const eventType = name.toLowerCase().substring(2);
                dom.removeEventListener(eventType, prevProps[name]);
            });

        Object.keys(nextProps)
            .filter(isEvent)
            // 选取所有新的监听器
            .filter(isNew(prevProps, nextProps))
            // 添加之
            .forEach((name) => {
                const eventType = name.toLowerCase().substring(2);
                dom.addEventListener(eventType, nextProps[name]);
            });

        Object.keys(prevProps)
            // 选取所有旧的属性
            .filter(isProperty)
            // 若该属性不需要了
            .filter(isGone(prevProps, nextProps))
            // 移除之
            .forEach((name) => {
                Reflect.set(dom, name, "");
            });

        Object.keys(nextProps)
            .filter(isProperty)
            // 选取所有新的属性
            .filter(isNew(prevProps, nextProps))
            // 添加之
            .forEach((name) => {
                Reflect.set(dom, name, nextProps[name]);
            });
    }

    function commitRoot() {
        // 对 dom 的更改操作都移入 commit 中
        deletions!.forEach(commitWork);
        commitWork(wipRoot!.child);
        currentRoot = wipRoot;
        wipRoot = null;
    }

    function commitWork(fiber: Fiber | null) {
        if (!fiber) {
            // 递归终止条件
            return;
        }
        // commitWork 传入的 fiber 不是根 fiber，必有 parent 属性
        let domParentFiber: Fiber = fiber.parent!;
        while (!domParentFiber.dom) {
            // 如果当前 fiber 没有 dom 属性，说明这个 fiber 是函数组件的 fiber
            domParentFiber = domParentFiber.parent!;
            // 由于上一级也可能是函数组件 fiber，一直向上寻找，直至非函数组件 fiber
        }
        const domParent = domParentFiber.dom;

        if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
            domParent.appendChild(fiber.dom);
        } else if (fiber.effectTag === "DELETION" && fiber.dom != null) {
            commitDeletion(fiber, domParent); //? 处理移除
            return;
        } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
            updateDom(fiber.dom, fiber.alternate!.props, fiber.props);
        }
        // 继续递归
        commitWork(fiber.child);
        commitWork(fiber.sibling);
    }

    function commitDeletion(fiber: Fiber, domParent: Node) {
        if (fiber.dom) {
            domParent.removeChild(fiber.dom);
        } else {
            // 注：这里函数组件必有子节点
            commitDeletion(fiber.child!, domParent);
        }
    }

    export function render(element: DidactElement, container: Node) {
        wipRoot = {
            dom: container,
            props: {
                children: [element],
            },
            alternate: currentRoot,
        } as Fiber;
        deletions = [];
        nextUnitOfWork = wipRoot;
        //! 开始执行工作单元
        requestIdleCallback(workLoop);
    }

    // 一个工作单元其实是一个不完整的 fiber
    let nextUnitOfWork: Fiber | null = null;
    let currentRoot: Fiber | null = null;
    let wipRoot: Fiber | null = null;
    let deletions: Fiber[] | null = null;

    function workLoop(deadline: IdleDeadline) {
        let shouldYield = false;
        while (nextUnitOfWork && !shouldYield) {
            nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
            shouldYield = deadline.timeRemaining() < 1;
        }

        if (!nextUnitOfWork && wipRoot) {
            // 没有需要渲染的工作，说明渲染完毕，可以添加进 dom 了
            commitRoot();
        } else {
            //! 否则，继续执行工作单元
            requestIdleCallback(workLoop);
        }
    }

    function performUnitOfWork(fiber: Fiber): Fiber | null {
        if (fiber.type instanceof Function) {
            // 函数组件，特殊处理
            updateFunctionComponent(fiber as Fiber<FC>);
        } else {
            // 非函数组件
            updateHostComponent(fiber as Fiber<string>);
        }

        if (fiber.child) {
            return fiber.child;
        }
        let nextFiber = fiber;
        while (nextFiber) {
            if (nextFiber.sibling) {
                return nextFiber.sibling;
            } else {
                nextFiber = nextFiber.parent!;
            }
        }
        return null;
    }

    let wipFiber: Fiber | null = null;
    let hookIndex: number | null = null;

    function updateFunctionComponent(fiber: Fiber<FC>) {
        wipFiber = fiber;
        // 函数组件添加 hooks 属性
        wipFiber.hooks = [];
        // 全局索引置 0
        hookIndex = 0;
        // 函数组件内部可以调用 useState()
        //@ts-ignore 处理 Fragment 函数
        const children = fiber.type === Fragment ? fiber.type(fiber.props) : [fiber.type(fiber.props)];
        reconcileChildren(fiber, children);
    }

    type Action<T> = (prevState: T) => T;
    // useState 函数，添加 hook 到 fiber 的 hooks 数组
    // setState 函数，添加 变更函数 到 hook 的 queue 数组
    export function useState<T = any>(initialState: T): [state: T, setState: (action: Action<T>) => void] {
        // 注：useState 被 updateFunctionComponent 间接调用
        // wipFiber 必是一个函数组件的 fiber

        // oldHook 是上一次渲染的对应 hook （第一次渲染时没有）
        const oldHook = wipFiber!.alternate && wipFiber!.alternate.hooks && wipFiber!.alternate.hooks[hookIndex!];

        const hook = {
            state: oldHook ? oldHook.state : initialState,
            queue: [] as Array<Action<T>>,
        };

        // 依次执行上一次 fiber 的 hooks，得到上一次的最终 state
        const actions = oldHook ? oldHook.queue : [];
        actions.forEach((action: Action<T>) => {
            hook.state = action(hook.state);
        });

        // 调用 setState 会导致调用 performUnitOfWork 然后 updateFunctionComponent
        const setState = (action: Action<T>) => {
            hook.queue.push(action); // 函数组件可多次调用 setState
            wipRoot = {
                dom: currentRoot!.dom,
                props: currentRoot!.props,
                alternate: currentRoot!,
            } as Fiber;
            // 调用 setState 导致重渲染，更新这些全局变量（调整工作单元，重新从根 fiber 渲染）
            nextUnitOfWork = wipRoot;
            deletions = [];
            //! 执行工作单元
            requestIdleCallback(workLoop);
        };

        wipFiber!.hooks!.push(hook);
        hookIndex!++; // 渲染函数组件时，重置索引
        return [hook.state, setState];
    }

    function updateHostComponent(fiber: Fiber<string>) {
        if (!fiber.dom) {
            fiber.dom = createDom(fiber);
        }
        reconcileChildren(fiber, fiber.props.children);
    }

    function reconcileChildren(wipFiber: Fiber, elems: Array<DidactElement | DidactElement[]>) {
        // 重要：flat 一层
        const elements: DidactElement[] = elems.flat(1);
        // wipFiber 是 elements 的直接父节点
        let index = 0;
        // 与上一次渲染的相同位置做比较
        let oldFiber: Fiber | null = wipFiber.alternate && wipFiber.alternate.child;
        // 当前子 fiber 的上一个兄弟 fiber
        let prevSibling: Fiber | null = null;

        while (index < elements.length || oldFiber != null) {
            const element = elements[index];

            let newFiber: Fiber | null = null;
            const sameType = oldFiber && element && element.type === oldFiber.type;

            // 通过 effectTag 属性标记，待到 commitWork 函数中执行相应操作
            if (sameType) {
                newFiber = {
                    type: oldFiber!.type,
                    props: element.props,
                    dom: oldFiber!.dom, // 无需重新创建 dom
                    parent: wipFiber,
                    alternate: oldFiber,
                    effectTag: "UPDATE",
                    child: null,
                    sibling: null,
                };
            }
            if (element && !sameType) {
                newFiber = {
                    type: element.type,
                    props: element.props,
                    dom: null, // 需要重新创建 dom
                    parent: wipFiber,
                    alternate: null,
                    effectTag: "PLACEMENT",
                    child: null,
                    sibling: null,
                };
            }
            if (oldFiber && !sameType) {
                oldFiber.effectTag = "DELETION";
                deletions!.push(oldFiber); // 添加到删除列表
            }

            if (oldFiber) {
                // 继续比较
                oldFiber = oldFiber.sibling;
            }

            if (index === 0) {
                wipFiber.child = newFiber;
            } else if (element) {
                // 注：if (element) 没必要
                prevSibling!.sibling = newFiber;
            }

            prevSibling = newFiber;
            index++;
        }
    }
}
