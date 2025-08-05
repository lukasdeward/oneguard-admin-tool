<script setup lang="ts">
import type { verification_job } from '@prisma/client';
import { format } from 'date-fns';

const props = defineProps<{
  verification_job: verification_job
}>()


const description = computed(() => {
  let description='';
  if (props.verification_job.error) {
    description = 'Error: '+ props.verification_job.error;
  } else if (props.verification_job.birthday) {
    description = 'Birthday: ' + format(new Date(props.verification_job.birthday), 'dd MMM yyyy');
  } else if (props.verification_job.expiry_date) {
    description = 'Expires: ' + format(new Date(props.verification_job.expiry_date), 'dd MMM yyyy');
  } else if (props.verification_job.id_country) {
    description = 'Country: ' + props.verification_job.id_country;
  }
  return description
});
</script>

<template>

    <UPageCard
    :title="verification_job.created_at ? format(new Date(verification_job.created_at), 'dd MMM HH:mm') : ''"
    :description="description"
    icon="i-material-symbols-error"
    orientation="horizontal"
  >
    <div class="flex gap-4 overflow-x-scroll max-h-80">
      <img :src="verification_job.id_front" class="object-contain" />
      <img :src="verification_job.id_back" class="object-contain" />
      <img v-if="verification_job.face" :src="verification_job.face" class="object-contain" />
    </div>
  </UPageCard>

</template>