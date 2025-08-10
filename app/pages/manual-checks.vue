<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { breakpointsTailwind } from '@vueuse/core'
import type { Mail } from '~/types'
import { ManualChecksList } from '#components'
import type { verification } from '@prisma/client'

const tabItems = [{
  label: 'All',
  value: 'all'
}, {
  label: 'Unread',
  value: 'unread'
}]
const selectedTab = ref('all')

const { data: verifications, refresh: refreshVerifications } = await useFetch<verification[]>('/api/verifications/manual-check', { default: () => [] })

// Filter mails based on the selected tab
const filteredMails = computed(() => {
  if (selectedTab.value === 'unread') {
    return verifications.value.filter(mail => !!mail.manual_check_wanted)
  }

  return verifications.value
})

const selectedMail = ref<verification | null>()

const isMailPanelOpen = computed({
  get() {
    return !!selectedMail.value
  },
  set(value: boolean) {
    if (!value) {
      selectedMail.value = null
    }
  }
})

const closeVerification = async () => {
  await refreshVerifications()
  if (verifications.value.length > 0) {
    selectedMail.value = verifications.value[0]
  } else {
    selectedMail.value = null
  }
}

const breakpoints = useBreakpoints(breakpointsTailwind)
const isMobile = breakpoints.smaller('lg')
</script>

<template>
  <UDashboardPanel
    id="manual-checks"
    :default-size="25"
    :min-size="20"
    :max-size="30"
    resizable
  >
    <UDashboardNavbar title="Manual Checks">
      <template #leading>
        <UDashboardSidebarCollapse />
      </template>

      <template #right>
        <UBadge :label="filteredMails.length" variant="subtle" />
      </template>
    </UDashboardNavbar>
    <ManualChecksList v-model="selectedMail" :verifications="verifications" />
  </UDashboardPanel>

  <HomeVerification v-if="selectedMail" :verification="selectedMail" @close="closeVerification" />
  <div v-else class="hidden lg:flex flex-1 items-center justify-center">
    <UIcon name="i-lucide-inbox" class="size-32 text-dimmed" />
  </div>

  <ClientOnly>
    <USlideover v-if="isMobile" v-model:open="isMailPanelOpen">
      <template #content>
        <ManualChecksVerification v-if="selectedMail" :verification="selectedMail" @close="closeVerification" />
      </template>
    </USlideover>
  </ClientOnly>
</template>
