<script setup lang="ts">
import { format, isToday } from 'date-fns'
import type { verification } from '@prisma/client';

const props = defineProps<{
  verifications: verification[]
}>()

const mailsRefs = ref<Record<string, Element>>({})

const selectedMail = defineModel<verification | null>()

watch(selectedMail, () => {
  if (!selectedMail.value) {
    return
  }

  const ref = mailsRefs.value[selectedMail.value.id]
  
  if (ref) {
    ref.scrollIntoView({ block: 'nearest' })
  }
})

defineShortcuts({
  arrowdown: () => {
    const index = props.verifications.findIndex(mail => mail.id === selectedMail.value?.id)

    if (index === -1) {
      selectedMail.value = props.verifications[0]
    } else if (index < props.verifications.length - 1) {
      selectedMail.value = props.verifications[index + 1]
    }
  },
  arrowup: () => {
    const index = props.verifications.findIndex(mail => mail.id === selectedMail.value?.id)

    if (index === -1) {
      selectedMail.value = props.verifications[props.verifications.length - 1]
    } else if (index > 0) {
      selectedMail.value = props.verifications[index - 1]
    }
  }
})
</script>

<template>
  <div class="overflow-y-auto divide-y divide-default">
    <div
      v-for="(verification, index) in verifications"
      :key="index"
      :ref="el => { mailsRefs[verification.id] = el as Element }"
    >
      <div
        class="p-4 sm:px-6 text-sm cursor-pointer border-l-2 transition-colors"
        :class="[
          verification.done ? 'text-highlighted' : 'text-toned',
          selectedMail && selectedMail.id === verification.id ? 'border-primary bg-primary/10' : 'border-(--ui-bg) hover:border-primary hover:bg-primary/5',
          verification.done ? 'bg-green-200' : '',
        ]"
        @click="selectedMail = verification"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            {{ verification.customer_name }}
          </div>
        </div>
        <p class="text-dimmed line-clamp-1">
          {{ verification.customer_email }}
        </p>
        <p v-if="verification.started">
          <span class="text-muted">Gestartet:</span>
          {{ format(new Date(verification.started), 'dd MMM HH:mm') }}
        </p>
      </div>
    </div>
  </div>
</template>
