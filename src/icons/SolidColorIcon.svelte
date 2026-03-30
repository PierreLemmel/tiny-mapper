<script lang="ts">
    import { cn } from "../lib/core/utils";

    export let className: string | undefined = undefined;
</script>

<svg
    class={cn("stroke-current", className)}
    viewBox="0 0 24 24"
    fill="none"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
>
    <circle cx="8.1" cy="15.7" r="1.2" />
    <circle cx="7.5" cy="10" r="1.2" />
    <circle cx="12.1" cy="6.8" r="1.2" />
    <circle cx="17.1" cy="9.5" r="1.2" />
    <path transform="scale(0.9) translate(1.2, 1.2)" d="M12.5.007A12,12,0,0,0,.083,12a12.014,12.014,0,0,0,12,12c.338,0,.67-.022,1-.05a1,1,0,0,0,.916-1l-.032-3.588A3.567,3.567,0,0,1,20.057,16.8l.1.1a1.912,1.912,0,0,0,1.769.521,1.888,1.888,0,0,0,1.377-1.177A11.924,11.924,0,0,0,24.08,11.7,12.155,12.155,0,0,0,12.5.007Z"/>
</svg>
