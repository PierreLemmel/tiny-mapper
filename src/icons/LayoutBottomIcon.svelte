<script lang="ts">
    export let className: string | undefined = undefined;

    export let filled: boolean = true;
</script>

<svg
    viewBox="0 0 24 24"
    fill="currentColor"
    class={className}
    aria-hidden="true"
>
    <rect x="2" y="3" width="20" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <rect x="2" y="15" width="20" height="6" fill={filled ? "currentColor" : "none"} stroke-linejoin="round" stroke="currentColor" stroke-width="1"/>
</svg>
