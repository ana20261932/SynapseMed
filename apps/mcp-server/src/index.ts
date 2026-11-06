import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { z } from 'zod';
import { createServer } from 'http';
import { buildExpressApp } from './express.js';

// --- Skill catalog (110 skills from /home/ntwana/.kilo/skills/ + project skills) ---

interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  source: 'global' | 'project';
}

const SKILLS: Skill[] = [
  { id: 'accessibility', name: 'Accessibility', description: 'Guide for building accessible digital products that comply with WCAG 2.2 and Section 508. Covers semantic HTML, ARIA, keyboard navigation, color contrast, screen reader testing, mobile accessibility, assistive technology, and accessibility testing in CI.', category: 'web', source: 'global' },
  { id: 'ai-agents', name: 'AI Agents', description: 'Guide for building autonomous AI agents that plan, use tools, and act in environments.', category: 'ai', source: 'global' },
  { id: 'android-native', name: 'Android Native Development', description: 'Android Native Development', category: 'mobile', source: 'global' },
  { id: 'ansible', name: 'Ansible', description: 'Guide for Ansible Configuration Management. Covers inventory design, playbook structure, roles, variables, Vault secrets, idempotency, module selection, testing, and best practices for infrastructure automation.', category: 'devops', source: 'global' },
  { id: 'api-design', name: 'API Design', description: 'Guide for designing clean, consistent, and maintainable APIs. Covers REST and GraphQL patterns, resource modeling, versioning, authentication, error handling, and documentation.', category: 'web', source: 'global' },
  { id: 'argocd', name: 'ArgoCD', description: 'Guide for ArgoCD GitOps. Covers installation, Applications and AppProjects, sync policies, auto-sync, pruning, self-health, rollback, health tracking, and best practices for continuous delivery on Kubernetes.', category: 'kubernetes', source: 'global' },
  { id: 'aws-mcp', name: 'AWS MCP', description: 'Guide for building the AWS MCP Server, enabling LLMs to interact with AWS services via the Model Context Protocol for EC2, S3, IAM, Lambda, CloudWatch, and other AWS services.', category: 'mcp', source: 'global' },
  { id: 'azure-mcp', name: 'Azure MCP', description: 'Guide for building the Azure MCP Server, enabling LLMs to interact with Azure services via the Model Context Protocol for Azure Resource Manager, compute, storage, and other Azure services.', category: 'mcp', source: 'global' },
  { id: 'flutter-desktop', name: 'Flutter Desktop Development', description: 'Flutter Desktop Development', category: 'desktop', source: 'global' },
  { id: 'ai-safety', name: 'AI Safety', description: 'Guide for building AI systems that are aligned, robust, and safe to deploy.', category: 'ai', source: 'global' },
  { id: 'anomaly-detection', name: 'Anomaly Detection', description: 'Anomaly Detection', category: 'ai', source: 'global' },
  { id: 'bioinformatics', name: 'Bioinformatics', description: 'Bioinformatics', category: 'science', source: 'global' },
  { id: 'blockchain-web3', name: 'Blockchain/Web3 Development', description: 'Blockchain/Web3 Development', category: 'blockchain', source: 'global' },
  { id: 'cert-manager', name: 'cert-manager', description: 'Guide for cert-manager TLS automation on Kubernetes. Covers installation, Issuers and ClusterIssuers (Lets Encrypt ACME, self-signed, CA, Vault, Venafi), Certificate resources, DNS01 and HTTP01 challenges, wildcard certificates, key algorithms and sizes, renewal, trust bundles, and best practices for automated certificate lifecycle management.', category: 'kubernetes', source: 'global' },
  { id: 'ci-cd-mcp', name: 'CI/CD MCP', description: 'Build and operate MCP servers that expose CI/CD pipeline operations—run, status, logs, artifacts, triggers, and deployments—to AI agents.', category: 'mcp', source: 'global' },
  { id: 'ci-cd-pipelines', name: 'CI/CD Pipelines', description: 'Guide for designing and operating continuous integration and continuous deployment pipelines. Covers pipeline stages, triggering strategies, testing, security scanning, artifact management, deployment patterns, rollback, and observability.', category: 'devops', source: 'global' },
  { id: 'cloudformation-cdk', name: 'CloudFormation and AWS CDK', description: 'Guide for CloudFormation and AWS CDK infrastructure. Covers template design, CDK constructs, stack organization, parameters, outputs, drift detection, change sets, testing, and security best practices.', category: 'infrastructure', source: 'global' },
  { id: 'code-review', name: 'Code Review', description: 'Code review best practices, checklist, and process for high-quality software delivery', category: 'process', source: 'global' },
  { id: 'communication-mcp', name: 'Communication MCP', description: 'Guide for building Communication MCP Servers that expose chat, email, messaging, ticketing, and real-time communication platform capabilities to LLMs via the Model Context Protocol.', category: 'mcp', source: 'global' },
  { id: 'compliance', name: 'Compliance Engineering', description: 'Guide for compliance engineering: control implementation, audit automation, evidence collection, regulatory mapping (SOC 2, ISO 27001, GDPR, HIPAA, PCI DSS), policy-as-code, and continuous compliance monitoring.', category: 'compliance', source: 'global' },
  { id: 'computer-vision', name: 'Computer Vision', description: 'Computer Vision', category: 'ai', source: 'global' },
  { id: 'cross-platform', name: 'Cross-Platform Development', description: 'Guide for cross-platform development targeting multiple operating systems and architectures from a single codebase. Covers Electron, Tauri, Flutter, React Native, Qt, native abstraction layers, platform-specific code, packaging, signing, and testing across desktop and mobile targets.', category: 'mobile', source: 'global' },
  { id: 'cryptography', name: 'Applied Cryptography', description: 'Guide for applied cryptography: symmetric and asymmetric encryption, hashing, digital signatures, key management, random number generation, and secure protocol design.', category: 'security', source: 'global' },
  { id: 'custom-mcp-framework', name: 'Custom MCP Framework', description: 'Guide for building custom MCP (Model Context Protocol) server frameworks and reusable SDKs that accelerate creation of domain-specific MCP servers.', category: 'mcp', source: 'global' },
  { id: 'data-engineering', name: 'Data Engineering', description: 'Data Engineering', category: 'data', source: 'global' },
  { id: 'data-visualization', name: 'Data Visualization', description: 'Data Visualization', category: 'data', source: 'global' },
  { id: 'database-design', name: 'Database Design', description: 'Database Design', category: 'data', source: 'global' },
  { id: 'database-mcp', name: 'Database MCP', description: 'Build and operate MCP servers that expose database operations, schema introspection, query execution, and migration tools to AI agents.', category: 'mcp', source: 'global' },
  { id: 'design-systems', name: 'Design Systems', description: 'Design system principles, token architecture, component libraries, and governance', category: 'design', source: 'global' },
  { id: 'desktop-auto-updates', name: 'Desktop Auto-Updates', description: 'Desktop application auto-update mechanisms with signed updates, delta patches, rollback, and staged releases', category: 'desktop', source: 'global' },
  { id: 'desktop-system-integration', name: 'Desktop System Integration', description: 'Desktop system integration with native menus, tray icons, notifications, file associations, drag and drop, and global shortcuts', category: 'desktop', source: 'global' },
  { id: 'desktop-testing', name: 'Desktop Testing', description: 'Desktop application testing with unit, integration, and end-to-end strategies across Windows, macOS, and Linux', category: 'desktop', source: 'global' },
  { id: 'disaster-recovery', name: 'Disaster Recovery', description: 'Disaster recovery with RTO/RPO targets, backup strategies, failover, runbooks, and recovery testing', category: 'devops', source: 'global' },
  { id: 'docker-containerization', name: 'Docker Containerization', description: 'Guide for building, securing, and operating Docker containers. Covers Dockerfile best practices, multi-stage builds, image optimization, image security, networking, volumes, Compose, and container runtime operations.', category: 'devops', source: 'global' },
  { id: 'docker-mcp', name: 'Docker MCP', description: 'Build and operate MCP servers that expose Docker container and image operations—run, stop, logs, inspect, build, and prune—to AI agents.', category: 'mcp', source: 'global' },
  { id: 'documentation-mcp', name: 'Documentation MCP', description: 'Guide for building Documentation MCP Servers that expose knowledge bases, wikis, API references, and technical docs to LLMs via the Model Context Protocol.', category: 'mcp', source: 'global' },
  { id: 'edge-computing', name: 'Edge Computing', description: 'Edge computing with distributed processing at the edge, IoT gateways, latency-sensitive workloads, and cloud synchronization', category: 'infrastructure', source: 'global' },
  { id: 'electron-development', name: 'Electron Desktop Development', description: 'Electron Desktop Development', category: 'desktop', source: 'global' },
  { id: 'embedded-systems', name: 'Embedded Systems', description: 'Embedded Systems', category: 'embedded', source: 'global' },
  { id: 'external-dns', name: 'External DNS', description: 'Guide for External DNS automation on Kubernetes. Covers installation, DNS providers (Route53, Cloudflare, Google Cloud DNS, Azure DNS, TXT registry), source types (Ingress, Service, Contour HTTPProxy), annotations, RBAC, domain and annotation filtering, sync policies, dual-stack, and best practices.', category: 'kubernetes', source: 'global' },
  { id: 'financial-engineering', name: 'Financial Engineering', description: 'Guide for financial engineering: quantitative modeling, derivatives pricing, risk management, portfolio optimization, and financial systems engineering.', category: 'finance', source: 'global' },
  { id: 'fine-tuning', name: 'Fine-tuning', description: 'Fine-tuning', category: 'ai', source: 'global' },
  { id: 'flutter-development', name: 'Flutter Development', description: 'Flutter Development', category: 'mobile', source: 'global' },
  { id: 'game-development', name: 'Game Development', description: 'Game Development', category: 'games', source: 'global' },
  { id: 'gcp-mcp', name: 'GCP MCP', description: 'Guide for building the GCP MCP Server, enabling LLMs to interact with Google Cloud services via the Model Context Protocol.', category: 'mcp', source: 'global' },
  { id: 'github-mcp', name: 'GitHub MCP', description: 'Guide for building the GitHub MCP Server, enabling LLMs to interact with the GitHub REST and GraphQL APIs via the Model Context Protocol.', category: 'mcp', source: 'global' },
  { id: 'gitlab-mcp', name: 'GitLab MCP', description: 'Guide for building the GitLab MCP Server, enabling LLMs to interact with the GitLab REST API via the Model Context Protocol.', category: 'mcp', source: 'global' },
  { id: 'gitops-workflows', name: 'GitOps Workflows', description: 'Guide for GitOps workflows using Git as the single source of truth for declarative infrastructure and application delivery.', category: 'devops', source: 'global' },
  { id: 'helm', name: 'Helm Charts', description: 'Guide for Helm Charts. Covers chart structure, templates, values, helpers, hooks, dependencies, testing, security, and best practices for packaging and deploying Kubernetes applications.', category: 'kubernetes', source: 'global' },
  { id: 'internationalization', name: 'Internationalization', description: 'Internationalization (i18n) best practices and patterns for multilingual applications', category: 'web', source: 'global' },
  { id: 'ios-native', name: 'iOS Native Development', description: 'iOS Native Development', category: 'mobile', source: 'global' },
  { id: 'iot-edge', name: 'IoT/Edge Development', description: 'IoT/Edge Development', category: 'embedded', source: 'global' },
  { id: 'istio', name: 'Istio', description: 'Guide for Istio service mesh. Covers installation, service mesh architecture, sidecar and ambient mesh, traffic management (Gateway, VirtualService, DestinationRule), security (mTLS, PeerAuthentication, AuthorizationPolicy), observability, multi-cluster mesh, and best practices.', category: 'kubernetes', source: 'global' },
  { id: 'kilo-config', name: 'Kilo Config', description: 'Guide for Kilo configuration: config paths, kilo.json fields, commands, agents, skills, permissions, MCPs, providers, TUI settings, plus Agent Manager worktree setup/run scripts, workflows, and state.', category: 'kilo', source: 'global' },
  { id: 'kubernetes', name: 'Kubernetes', description: 'Guide for designing, deploying, and operating applications on Kubernetes. Covers core objects, workload controllers, networking, configuration, security, scheduling, observability, and GitOps practices.', category: 'kubernetes', source: 'global' },
  { id: 'kubernetes-mcp', name: 'Kubernetes MCP', description: 'Build and operate MCP servers that expose Kubernetes cluster operations—pods, deployments, services, logs, events, and rbac—to AI agents.', category: 'mcp', source: 'global' },
  { id: 'kustomize', name: 'Kustomize', description: 'Guide for Kustomize configuration management. Covers kustomization design, bases and overlays, patches, generators, transformers, image updates, namespace and nameprefix management, testing, and security best practices.', category: 'kubernetes', source: 'global' },
  { id: 'llm-integration', name: 'LLM Integration', description: 'LLM Integration', category: 'ai', source: 'global' },
  { id: 'mcp-builder', name: 'MCP Builder', description: 'Guide for creating high-quality MCP (Model Context Protocol) servers that enable LLMs to interact with external services through well-designed tools.', category: 'mcp', source: 'global' },
  { id: 'mlops', name: 'MLOps', description: 'MLOps', category: 'ai', source: 'global' },
  { id: 'mobile-app-store', name: 'Mobile App Store', description: 'App Store deployment for iOS and Android with App Store Connect, Google Play Console, build submission, review guidelines, and beta testing', category: 'mobile', source: 'global' },
  { id: 'mobile-offline-first', name: 'Mobile Offline-First', description: 'Offline-First Mobile development with local data storage, sync queues, conflict resolution, and connectivity-aware UI', category: 'mobile', source: 'global' },
  { id: 'mobile-push-notifications', name: 'Mobile Push Notifications', description: 'Push notifications for mobile apps with FCM, APNs, token management, permission handling, and foreground/background notification handling', category: 'mobile', source: 'global' },
  { id: 'mobile-testing', name: 'Mobile Testing', description: 'Mobile Testing', category: 'mobile', source: 'global' },
  { id: 'model-compression', name: 'Model Compression', description: 'Guide for reducing AI model size and inference cost while preserving accuracy.', category: 'ai', source: 'global' },
  { id: 'monitoring-mcp', name: 'Monitoring MCP', description: 'Build and operate MCP servers that expose monitoring, observability, and alerting data—metrics, logs, traces, dashboards, and alerts—to AI agents.', category: 'mcp', source: 'global' },
  { id: 'monitoring-observability', name: 'Monitoring and Observability', description: 'Guide for Monitoring and Observability. Covers metrics, logging, tracing, alerting, dashboards, SLOs/SLIs, instrumentation, OpenTelemetry, Prometheus, Grafana, and best practices for observability across cloud-native systems.', category: 'devops', source: 'global' },
  { id: 'native-macos', name: 'Native macOS Development', description: 'Native macOS Development', category: 'desktop', source: 'global' },
  { id: 'nlp-processing', name: 'NLP Processing', description: 'NLP Processing', category: 'ai', source: 'global' },
  { id: 'package-registry-mcp', name: 'Package Registry MCP', description: 'Guide for building Package Registry MCP Servers that expose software package discovery, versioning, dependency, vulnerability, and publishing capabilities to LLMs via the Model Context Protocol.', category: 'mcp', source: 'global' },
  { id: 'packer', name: 'Packer', description: 'Guide for Packer image building. Covers template design, builder configuration, provisioners, variables, multi-region image distribution, image validation, testing, and security best practices.', category: 'infrastructure', source: 'global' },
  { id: 'performance-optimization', name: 'Performance Optimization', description: 'Guide for optimizing application and infrastructure performance across frontend, backend, database, and network layers.', category: 'performance', source: 'global' },
  { id: 'privacy-engineering', name: 'Privacy Engineering', description: 'Guide for privacy engineering: data minimization, anonymization, pseudonymization, consent management, privacy by design, privacy-preserving computation, and regulatory compliance (GDPR, CCPA, HIPAA).', category: 'compliance', source: 'global' },
  { id: 'project-management-mcp', name: 'Project Management MCP', description: 'Guide for building Project Management MCP Servers that expose task, issue, sprint, roadmap, and project tracking capabilities to LLMs via the Model Context Protocol.', category: 'mcp', source: 'global' },
  { id: 'prompt-engineering', name: 'Prompt Engineering', description: 'Guide for designing effective prompts for large language models.', category: 'ai', source: 'global' },
  { id: 'pulumi', name: 'Pulumi', description: 'Guide for Pulumi Infrastructure as Code. Covers program design, resource definitions, stacks, configuration, state management, providers, testing, and security best practices.', category: 'infrastructure', source: 'global' },
  { id: 'python-development', name: 'Python Development', description: 'Python Development', category: 'language', source: 'global' },
  { id: 'qt-qml', name: 'Qt/QML Desktop Development', description: 'Qt/QML Desktop Development', category: 'desktop', source: 'global' },
  { id: 'rag-systems', name: 'RAG Systems', description: 'RAG Systems', category: 'ai', source: 'global' },
  { id: 'react-nextjs', name: 'React/Next.js Development', description: 'React/Next.js Development', category: 'web', source: 'global' },
  { id: 'react-native', name: 'React Native Development', description: 'React Native Development', category: 'mobile', source: 'global' },
  { id: 'recommendation-systems', name: 'Recommendation Systems', description: 'Recommendation Systems', category: 'ai', source: 'global' },
  { id: 'reinforcement-learning', name: 'Reinforcement Learning', description: 'Guide for building and training reinforcement learning agents and systems.', category: 'ai', source: 'global' },
  { id: 'robotics', name: 'Robotics Development', description: 'Robotics Development', category: 'embedded', source: 'global' },
  { id: 'rust-development', name: 'Rust Development', description: 'Rust Development', category: 'language', source: 'global' },
  { id: 'sa-healthcare-standards', name: 'SA Healthcare Standards', description: 'Enforces South African healthcare billing, switch separation, and secure medical data handling.', category: 'healthcare', source: 'project' },
  { id: 'scientific-computing', name: 'Scientific Computing', description: 'Scientific Computing', category: 'science', source: 'global' },
  { id: 'sealed-secrets', name: 'Sealed Secrets', description: 'Guide for Sealed Secrets GitOps secrets on Kubernetes. Covers installation, the kubeseal client, SealedSecret resources, scopes (strict, namespace-wide, cluster-wide), key generation and backup, rotation/re-encryption, GitOps workflows with Argo CD and Flux, and best practices for safely committing encrypted secrets to Git.', category: 'kubernetes', source: 'global' },
  { id: 'security-hardening', name: 'Security Hardening', description: 'Guide for hardening infrastructure, applications, and supply chains against attack. Covers least privilege, network segmentation, secrets management, container and host hardening, supply-chain security, vulnerability management, compliance, and security testing.', category: 'security', source: 'global' },
  { id: 'site-reliability-engineering', name: 'Site Reliability Engineering', description: 'SRE practices with SLOs, SLIs, error budgets, incident response, toil reduction, and observability', category: 'devops', source: 'global' },
  { id: 'speech-processing', name: 'Speech Processing', description: 'Speech Processing', category: 'ai', source: 'global' },
  { id: 'stream-processing', name: 'Stream Processing', description: 'Stream Processing', category: 'data', source: 'global' },
  { id: 'svelte-sveltekit', name: 'Svelte and SvelteKit', description: 'Svelte and SvelteKit development best practices, patterns, and patterns', category: 'web', source: 'global' },
  { id: 'tauri-development', name: 'Tauri Desktop Development', description: 'Tauri Desktop Development', category: 'desktop', source: 'global' },
  { id: 'technical-writing', name: 'Technical Writing', description: 'Guide for technical writing: documentation strategy, information architecture, clarity and style, API and developer docs, tutorials, accessibility, localization, docs-as-code workflows, and measuring documentation effectiveness.', category: 'process', source: 'global' },
  { id: 'terraform', name: 'Terraform', description: 'Guide for Terraform Infrastructure as Code. Covers module design, state management, variable/Output patterns, provider configuration, workspaces, remote state, drift detection, testing, and security best practices.', category: 'infrastructure', source: 'global' },
  { id: 'testing-strategies', name: 'Testing Strategies', description: 'Guide for designing and implementing effective testing strategies across the test pyramid: unit, integration, contract, and end-to-end tests.', category: 'process', source: 'global' },
  { id: 'time-series-forecasting', name: 'Time Series Forecasting', description: 'Time Series Forecasting', category: 'data', source: 'global' },
  { id: 'typescript-node', name: 'TypeScript/Node.js Development', description: 'TypeScript/Node.js Development', category: 'language', source: 'global' },
  { id: 'vagrant', name: 'Vagrant', description: 'Guide for Vagrant development environments. Covers Vagrantfile design, box selection, provisioning, multi-machine setups, networking, synced folders, provider configuration, and testing best practices.', category: 'devops', source: 'global' },
  { id: 'velero', name: 'Velero', description: 'Guide for Velero backup and disaster recovery on Kubernetes. Covers installation, cloud provider credentials, backup storage locations (BSL), volume snapshot locations (VSL), schedules, include/exclude filters, volume snapshots and restic/kopia, backup and restore hooks, retention/TTL, cross-cluster migration, and disaster recovery drills.', category: 'kubernetes', source: 'global' },
  { id: 'realtime-communication', name: 'Realtime Communication', description: 'Realtime communication with WebSockets, WebRTC, Server-Sent Events, connection management, reconnection, and message ordering.', category: 'web', source: 'global' },
  { id: 'vue-nuxt', name: 'Vue/Nuxt', description: 'Vue 3 and Nuxt development best practices, patterns, and patterns', category: 'web', source: 'global' },
  { id: 'webapp-testing', name: 'Web App Testing', description: 'Toolkit for interacting with and testing local web applications using Playwright. Supports verifying frontend functionality, debugging UI behavior, capturing browser screenshots, and viewing browser logs.', category: 'testing', source: 'global' },
];

