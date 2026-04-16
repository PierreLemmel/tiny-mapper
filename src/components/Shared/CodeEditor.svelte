<script lang="ts">
    import { onMount } from "svelte";
    import { EditorView, basicSetup } from "codemirror";
    import { EditorState } from "@codemirror/state";
    import { javascript } from "@codemirror/lang-javascript";
    import { vsCodeDark } from '@fsegurai/codemirror-theme-vscode-dark'
    import { cn } from "../../lib/core/utils";

    export let value: string = "";
    export let className: string | undefined = undefined;
    export let onChange: (value: string) => void = () => {};
    export let onCommit: ((oldValue: string, newValue: string) => void) | undefined = undefined;

    let container: HTMLDivElement;
    let view: EditorView | undefined;
    let skipNextUpdate = false;
    let commitBaseline = "";
    $: commitHandler = onCommit;

    function createExtensions() {
        return [
            basicSetup,
            javascript(),
            vsCodeDark,
            EditorView.updateListener.of((update) => {
                if (update.docChanged) {
                    skipNextUpdate = true;
                    const newValue = update.state.doc.toString();
                    value = newValue;
                    onChange(newValue);
                }
            }),
            EditorView.theme({
                "&": {
                    fontSize: "12px",
                    height: "100%",
                },
                ".cm-scroller": {
                    overflow: "auto",
                },
                ".cm-content": {
                    fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace",
                },
                ".cm-gutters": {
                    fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace",
                },
            }),
        ];
    }

    onMount(() => {
        view = new EditorView({
            state: EditorState.create({
                doc: value,
                extensions: createExtensions(),
            }),
            parent: container,
        });
        commitBaseline = value;

        const onBlur = () => {
            if (!commitHandler || !view) return;
            const current = view.state.doc.toString();
            if (current !== commitBaseline) {
                commitHandler(commitBaseline, current);
                commitBaseline = current;
            }
        };
        view.dom.addEventListener("blur", onBlur);

        return () => {
            view?.dom.removeEventListener("blur", onBlur);
            view?.destroy();
        };
    });

    $: if (view && !skipNextUpdate) {
        const currentValue = view.state.doc.toString();
        if (currentValue !== value) {
            view.dispatch({
                changes: {
                    from: 0,
                    to: currentValue.length,
                    insert: value,
                },
            });
            commitBaseline = value;
        }
    } else {
        skipNextUpdate = false;
    }
</script>

<div
    bind:this={container}
    class={cn(
        "rounded-md overflow-hidden border border-neutral-700",
        className
    )}
></div>
