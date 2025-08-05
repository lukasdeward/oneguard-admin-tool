<script setup lang="ts">
import type { verification, verification_job } from '@prisma/client';
import { format } from 'date-fns'
import Job from './Job.vue'

const props = defineProps<{
  verification: verification
}>()

const emits = defineEmits(['close'])


const jobs = ref<verification_job[]>([])

const idNumber = ref<string>()
const idCountry = ref<string>()
const idBirthday = ref<string>()
const idExpiryDate = ref<string>()
const idName = ref<string>()

onMounted(async () => {
    jobs.value = await $fetch<verification_job[]>('/api/verifications/jobs', {
        method: 'POST',
        body: JSON.stringify({ id: props.verification.id })
    })

})

watch(jobs, (newJobs) => {
    idNumber.value = newJobs.map(job => job.id_number || '')[0]
    idCountry.value = newJobs.map(job => job.id_country || '')[0]
    idBirthday.value = newJobs.map(job => job.birthday ? format(new Date(job.birthday), 'dd MMM yyyy') : '')[0]
    idExpiryDate.value = newJobs.map(job => job.expiry_date ? format(new Date(job.expiry_date), 'dd MMM yyyy') : '')[0]
    idName.value = newJobs.map(job => job.id_name || '')[0]
})

const idIsValid = computed(() => {
    jobs.value.filter(job => {
        if (job.id_valid) {
            return job.id_valid
        }
    })
})


const dropdownItems = [[{
  label: 'Mark as unread',
  icon: 'i-lucide-check-circle'
}, {
  label: 'Mark as important',
  icon: 'i-lucide-triangle-alert'
}], [{
  label: 'Star thread',
  icon: 'i-lucide-star'
}, {
  label: 'Mute thread',
  icon: 'i-lucide-circle-pause'
}]]

const toast = useToast()

const reply = ref('')
const loading = ref(false)

function onSubmit() {
  loading.value = true

  setTimeout(() => {
    reply.value = ''

    toast.add({
      title: 'Email sent',
      description: 'Your email has been sent successfully',
      icon: 'i-lucide-check-circle',
      color: 'success'
    })

    loading.value = false
  }, 1000)
}
</script>

<template>
  <UDashboardPanel id="inbox-2">
    <UDashboardNavbar :title="verification.customer_name" :toggle="false">
      <template #leading>
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          class="-ms-1.5"
          @click="emits('close')"
        />
      </template>

      <template #right>
        <UTooltip text="Archive">
          <UButton
            icon="i-lucide-inbox"
            color="neutral"
            variant="ghost"
          />
        </UTooltip>

        <UTooltip text="Reply">
          <UButton icon="i-lucide-reply" color="neutral" variant="ghost" />
        </UTooltip>

        <UDropdownMenu :items="dropdownItems">
          <UButton
            icon="i-lucide-ellipsis-vertical"
            color="neutral"
            variant="ghost"
          />
        </UDropdownMenu>
      </template>
    </UDashboardNavbar>

    <div class="flex flex-col sm:flex-row justify-between gap-1 p-4 sm:px-6 border-b border-default">
      <div class="flex items-start gap-4 sm:my-1.5">


        <div class="min-w-0">
          <p class="font-semibold text-highlighted">
            {{ verification.customer_name }}
          </p>
          <p class="text-muted">
            {{ verification.customer_email }}
          </p>
        </div>
      </div>

      <p class="max-sm:pl-16 text-muted text-sm sm:mt-2">
        {{ format(new Date(verification.created_at), 'dd MMM HH:mm') }}
      </p>

    </div>

    <div class="overflow-y-auto divide-y divide-default">

        <template v-for="job in jobs" :key="job.id">
          <Job class="m-4" :verification_job="job" />
        </template>
        <h2 class="text-2xl px-4 pt-4">Informationen</h2>
        
        <div class="p-4 flex flex-col gap-4">
          <p class="text-muted text-sm">
            <span class="font-semibold">Bestell Name:</span> {{ verification.customer_name }}
          </p>
          <p class="text-muted text-sm">
            <span class="font-semibold">Ausweis Name:</span> {{ idName }}
            <UInput v-model="idName" />
          </p>
          <p class="text-muted text-sm">
            <span class="font-semibold">Ausweis Nummer:</span> {{ idNumber }}
            <UInput v-model="idNumber" />
          </p>
          <p class="text-muted text-sm">
            <span class="font-semibold">Ausweis Gültig Bis:</span> {{ idExpiryDate }}
            <UInput v-model="idExpiryDate" />

          </p>
          <p class="text-muted text-sm">
            <span class="font-semibold">Ausweis Geburtsdatum:</span> {{ idBirthday }}
            <UInput v-model="idBirthday" />

        </p>

        </div>
    </div>

  </UDashboardPanel>


</template>
