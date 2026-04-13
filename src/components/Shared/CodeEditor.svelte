<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { EditorView, basicSetup } from "codemirror";
    import { EditorState } from "@codemirror/state";
    import { javascript } from "@codemirror/lang-javascript";
    import { oneDark } from "@codemirror/theme-one-dark";
    import { cn } from "../../lib/core/utils";

    export let value: string = "";
    export let className: string | undefined = undefined;
    export let onChange: (value: string) => void = () => {};

    let container: HTMLDivElement;
    let view: EditorView | undefined;
    let skipNextUpdate = false;

    function createExtensions() {
        return [
            basicSetup,
            javascript(),
            oneDark,
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
                    maxHeight: "300px",
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
    });

    onDestroy(() => {
        view?.destroy();
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
