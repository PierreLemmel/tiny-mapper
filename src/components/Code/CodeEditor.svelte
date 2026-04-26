<script lang="ts">
    import { onMount } from "svelte";
    import { EditorView, basicSetup } from "codemirror";
    import { EditorState } from "@codemirror/state";
    import { keymap, type KeyBinding } from "@codemirror/view";

    import { vsCodeDark } from '@fsegurai/codemirror-theme-vscode-dark'
    import { cn } from "../../lib/core/utils";
    import { glsl } from "../../lib/code/glsl";

    export let value: string = "";
    export let className: string | undefined = undefined;
    export let onValueChange: (value: string) => void = () => {};
    export let keymaps: KeyBinding[] = [];

    let container: HTMLDivElement;
    let view: EditorView | undefined;

    function createExtensions() {
        return [
            basicSetup,
            glsl(),
            vsCodeDark,
            keymap.of(keymaps),
            EditorView.updateListener.of((update) => {
                if (update.docChanged) {
                    const newValue = update.state.doc.toString();
                    value = newValue;
                    onValueChange(newValue);
                }
            }),
            EditorView.theme({
                "&": {
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

        return () => {
            view?.destroy();
        };
    });

    $: {
        if (view) {
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
        }
    }
</script>

<div
    bind:this={container}
    class={cn(
        "rounded-md overflow-hidden border border-neutral-700",
        className
    )}
></div>
