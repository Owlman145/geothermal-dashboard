<template>
  <div class="btn-group">
    <button type="button"
      v-for="(val, key) in values"
      :key=val
      @click="$emit('change', key)"
      :class="['btn', { 'btn-primary': selected === key, 'btn-default': selected !== key }]"
      >{{ val }}</button>
  </div>
</template>

<script>

export default {
  name: 'vue-toggle',
  props: ['values','selected','default']
}
</script>

<style lang="scss" scoped>
$purple: #5c4084;
.btn {
  height: 30px;
}
.btn.btn-primary {
  background-color: $purple;
  border-color: $purple;
  outline: none;
  &:hover {
    background-color: darken($purple, 10%);
    border-color: darken($purple, 10%);
  }
  &:active, &:focus {
    background-color: lighten($purple, 5%);
    border-color: lighten($purple, 5%);
  }
}
.btn.btn-default {
  &:hover {
    background-color: darken($purple, 10%);
    border-color: darken($purple, 10%);
    color: #fff;
  }
  &:active, &:focus {
    background-color: lighten($purple, 5%);
    border-color: lighten($purple, 5%);
    color: #fff;
  }
}
</style>