const CATEGORIES = [
  'ai', 'compliance', 'data', 'desktop', 'devops', 'healthcare', 'infrastructure',
  'kubernetes', 'language', 'mcp', 'mobile', 'performance', 'process', 'science',
  'security', 'testing', 'web',
];

// Tool input schemas (Zod)
const SkillsListInputSchema = z.object({
  category: z.enum(CATEGORIES as [string, ...string[]]).optional(),
  source: z.enum(['global', 'project']).optional(),
  q: z.string().optional(),
});

const SkillsGetInputSchema = z.object({
  id: z.string(),
});

// MCP protocol request/response schemas (inline Zod definitions)
const ListToolsRequestSchema = z.object({
  method: z.literal('tools/list'),
  params: z.object({}).optional(),
});

const CallToolRequestSchema = z.object({
  method: z.literal('tools/call'),
  params: z.object({
    name: z.string(),
    arguments: z.record(z.string(), z.unknown()).optional(),
  }),
});

const ListToolsResultSchema = z.object({
  tools: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    inputSchema: z.record(z.string(), z.unknown()),
  })),
});

const CallToolResultSchema = z.object({
  content: z.array(z.object({
    type: z.literal('text'),
    text: z.string(),
  })),
  isError: z.boolean().optional(),
});

// --- MCP Server ---

