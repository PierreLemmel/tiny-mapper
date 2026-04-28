import {
    StreamLanguage,
    LanguageSupport,
    type StreamParser,
} from "@codemirror/language";
import {
    glslKeywords,
    glslAtoms,
    glslTypes,
    glslBuiltinFunctions,
    glslBuiltinVars,
} from "./glsl-keywords";

interface GlslState {
    inBlockComment: boolean;
    inLineMetaComment: boolean;
    inBlockMetaComment: boolean;
}

const isIdentStart = (ch: string) => /[A-Za-z_]/.test(ch);
const isIdentPart = (ch: string) => /[A-Za-z0-9_]/.test(ch);
const isDigit = (ch: string) => ch >= "0" && ch <= "9";
const isOperatorChar = (ch: string) => /[+\-*/%<>=!&|^~?:]/.test(ch);

function consumeBlockComment(stream: any, state: GlslState): string {
    let maybeEnd = false;
    let ch: string | undefined;
    while ((ch = stream.next()) != null) {
        if (maybeEnd && ch === "/") {
            state.inBlockComment = false;
            return "blockComment";
        }
        maybeEnd = ch === "*";
    }
    return "blockComment";
}

function consumeNumber(stream: any): string {
    stream.backUp(1);
    if (stream.match(/^0[xX][0-9a-fA-F]+[uU]?/)) return "number";
    if (stream.match(/^\d+\.\d*([eE][+-]?\d+)?[fF]?/)) return "number";
    if (stream.match(/^\.\d+([eE][+-]?\d+)?[fF]?/)) return "number";
    if (stream.match(/^\d+([eE][+-]?\d+)[fF]?/)) return "number";
    if (stream.match(/^\d+[uUfF]?/)) return "number";
    stream.next();
    return "number";
}

function consumeQuotedString(stream: any, quote: string): void {
    let escaped = false;
    let c: string | null | undefined;
    while ((c = stream.next()) != null) {
        if (c === quote && !escaped) break;
        escaped = !escaped && c === "\\";
    }
}

function lineStartsWithMetaBlock(stream: any): boolean {
    const rest = stream.string.slice(stream.pos);
    return /^\s*\{[^{}\n]*\}\s*$/.test(rest);
}

function lineStartsBlockMetaComment(stream: any): boolean {
    const rest = stream.string.slice(stream.pos);
    return /^\s*\{/.test(rest);
}

function consumeMetaToken(stream: any): string | null {
    if (stream.eatSpace()) return null;

    const ch = stream.peek();
    if (ch === '"' || ch === "'") {
        stream.next();
        consumeQuotedString(stream, ch);
        return "annotation";
    }

    if (stream.match(/^[\{\}\[\]]/)) return "annotation";
    if (stream.match(/^[,:]/)) return "annotation";
    if (
        stream.match(
            /^-?(?:\d+\.\d*|\.\d+|\d+)(?:[eE][+-]?\d+)?[fFuU]?/,
        )
    ) {
        return "annotation";
    }
    if (stream.match(/^[A-Za-z_][A-Za-z0-9_]*/)) {
        return "annotation";
    }

    stream.next();
    return "annotation";
}

function consumeLineMetaToken(
    stream: any,
    state: GlslState,
): string | null {
    if (stream.eatSpace()) return null;

    if (stream.match("}")) {
        state.inLineMetaComment = false;
        return "annotation";
    }
    return consumeMetaToken(stream);
}

function consumeBlockMetaToken(
    stream: any,
    state: GlslState,
): string | null {
    if (stream.eatSpace()) return null;

    if (stream.match("*/")) {
        state.inBlockMetaComment = false;
        return "annotation";
    }
    return consumeMetaToken(stream);
}

export const glslParser: StreamParser<GlslState> = {
    name: "glsl",

    startState(): GlslState {
        return {
            inBlockComment: false,
            inLineMetaComment: false,
            inBlockMetaComment: false,
        };
    },

    copyState(state: GlslState): GlslState {
        return {
            inBlockComment: state.inBlockComment,
            inLineMetaComment: state.inLineMetaComment,
            inBlockMetaComment: state.inBlockMetaComment,
        };
    },

    token(stream, state) {
        if (state.inBlockComment) {
            return consumeBlockComment(stream, state);
        }

        if (state.inBlockMetaComment) {
            return consumeBlockMetaToken(stream, state);
        }

        if (state.inLineMetaComment) {
            return consumeLineMetaToken(stream, state);
        }

        if (stream.eatSpace()) return null;

        if (stream.sol() && stream.match(/^\s*#[^\n]*/)) {
            return "meta";
        }

        if (stream.match("//")) {
            if (lineStartsWithMetaBlock(stream)) {
                state.inLineMetaComment = true;
                return "annotation";
            }
            stream.skipToEnd();
            return "lineComment";
        }

        if (stream.match("/*")) {
            if (lineStartsBlockMetaComment(stream)) {
                state.inBlockMetaComment = true;
                return "annotation";
            }
            state.inBlockComment = true;
            return consumeBlockComment(stream, state);
        }

        const ch = stream.next();
        if (ch == null) return null;

        if (
            isDigit(ch) ||
            (ch === "." && isDigit(stream.peek() ?? ""))
        ) {
            return consumeNumber(stream);
        }

        if (ch === '"' || ch === "'") {
            consumeQuotedString(stream, ch);
            return "string";
        }

        if (isIdentStart(ch)) {
            while (isIdentPart(stream.peek() ?? "")) stream.next();
            const word = stream.current();
            if (glslKeywords.has(word)) return "keyword";
            if (glslAtoms.has(word)) return "atom";
            if (glslTypes.has(word)) return "typeName";
            if (glslBuiltinFunctions.has(word)) return "variableName.standard";
            if (glslBuiltinVars.has(word)) return "variableName.standard";
            return "variableName";
        }

        if (isOperatorChar(ch)) {
            while (isOperatorChar(stream.peek() ?? "")) stream.next();
            return "operator";
        }

        if ("{}()[]".includes(ch)) return "bracket";
        if (",;.".includes(ch)) return "punctuation";

        return null;
    },

    languageData: {
        commentTokens: { line: "//", block: { open: "/*", close: "*/" } },
        closeBrackets: { brackets: ["(", "[", "{", '"'] },
        indentOnInput: /^\s*[}\])]$/,
    },
};

export const glslLanguage = StreamLanguage.define(glslParser);

export function glsl(): LanguageSupport {
    return new LanguageSupport(glslLanguage);
}
