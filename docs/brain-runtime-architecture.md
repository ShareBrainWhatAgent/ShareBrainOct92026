# Brain Runtime Architecture

This document proposes a secure runtime for executing developer‑provided "brains" on the ShareBrain platform.

## Goals
- Run untrusted brain code safely with strict resource quotas (CPU, memory, network).
- Provide only approved APIs for data access (messaging, memory, etc.).
- Avoid persistence between invocations except via exposed storage APIs.
- Support multiple languages and maintain backward compatibility across SDK versions.

## Candidate isolation technologies
### 1. Containers
* **Pros:** Mature tooling, good process isolation, easy to enforce CPU/memory/network quotas with cgroups.
* **Cons:** Heavyweight for short‑lived tasks, slower startup, requires OS‑level patching for security, language‑specific environments must be pre‑built.

### 2. WebAssembly
* **Pros:** Strong sandboxing built into the runtime; modules are portable across languages; fast startup; fine‑grained control over imports/exports; easy to snapshot and reset state.
* **Cons:** Ecosystem still maturing; some languages require additional work to compile to WASM; direct filesystem and network access must be proxied.

### 3. Node/Python sandboxes
* **Pros:** Minimal overhead, straightforward to integrate with existing JS/TS or Python code.
* **Cons:** Difficult to guarantee isolation from host process; libraries such as `vm` or `eval` can be escaped; resource limits and network/file restrictions are fragile.

## Recommended approach
A **WebAssembly runtime inside a lightweight container** offers the best balance of security and portability:
1. Each brain is compiled to WASM and executed inside a per‑invocation container (e.g., using Firecracker or gVisor).
2. The container enforces CPU/memory/network quotas via cgroups while the WASM runtime prevents access to unsafe system calls.
3. Only an approved capability API is exposed to the module through WASI imports or host bindings.
4. After execution, the container is discarded so no state persists beyond allowed storage APIs.

This architecture provides defense in depth—WASM limits what the code can do, while the container provides an additional boundary and familiar operational tooling. A pure Node/Python sandbox can be used for local development but should not be relied on for production execution of untrusted code.