const server = new Server(
  { name: 'synapsemed-skills-mcp', version: '0.1.0' },
  {
    capabilities: { tools: {} },
  },
);

// IBM service configuration check (reads env vars — no network calls)
const IBM_SERVICES = [
  { key: 'cloudant', label: 'IBM Cloudant', vars: ['CLOUDANT_URL', 'CLOUDANT_API_KEY', 'CLOUDANT_DB_NAME'] },
  { key: 'cos', label: 'IBM Cloud Object Storage', vars: ['IBM_COS_ENDPOINT', 'IBM_COS_BUCKET', 'IBM_COS_API_KEY', 'IBM_COS_SERVICE_INSTANCE_CRN', 'IBM_COS_REGION', 'IBM_COS_HMAC_ACCESS_KEY_ID', 'IBM_COS_HMAC_SECRET_ACCESS_KEY'] },
  { key: 'watson_assistant', label: 'IBM Watson Assistant', vars: ['WATSON_ASSISTANT_URL', 'WATSON_ASSISTANT_API_KEY', 'WATSON_ASSISTANT_ASSISTANT_ID'] },
  { key: 'watson_stt', label: 'IBM Watson Speech to Text', vars: ['WATSON_SPEECH_TO_TEXT_URL', 'WATSON_SPEECH_TO_TEXT_API_KEY', 'WATSON_SPEECH_TO_TEXT_MODEL'] },
  { key: 'watsonx', label: 'IBM watsonx.ai', vars: ['WATSONX_API_KEY', 'WATSONX_PROJECT_ID', 'WATSONX_MODEL_ID', 'WATSONX_URL'] },
  { key: 'ai_gateway', label: 'AI Gateway', vars: ['AI_PROVIDER', 'GEMINI_API_KEY', 'OPENCODE_API_KEY'] },
];

