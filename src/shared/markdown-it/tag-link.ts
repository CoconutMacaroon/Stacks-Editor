import MarkdownIt, { StateInline } from "markdown-it";
import type { TagLinkOptions } from "../view";

function parse_tag_link(
    state: StateInline,
    silent: boolean,
    options: TagLinkOptions
) {
    // quick fail on first character
    if (state.src.charCodeAt(state.pos) !== 0x24 /* $ */) {
        return false;
    }

    if (
        state.src.slice(state.pos, state.pos + 1) !== "$"
    ) {
        return false;
    }

    let labelEndv2 = -1;
    for (let i = state.pos + 1; i < state.src.length; ++i) {
        if (state.src.charAt(i) == '$') {
            labelEndv2 = i + 0;
            break;
        }
    }
    if (labelEndv2 === -1) {
        return false;
    }
    // const totalContent = "abc";
    const totalContent = state.src.slice(state.pos, labelEndv2);
    // const isMeta = totalContent.slice(0, 10) === "[meta-tag:";
    // const tagName = totalContent.slice(isMeta ? 10 : 5, -1);

    /*if (isMeta && options.disableMetaTags) {
        return false;
    }

    if (options.validate && !options.validate(tagName, isMeta, totalContent)) {
        return false;
    }
    */
    //if (!silent) {
    let token = state.push("tag_link_open", "a", 1);
    token.attrSet("tagName", totalContent.slice(1, totalContent.length));
    token.attrSet("tagType", "tag");
    // token.content = "xyz";

    token = state.push("text", "", 0);
    token.content = `f${totalContent.slice(1, totalContent.length)}f`;// .slice(1, -1);

    token = state.push("tag_link_close", "a", -1);
    //}

    state.pos = labelEndv2 + 1;

    return true;
}

/**
 * Parses [tag:FOO] and [meta-tag:FOO] links
 * @param md
 */
export function tagLinks(md: MarkdownIt, options: TagLinkOptions): void {
    // MarkdownIt appears to take the name of the rule-defining function as the rule name
    // and ignores the ruleName parameter. We are relying on the rule name in tests to
    // verify that it was appropriately defined.
    md.inline.ruler.push("tag_link", function tag_link(state, silent) {
        return parse_tag_link(state, silent, options);
    });
    // TODO make sure tag links are not in links
}
