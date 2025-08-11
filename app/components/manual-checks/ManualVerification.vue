<script setup lang="ts">
import type { verification, verification_job } from '@prisma/client';
import { format, set } from 'date-fns'
import { CalendarDate } from '@internationalized/date';
import ManualJob from './ManualJob.vue';

const props = defineProps<{
  verification: verification
}>()

const jobsLoading = ref(false)
const jobs = ref<verification_job[]>([])

const syncJobs = async () => {
  jobsLoading.value = true
  jobs.value = await $fetch<verification_job[]>('/api/verifications/jobs', {
    method: 'POST',
    body: JSON.stringify({ id: props.verification.id })
  })
  jobsLoading.value = false
}

watch(() => props.verification, async (newVerification) => {
  await syncJobs();
}, { immediate: true })

const emits = defineEmits(['close'])



const idNumber = ref<string>()
const idCountry = ref<string>()
const idBirthday = ref<string>()
const idExpiryDate = ref<string>()
const idName = ref<string>()

onMounted(async () => {
  await syncJobs()
})

const idBirthdayParsed = computed({
  get() {
    const date = new Date(idBirthday.value ?? '')
    return isNaN(date.getTime()) ? null : new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
  },
  set(setValue: CalendarDate | null) {
    if (setValue instanceof CalendarDate) {
      // Convert CalendarDate to JS Date and format as ISO string (UTC)
      const jsDate = new Date(Date.UTC(setValue.year, setValue.month - 1, setValue.day, 0, 0, 0, 0));
      idBirthday.value = jsDate.toISOString();
    } else {
      idBirthday.value = '';
    }
  }
})


const idExpiryDateParsed = computed({
  get() {
    const date = new Date(idExpiryDate.value ?? '')
    return isNaN(date.getTime()) ? null : new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
  },
  set(setValue: CalendarDate | null) {
    if (setValue instanceof CalendarDate) {
      // Convert CalendarDate to JS Date and format as ISO string (UTC)
      const jsDate = new Date(Date.UTC(setValue.year, setValue.month - 1, setValue.day, 0, 0, 0, 0));
      idExpiryDate.value = jsDate.toISOString();
    } else {
      idExpiryDate.value = '';
    }
  }
})

watch(jobs, (newJobs) => {
  const firstWith = (key: keyof verification_job) =>
    (newJobs.find(job => job[key])?.[key] ?? '') as string

  idNumber.value = firstWith('id_number')
  idCountry.value = firstWith('id_country')
  idBirthday.value = firstWith('birthday')?.toString() || ''
  idExpiryDate.value = firstWith('expiry_date')?.toString() || ''
  idName.value = firstWith('id_name')
})

const idIsValid = computed(() => {
  const result = false;

  for (const job of jobs.value) {
    if (job.id_valid) {
      return true
    }
  }
  return result
})

const acceptRequest = async () => {
  await $fetch('/api/verifications/change-state', {
    method: 'POST',
    body: JSON.stringify({ 
      action: 'complete',
      id: props.verification.id, 
      idData: {
        id_number: idNumber.value,
        id_country: idCountry.value,
        id_birthday: idBirthday.value,
        id_expiry_date: idExpiryDate.value,
        id_name: idName.value
      }
    })
  })

  emits('close')
}

const denyRequest = async () => {
  await $fetch('/api/verifications/change-state', {
    method: 'POST',
    body: JSON.stringify({ action: 'cancel', id: props.verification.id })
  })

  emits('close')
}

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
        <UButton
          class="m-4"
          color="error"
          :loading="loading"
          :disabled="jobsLoading"
          @click="denyRequest"
        >
          Ablehnen
        </UButton>  

        <UButton
          class="m-4"
          color="success"
          :disabled="jobsLoading"
          @click="acceptRequest"
        >
          Akzeptieren
        </UButton>  
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
      
      <div class="h-96 flex items-center justify-center" v-if="jobsLoading">
        <UIcon name="i-svg-spinners:bars-rotate-fade" class="size-6 text-muted mx-auto my-4" />
      </div>
      <div v-else>
        <template v-for="job in jobs" :key="job.id">
          <ManualJob class="m-4" :verification_job="job" />
        </template>
        <h2 class="text-2xl px-4 pt-4">Informationen</h2>
        
        <div class="p-4 flex flex-col gap-4">
          <p class="text-lg">
            <span class="font-semibold">Bestell Name:</span> 
            {{ verification.customer_name }}
          </p>
          <p class="text-muted text-sm">
            <span class="font-semibold">Ausweis Name:</span> 
            <UInput v-model="idName" />
          </p>
          <p class="text-muted text-sm">
            <span class="font-semibold">Ausweis Nummer:</span> 
            <UInput v-model="idNumber" />
          </p>
          <p class="text-muted text-sm">
            <span class="font-semibold">Ausweis Gültig Bis:</span> 
            <UInput v-model="idExpiryDate" />

            <UCalendar v-model="idExpiryDateParsed" />

          </p>
          <p class="text-muted text-sm">
            <span class="font-semibold">Ausweis Geburtsdatum:</span> 
            <UInput v-model="idBirthday" />
            <UCalendar v-model="idBirthdayParsed" />

        </p>
          <p class="text-muted text-sm">
            <span class="font-semibold">Ausweis Land:</span> 
            <UInput v-model="idCountry" />
          </p>
          <p class="text-muted text-sm">
            <span class="font-semibold">Ausweis Gültig:</span> 
            <UBadge :color="idIsValid ? 'success' : 'error'" >
              {{ idIsValid ? 'Ja' : 'Nein' }}
            </UBadge>
          </p>
        </div>

        </div>
    </div>

  </UDashboardPanel>


</template>
