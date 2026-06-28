<script lang="ts">
    import type { MaterialTemplateUniform } from "../../../lib/logic/material-templates/uniforms";
    import type { MaterialTemplateUniformsValues } from "../../../lib/logic/material-templates/uniforms";
    import { eventStore } from "../../../lib/events/event-store";
    import Scrubber from "../../Shared/Scrubber.svelte";
    import BooleanEditor from "../../Shared/BooleanEditor.svelte";
    import Dropdown from "../../Shared/Dropdown.svelte";
    import FoldableColorPicker from "../../Shared/FoldableColorPicker.svelte";
    import type { RawColor } from "../../../lib/core/color";
    import Slider from "../../Shared/Slider.svelte";

    export let templateId: string;
    export let uniforms: MaterialTemplateUniform[];
    export let values: MaterialTemplateUniformsValues;

    const fieldLabelClasses = "text-[0.6875rem] font-medium tracking-widest uppercase text-neutral-350";

    function commitValues(oldValues: MaterialTemplateUniformsValues, newValues: MaterialTemplateUniformsValues) {
        values = newValues;
        eventStore.push({
            category: "MaterialTemplate",
            type: "UniformsPreviewValuesChanged",
            forwardData: { templateId, uniformsPreviewValues: newValues },
            backwardData: { templateId, uniformsPreviewValues: oldValues },
        });
    }

    function commitUniformValue(key: string, oldVal: unknown, newVal: unknown) {
        const oldValues = structuredClone(values);
        const newValues = { ...values, [key]: { value: newVal } };
        commitValues(oldValues, newValues);
    }

    function commitUniformTimeScale(key: string, oldVal: number, newVal: number) {
        const oldValues = structuredClone(values);
        const newValues = { ...values, [key]: { value: newVal } };
        commitValues(oldValues, newValues);
    }

    function uniformLabel(uniform: MaterialTemplateUniform): string {
        return uniform.label ?? uniform.key;
    }
</script>

{#if uniforms.length === 0}
    <p class="text-neutral-500 text-xs px-0.5">Compile the shader to discover uniforms.</p>
{:else}
    <div class="flex flex-col gap-2 min-w-0">
        {#each uniforms as uniform (uniform.key)}
            {#if uniform.type === "slider"}
                <Slider
                    label={uniformLabel(uniform)}
                    bind:value={values[uniform.key].value}
                    options={{
                        type: "value",
                        min: uniform.min,
                        max: uniform.max,
                        step: (uniform.max - uniform.min) / 1000,
                        precision: 2,
                    }}
                    onCommit={(oldVal, newVal) => commitUniformValue(uniform.key, oldVal, newVal)}
                />
            {:else if uniform.type === "timed" && uniform.timeScale !== undefined}
                <Slider
                    label={uniformLabel(uniform)}
                    bind:value={values[uniform.key].value}
                    options={{
                        type: "value",
                        min: uniform.min ?? 0,
                        max: uniform.max ?? 4,
                        step: ((uniform.max ?? 4) - (uniform.min ?? 0)) / 1000,
                        precision: 2,
                    }}
                    onCommit={(oldVal, newVal) => commitUniformTimeScale(uniform.key, oldVal, newVal)}
                />
            {:else if uniform.type === "point2D"}
                <div class="flex flex-col gap-1 min-w-0">
                    <span class={fieldLabelClasses}>{uniformLabel(uniform)}</span>
                    <div class="grid grid-cols-2 gap-1.5">
                        <Scrubber
                            label="X"
                            bind:value={values[uniform.key].value[0]}
                            min={uniform.min[0]}
                            max={uniform.max[0]}
                            onCommit={(oldVal, newVal) => {
                                const oldValues = structuredClone(values);
                                const point = [...values[uniform.key].value] as [number, number];
                                point[0] = newVal;
                                values[uniform.key].value = point;
                                commitValues(oldValues, { ...values, [uniform.key]: { value: point } });
                            }}
                            sensitivity={0.07}
                        />
                        <Scrubber
                            label="Y"
                            bind:value={values[uniform.key].value[1]}
                            min={uniform.min[1]}
                            max={uniform.max[1]}
                            onCommit={(oldVal, newVal) => {
                                const oldValues = structuredClone(values);
                                const point = [...values[uniform.key].value] as [number, number];
                                point[1] = newVal;
                                values[uniform.key].value = point;
                                commitValues(oldValues, { ...values, [uniform.key]: { value: point } });
                            }}
                            sensitivity={0.07}
                        />
                    </div>
                </div>
            {:else if uniform.type === "color"}
                <FoldableColorPicker
                    title={uniformLabel(uniform)}
                    bind:value={values[uniform.key].value as RawColor}
                    onCommit={(oldVal, newVal) => commitUniformValue(uniform.key, oldVal, newVal)}
                />
            {:else if uniform.type === "bool"}
                <BooleanEditor
                    label={uniformLabel(uniform)}
                    bind:value={values[uniform.key].value}
                    onCommit={(oldVal, newVal) => commitUniformValue(uniform.key, oldVal, newVal)}
                />
            {:else if uniform.type === "enum"}
                <div class="flex flex-col gap-0.5 min-w-0">
                    <span class={fieldLabelClasses}>{uniformLabel(uniform)}</span>
                    <Dropdown
                        options={uniform.options.map(o => ({ value: o.id, label: o.label }))}
                        bind:value={values[uniform.key].value}
                        onCommit={(oldVal, newVal) => commitUniformValue(uniform.key, oldVal, newVal)}
                    />
                </div>
            {/if}
        {/each}
    </div>
{/if}
