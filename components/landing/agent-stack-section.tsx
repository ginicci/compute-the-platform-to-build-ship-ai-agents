type StackItem = {
  name: string;
  category: string;
  description: string;
};

type StackGroup = {
  label: string;
  items: StackItem[];
};

const stackGroups: StackGroup[] = [
  {
    label: "Agents",
    items: [
      {
        name: "Cloud Agents",
        category: "Runtime",
        description: "Long-running agents that execute in isolated cloud sandboxes, not on your laptop.",
      },
      {
        name: "Agent Runtime",
        category: "Runtime",
        description: "Durable steps, retries, and resumable workflows so agent runs survive restarts.",
      },
      {
        name: "OpenClaw",
        category: "Open source",
        description: "Run open-source personal agents alongside your own, with shared tools and memory.",
      },
      {
        name: "Hermes Agent",
        category: "Open source",
        description: "Plug in self-improving Hermes agents and route tasks to them from one place.",
      },
    ],
  },
  {
    label: "Channels",
    items: [
      {
        name: "Telegram",
        category: "Channel",
        description: "Talk to your agents in Telegram chats and get results back in the same thread.",
      },
      {
        name: "GitHub Pull Requests",
        category: "Code",
        description: "Agents open, review, and update pull requests, then send them to you to merge.",
      },
      {
        name: "Resend",
        category: "Email",
        description: "Transactional email for sign-up verification, alerts, and agent reports.",
      },
    ],
  },
  {
    label: "Platform",
    items: [
      {
        name: "Vercel",
        category: "Deploy",
        description: "Preview and production deploys, AI Gateway, and serverless functions.",
      },
      {
        name: "Google Cloud",
        category: "Cloud",
        description: "Connect GCP workloads, storage, and Vertex AI models to your agents.",
      },
      {
        name: "Monorepo",
        category: "Structure",
        description: "Web, mobile, and agent packages in one repo with shared types and tooling.",
      },
    ],
  },
  {
    label: "Languages & clients",
    items: [
      {
        name: "Node.js",
        category: "Language",
        description: "TypeScript-first SDKs and server runtimes for agent tools and APIs.",
      },
      {
        name: "Python",
        category: "Language",
        description: "Bring Python tools, notebooks, and ML code into the same agent workflows.",
      },
      {
        name: "Expo",
        category: "Mobile",
        description: "Ship iOS and Android apps that talk to your agents from one React codebase.",
      },
      {
        name: "Lynx",
        category: "Cross-platform",
        description: "Build native, high-performance UIs with web skills across mobile and web.",
      },
      {
        name: "WebGL",
        category: "Graphics",
        description: "GPU-rendered 3D and data visuals for live agent dashboards.",
      },
    ],
  },
];

export function AgentStackSection() {
  return (
    <section id="agent-stack" aria-labelledby="agent-stack-heading" className="relative">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-16 px-6 py-32 lg:px-12 lg:py-40">
        <header className="flex flex-col gap-8">
          <span className="inline-flex items-center gap-4 font-mono text-sm text-muted-foreground">
            <span className="h-px w-12 bg-foreground/20" />
            Agent stack
          </span>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <h2
              id="agent-stack-heading"
              className="text-balance font-display text-5xl leading-[0.95] tracking-tight md:text-6xl lg:text-7xl"
            >
              Every agent, channel,
              <br />
              <span className="text-muted-foreground">and runtime in one place.</span>
            </h2>
            <p className="max-w-md text-pretty text-lg leading-relaxed text-muted-foreground">
              Run cloud agents, reach people where they already are, and ship to web, mobile, and
              GPU from a single monorepo.
            </p>
          </div>
        </header>

        <div className="flex flex-col gap-12">
          {stackGroups.map((group) => (
            <div key={group.label} className="flex flex-col gap-4">
              <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {group.label}
              </h3>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {group.items.map((item) => (
                  <li
                    key={item.name}
                    className="group relative flex flex-col gap-3 border border-foreground/10 p-6 transition-colors hover:border-foreground/40 hover:bg-foreground/[0.03]"
                  >
                    <span className="self-start bg-foreground/10 px-2 py-0.5 font-mono text-[10px] text-muted-foreground transition-colors group-hover:bg-foreground group-hover:text-background">
                      {item.category}
                    </span>
                    <span className="text-lg font-medium">{item.name}</span>
                    <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