function getIBMEnvStatus() {
  return IBM_SERVICES.map(svc => {
    const vars = svc.vars.map(v => ({
      name: v,
      set: Boolean(process.env[v]),
      value: process.env[v] ? (v.toLowerCase().includes('key') || v.toLowerCase().includes('secret') || v.toLowerCase().includes('crn') ? '[SET]' : process.env[v]) : '',
    }));
    const required = svc.vars.filter(v => !v.includes('MODEL') && !v.includes('REGION') && !v.includes('URL') && !v.includes('PROVIDER'));
    const configured = required.length === 0 || required.every(v => Boolean(process.env[v]));
    return { key: svc.key, label: svc.label, configured, vars };
  });
}

const IBMServiceInputSchema = z.object({
  service: z.enum(['cloudant', 'cos', 'watson_assistant', 'watson_stt', 'watsonx', 'ai_gateway', 'all']).optional(),
});

// Register ListTools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools = [
    {
      name: 'skills_list',
      description: 'List all available Kilo skills, optionally filtered by category or source.',
      inputSchema: SkillsListInputSchema,
    },
    {
      name: 'skills_get',
      description: 'Get the full description and details of a specific skill by its ID.',
      inputSchema: SkillsGetInputSchema,
    },
    {
      name: 'skills_categories',
      description: 'List all available skill categories with the number of skills in each.',
      inputSchema: z.object({}),
    },
    {
      name: 'mcps_list',
      description: 'List configured MCP servers and their transport types.',
      inputSchema: z.object({}),
    },
    {
      name: 'ibm_services_status',
      description: 'Check the configuration status of all IBM Cloud services (Cloudant, COS, Watson Assistant, Watson STT, watsonx.ai). Shows which env vars are set without revealing secret values.',
      inputSchema: IBMServiceInputSchema,
    },
    {
      name: 'ibm_setup_guide',
      description: 'Get step-by-step setup instructions for a specific IBM Cloud service.',
      inputSchema: IBMServiceInputSchema,
    },
  ];
  return ListToolsResultSchema.parse({ tools });
});

