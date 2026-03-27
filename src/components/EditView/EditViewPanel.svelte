<script lang="ts">
    import { cn } from "../../lib/core/utils";
    import MainEditView from "./MainEditView.svelte";
    import MainEditViewToolbar from "./MainEditViewToolbar.svelte";

    export let className: string | undefined = undefined;
</script>

<div class={cn(
    "flex flex-col w-full h-full min-w-0 min-h-0",
    className
)}>
    <MainEditViewToolbar />
    <MainEditView />
</div>