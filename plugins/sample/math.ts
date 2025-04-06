import { Plugin, PluginKey } from "prosemirror-state";
import { EditorPlugin, MenuCommand } from "../../src";
import { wrapInCommand } from "../../src/commonmark/commands";
import { ParserInline } from "markdown-it";

import { Node as ProsemirrorNode } from "prosemirror-model";
import { EditorView, NodeView } from "prosemirror-view";
import { TagLinkOptions } from "../../src/shared/view";

import { error } from "../../src/shared/logger";

console.log("Math loading...")
export const mathEffectPlugin = new Plugin({
    key: new PluginKey("math"),
    props: {

    },
    state: {
        init() {
            // \(y=mx+b\)

            // @ts-ignore
            window.MathJax = {
                tex: {
                    inlineMath: [['inlineMathStart', 'inlineMathEnd']]
                },
                svg: {
                    fontCache: 'global'
                }
            };

            //(() => {
            let script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
            script.async = true;
            document.head.appendChild(script);
            //  })();
        },
        apply(_a, _b, _c, _d) {
            return;
        }
    }
})

export const mathPlugin: EditorPlugin = () => ({
    extendSchema: (schema) => {
        schema.marks = schema.marks.addToEnd("jse_furigana", {
            attrs: {
                text: { default: "" },
                markup: { default: "" },
            },
            toDOM: (mark) => {
                return [
                    "span",
                    {
                        "class": "jse-furigana",
                        "data-text": mark.attrs.text as string,
                    },
                ];
            },
            parseDOM: [
                {
                    tag: "span.jse-furigana",
                },
                {
                    tag: "span.rt",
                },
            ],
        });

        return schema;
    },
    richText: {
        plugins: [mathEffectPlugin],
    },
});

export const renderMath = (): MenuCommand => (state, dispatch) => {
    if (dispatch) {
        // @ts-ignore
        // MathJax.typeset();

        dispatch(state.tr);
    }
    return true;
};

export const addMathEffectCommand = wrapInCommand("$$", "$$");



/////

type getPosParam = boolean | (() => number);


export class MathView implements NodeView {
    dom: Node | null;
    img: HTMLImageElement;
    popover: HTMLElement;
    form: HTMLFormElement;
    id: string;
    selectionActive: boolean;

    constructor(node: ProsemirrorNode, view: EditorView, getPos: getPosParam) {
        this.img = this.createImage(node);

        this.form = this.createForm();
        this.form.addEventListener("submit", (event) =>
            this.handleChangedImageAttributes(event, getPos, view)
        );

        this.popover = this.createPopover();

        this.dom = document.createElement("span");
        this.dom.appendChild(this.img);
        this.dom.appendChild(this.popover);

    }

    ignoreMutation(): boolean {
        return true;
    }

    private createImage(node: ProsemirrorNode): HTMLImageElement {
        alert('creating math')
        const img = document.createElement("img");
        img.setAttribute("aria-controls", `img-popover-${this.id}`);
        img.setAttribute("data-controller", "s-popover");
        img.setAttribute(
            "data-action",
            "image-popover-show->s-popover#show image-popover-hide->s-popover#hide"
        );
        img.src = node.attrs.src as string;
        if (node.attrs.alt) img.alt = node.attrs.alt as string;
        if (node.attrs.title) img.title = node.attrs.title as string;

        return img;
    }

    private createForm(): HTMLFormElement {
        const form = document.createElement("form");
        form.className = "d-flex fd-column";
        form.innerHTML = `oh look, math!`;
        return form;
    }

    private createPopover(): HTMLDivElement {
        const popover = document.createElement("div");
        popover.className = "s-popover ws-normal wb-normal js-img-popover";
        popover.id = `img-popover-${this.id}`;

        // TODO added `ws-normal` to fix FF only bug. Will file bug against Stacks and revisit
        popover.innerHTML = `<div class="s-popover--arrow ws-normal"></div>`;
        popover.append(this.form);

        return popover;
    }

    private handleChangedImageAttributes(
        event: Event,
        getPos: getPosParam,
        view: EditorView
    ) {
        event.preventDefault();

        if (typeof getPos !== "function") return;

        const findInput = (selector: string): HTMLInputElement =>
            this.form.querySelector(selector);

        const src = findInput(`#img-src-${this.id}`);
        const alt = findInput(`#img-alt-${this.id}`);
        const title = findInput(`#img-title-${this.id}`);

        view.dispatch(
            view.state.tr.setNodeMarkup(getPos(), null, {
                src: src.value,
                alt: alt.value,
                title: title.value,
            })
        );

        view.focus();
    }
}
