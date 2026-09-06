# Task preferences for documentation retrieval

Dispatch preserves an optional `metadata.retrieval_preferences.programming_language` through task execution, retries, saved workflow state, and approval resume. It does not infer a language from the repository, runtime, source files, or model prompt.

Precedence is explicit step metadata, then run input metadata, then workflow metadata, then unset. An explicitly present empty/null/invalid namespace suppresses the less-specific default. Identifiers use the Kujo contract: lowercase, trimmed, extensible `[a-z][a-z0-9_-]*`, at most 64 characters, with `c++`/`c#` aliases. Handlers receive the resolved preference under `context.metadata.retrieval_preferences`; provider options remain unchanged.

## Run the supporting RAG tool

Start the RAG documentation pilot in the sibling RAG repository, with Markdown examples enabled and `examples/retrieval_preferences` ingested. Then:

```sh
export DISPATCH_RAG_URL=http://127.0.0.1:8787
export DISPATCH_RAG_NAMESPACE=default
export DISPATCH_RAG_SUPPORTS_PREFERENCES=1
kujo run dispatch.kujo demo "How do I query the RAG API?" \
  --workflow-file examples/workflows/documentation-query.json \
  --plugin rag \
  --input-json '{"metadata":{"retrieval_preferences":{"programming_language":"python"}}}' \
  --yes --non-interactive
```

The example workflow defaults to JavaScript, so this run input demonstrates an explicit Python override. The `rag` plugin registers `documentation_query` through the existing tool registry. The tool receives its question from `input.query`, falling back to `input.topic`. Its output includes the selected text and original citation paths and line ranges in persisted `state.json`.

Supply `DISPATCH_RAG_TOKEN` through secret configuration when the server requires bearer authentication. Endpoint, namespace, and credentials come only from host configuration, not from model tool arguments or the persisted task input. The default `DISPATCH_RAG_SUPPORTS_PREFERENCES=0` sends an ordinary query to older servers. Setting it to `1` declares support for the Kujo RAG body parameter; there is no capability probe, global header, or use of `Accept-Language` for code.

The native HTTP request follows no redirects, pins DNS under runtime policy, limits the response to 256 KiB, and uses the shorter of ten seconds and the step's remaining deadline. The adapter makes one attempt and reports failures as non-retryable. Existing tool authorization still applies. A workflow can explicitly configure retry behavior through its ordinary policy, but the plugin adds no retry of its own.

## Clearing and resume

A step can deliberately clear a run/workflow preference:

```json
{"id":"all_examples","name":"All examples","type":"tool","tool_name":"documentation_query","input_from":["input"],"output_key":"docs","metadata":{"retrieval_preferences":{}}}
```

Workflow and step metadata are included in the persisted workflow definition, and run input remains in the saved run. Reconstructing the workflow after restart therefore preserves both defaults and explicit clears. `tests/retrieval_preferences_tests.kujo` covers precedence, normalization, disk reload, retry, approval pause/resume, and clearing. The RAG live pilot exercises this CLI/plugin against the actual HTTP service and checks persisted selected content.
