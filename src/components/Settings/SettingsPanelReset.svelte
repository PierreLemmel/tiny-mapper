<script lang="ts">
    import Button from "../Shared/Button.svelte";

    export let onReset: () => void;
</script>

<div class="pt-4 border-t border-neutral-800">
    <Button variant="tertiary" onClick={onReset}>Reset to default</Button>
</div>
