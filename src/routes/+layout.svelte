<script lang="ts">
  import '../app.css';
  import type { LayoutData } from './$types';

  let { data, children }: { data: LayoutData; children: any } = $props();

  const navLinks = [
    { href: '/',             label: 'Dashboard'    },
    { href: '/ledger',       label: 'Ledger'       },
    { href: '/reports',      label: 'Reports'      },
    { href: '/equity',       label: 'Equity'       },
    { href: '/loans',        label: 'Loans'        },
    { href: '/balances',     label: 'Balances'     },
    { href: '/hospitality',  label: 'Hospitality'  },
    { href: '/workforce',   label: 'Workforce'    },
    { href: '/settings',     label: 'Settings'     },
  ];
</script>

<div class="min-h-screen flex bg-stone-950 text-stone-100 font-sans">
  <!-- Sidebar -->
  <aside class="w-56 shrink-0 bg-stone-900 border-r border-stone-800 flex flex-col">
    <div class="p-4 border-b border-stone-800">
      <h1 class="text-lg font-bold text-amber-400 leading-tight">Trollskull Inc.</h1>
      <p class="text-xs text-stone-400 mt-1">{data.moonEmoji} {data.currentDateFormatted}</p>
    </div>
    <nav class="flex-1 p-2 space-y-1">
      {#each navLinks as link}
        <a
          href={link.href}
          class="block px-3 py-2 rounded text-sm text-stone-300 hover:bg-stone-800 hover:text-amber-400 transition-colors"
        >
          {link.label}
        </a>
      {/each}
    </nav>
  </aside>

  <!-- Main content -->
  <main class="flex-1 overflow-auto p-6">
    {@render children()}
  </main>
</div>
