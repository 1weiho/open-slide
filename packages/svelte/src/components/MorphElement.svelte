<script lang="ts">
export let id: string;
export let className: string | undefined = undefined;
</script>

<div data-osd-morph={id} class={className}><slot></slot></div>
