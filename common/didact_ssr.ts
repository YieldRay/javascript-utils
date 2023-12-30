// jsx-runtime.ts
declare namespace JSX {
    interface IntrinsicElements {
        [elemName: string]: any;
    }
}

export type DidactNode = DidactElement | Array<DidactNode> | string | number | boolean | null | undefined;

export interface DidactElement<P = any, T extends string = string> {
    type: T | Function;
    props: P & { children?: Array<DidactElement | DidactElement[]> };
}

export function createElement(
    type: string,
    props?: Record<string, any> | null,
    ...children: DidactNode[]
): DidactElement {
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

function createTextElement(text: string): DidactElement {
    return {
        type: "TEXT_ELEMENT",
        props: {
            nodeValue: text,
            children: [],
        },
    };
}

function createNullElement(): DidactElement {
    return {
        type: "NULL_ELEMENT",
        props: {
            children: [],
        },
    };
}

export function Fragment(props: { children?: DidactNode[] }): DidactNode {
    return {
        type: "FRAGMENT_ELEMENT",
        props: {
            children: props.children,
        },
    };
}

export function render(element: DidactElement): string {
    if (element.type === "NULL_ELEMENT") return "";
    if (element.type === "TEXT_ELEMENT") return element.props.nodeValue as string;
    if (element.type === "FRAGMENT_ELEMENT") return element.props.children?.map(render).join("") || "";
    if (typeof element.type === "function") return render(element.type(element.props));

    let sb = `<${element.type}`;

    Object.keys(element.props)
        .filter((key) => key !== "children")
        .forEach((name) => {
            const value = element.props[name];
            if (!value) return;
            sb += ` ${name}="${value}"`;
        });

    sb += ">";

    element.props.children.forEach((child: DidactElement) => {
        sb += render(child);
    });

    sb += `</${element.type}>`;

    return sb;
}