// Register CallTool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'skills_list') {
    const parsed = SkillsListInputSchema.parse(args ?? {});
    let results = SKILLS;
    if (parsed.category) results = results.filter(s => s.category === parsed.category);
    if (parsed.source) results = results.filter(s => s.source === parsed.source);
    if (parsed.q) {
      const query = parsed.q.toLowerCase();
      results = results.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.id.toLowerCase().includes(query)
      );
    }
    const skillList = results.map(s => ({
      id: s.id,
      name: s.name,
      category: s.category,
      source: s.source,
    }));
    return CallToolResultSchema.parse({
      content: [{ type: 'text', text: JSON.stringify({ count: results.length, skills: skillList }, null, 2) }],
    });
  }

  if (name === 'skills_get') {
    const parsed = SkillsGetInputSchema.parse(args ?? {});
    const skill = SKILLS.find(s => s.id === parsed.id);
    if (!skill) {
      return CallToolResultSchema.parse({
        content: [{ type: 'text', text: `Skill not found: ${parsed.id}` }],
        isError: true,
      });
    }
    return CallToolResultSchema.parse({
      content: [{ type: 'text', text: JSON.stringify(skill, null, 2) }],
    });
  }

  if (name === 'skills_categories') {
    const counts: Record<string, number> = {};
    for (const s of SKILLS) counts[s.category] = (counts[s.category] ?? 0) + 1;
    return CallToolResultSchema.parse({
      content: [{ type: 'text', text: JSON.stringify({ categories: Object.entries(counts).map(([cat, n]) => ({ category: cat, count: n })).sort((a, b) => b.count - a.count) }, null, 2) }],
    });
  }

  if (name === 'mcps_list') {
    return CallToolResultSchema.parse({
      content: [{ type: 'text', text: JSON.stringify({ mcps: [
        {
          name: 'puppeteer',
          type: 'local',
          transport: 'http+sse',
          endpoint: 'http://0.0.0.0:3331/mcp/sse',
          description: 'Browser automation via Puppeteer MCP server — screenshot, click, navigate, fill, evaluate',
        },
        {
          name: 'skills-mcp',
          type: 'local',
          transport: 'http+sse',
          endpoint: 'http://0.0.0.0:3333/mcp/sse',
          description: 'Exposes all Kilo skills as MCP tools: skills_list, skills_get, skills_categories, mcps_list, ibm_services_status, ibm_setup_guide',
          tools: ['skills_list', 'skills_get', 'skills_categories', 'mcps_list', 'ibm_services_status', 'ibm_setup_guide'],
        },
      ] }, null, 2) }],
    });
  }

  if (name === 'ibm_services_status') {
    const parsed = IBMServiceInputSchema.parse(args ?? {});
    const all = getIBMEnvStatus();
    const results = parsed.service && parsed.service !== 'all'
      ? all.filter(s => s.key === parsed.service)
      : all;
    const summary = results.map(s => ({
      service: s.label,
      configured: s.configured,
      mock_fallback: !s.configured,
      vars: s.vars,
    }));
    return CallToolResultSchema.parse({
      content: [{ type: 'text', text: JSON.stringify({ ibm_services: summary, note: 'Secret values shown as [SET]. No network calls are made.' }, null, 2) }],
    });
  }

  if (name === 'ibm_setup_guide') {
    const parsed = IBMServiceInputSchema.parse(args ?? {});
    const guides: Record<string, string> = {
      cloudant: `IBM Cloudant Setup
─────────────────
1. Log in to https://cloud.ibm.com
2. Search catalog for "Cloudant" → Create instance (Lite plan, 1 GB free)
3. After creation: Manage → Service credentials → New credential (role: Manager)
4. Copy the "url" and "apikey" fields from the credential JSON
5. Set in apps/api/.env:
   CLOUDANT_URL=https://<instance>.cloudantnosqldb.appdomain.cloud
   CLOUDANT_API_KEY=<apikey>
   CLOUDANT_DB_NAME=synapsemed
6. Create the database: from the Cloudant dashboard → Databases → Create database → "synapsemed"
7. Optional: enable Mango indexes for query performance`,

      cos: `IBM Cloud Object Storage Setup
──────────────────────────────
1. Log in to https://cloud.ibm.com
2. Search catalog for "Object Storage" → Create instance (Lite plan, 25 GB free)
3. Create a bucket in your preferred region (e.g. us-south)
4. Service credentials → New credential → check "Include HMAC credential" → role: Writer
5. Note the "cos_hmac_keys" (access_key_id + secret_access_key) and "resource_instance_id" (CRN)
6. Set in apps/api/.env:
   IBM_COS_ENDPOINT=https://s3.<region>.cloud-object-storage.appdomain.cloud
   IBM_COS_BUCKET=<your-bucket-name>
   IBM_COS_API_KEY=<apikey>
   IBM_COS_SERVICE_INSTANCE_CRN=<resource_instance_id>
   IBM_COS_REGION=<region>  (e.g. us-south)
   IBM_COS_HMAC_ACCESS_KEY_ID=<access_key_id>
   IBM_COS_HMAC_SECRET_ACCESS_KEY=<secret_access_key>`,

      watson_assistant: `IBM Watson Assistant Setup
──────────────────────────
1. Log in to https://cloud.ibm.com
2. Search catalog for "Watson Assistant" → Create instance (Lite plan: 10k messages/month)
3. Launch the Watson Assistant tool → Create assistant → give it a name
4. Assistant settings → API details → copy "Assistant ID" and "Service URL"
5. IBM Cloud resource page → Service credentials → New credential → copy "apikey"
6. Set in apps/api/.env:
   WATSON_ASSISTANT_URL=https://api.<region>.assistant.watson.cloud.ibm.com
   WATSON_ASSISTANT_API_KEY=<apikey>
   WATSON_ASSISTANT_ASSISTANT_ID=<assistant-id>
7. Build intents/entities for: appointment booking, intake forms, FAQ responses`,

      watson_stt: `IBM Watson Speech to Text Setup
────────────────────────────────
1. Log in to https://cloud.ibm.com
2. Search catalog for "Speech to Text" → Create instance (Lite plan: 500 minutes/month)
3. IBM Cloud resource page → Service credentials → New credential → copy "url" and "apikey"
4. Set in apps/api/.env:
   WATSON_SPEECH_TO_TEXT_URL=https://api.<region>.speech-to-text.watson.cloud.ibm.com
   WATSON_SPEECH_TO_TEXT_API_KEY=<apikey>
   WATSON_SPEECH_TO_TEXT_MODEL=en-US_BroadbandModel
5. Supported models: en-US_BroadbandModel, en-GB_BroadbandModel, en-AU_BroadbandModel
   (No en-ZA model available — use en-GB for South African English)
6. Audio must be submitted with patient consent (see transcription routes)`,

      watsonx: `IBM watsonx.ai Setup
─────────────────────
1. Log in to https://dataplatform.cloud.ibm.com (IBM watsonx)
2. Create a project: New project → create
3. Note the Project ID from: project → Manage → General
4. Get an IBM Cloud IAM API key: https://cloud.ibm.com/iam/apikeys → Create
5. Set in apps/api/.env:
   WATSONX_API_KEY=<iam-api-key>
   WATSONX_PROJECT_ID=<project-id>
   WATSONX_MODEL_ID=ibm/granite-13b-chat-v2
   WATSONX_URL=https://us-south.ml.cloud.ibm.com
   AI_PROVIDER=watsonx
6. Available models (Lite/free access): ibm/granite-13b-chat-v2, ibm/granite-3-8b-instruct
   Paid/partner models: meta-llama/llama-3-70b-instruct, mistralai/mixtral-8x7b-instruct-v01`,

      ai_gateway: `AI Gateway Setup
─────────────────
The AI gateway routes requests to: mock | watsonx | gemini | opencode
Set AI_PROVIDER in apps/api/.env to select the provider.

Per-practice settings override the global provider (PracticeAISettings in the DB).

Mock (default — no credentials needed):
  AI_PROVIDER=mock

IBM watsonx.ai (see ibm_setup_guide for watsonx):
  AI_PROVIDER=watsonx

Google Gemini (free tier):
  AI_PROVIDER=gemini
  GEMINI_API_KEY=<key from https://makersuite.google.com/app/apikey>
  GEMINI_MODEL=gemini-1.5-flash

Opencode (free):
  AI_PROVIDER=opencode
  OPENCODE_API_KEY=<key from opencode.ai>`,
    };

    const service = parsed.service && parsed.service !== 'all' ? parsed.service : null;
    if (service && guides[service]) {
      return CallToolResultSchema.parse({
        content: [{ type: 'text', text: guides[service] }],
      });
    }
    // Return all guides
    const allGuides = Object.entries(guides).map(([k, v]) => `\n${'='.repeat(60)}\n${v}`).join('\n');
    return CallToolResultSchema.parse({
      content: [{ type: 'text', text: `SynapseMed IBM Cloud Setup Guides\n${allGuides}` }],
    });
  }

  return CallToolResultSchema.parse({
    content: [{ type: 'text', text: `Unknown tool: ${name}` }],
    isError: true,
  });
});

// --- HTTP transport (SSE + POST) for external apps ---

const PORT = process.env.MCP_PORT ?? 3333;
const expressApp = buildExpressApp(server);
const httpServer = createServer(expressApp);
httpServer.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`SynapseMed Skills MCP HTTP server listening on http://0.0.0.0:${PORT}`);
  console.log(`  GET  /health     — health check`);
  console.log(`  GET  /mcp/sse    — SSE stream (MCP transport)`);
  console.log(`  POST /mcp/message — JSON-RPC messages`);
});

export { httpServer };
