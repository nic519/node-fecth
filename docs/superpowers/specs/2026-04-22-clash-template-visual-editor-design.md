# Clash Template Visual Editor Design

## Context

The admin template editor currently edits the template as raw YAML through `YamlEditor`. The backend template API stores and returns the same `content` string, and this work must not change that storage or read path.

Clash/mihomo routing rules are ordered. Rules near the top have higher priority, common domain rules use `TYPE,payload,policy`, and `MATCH,policy` is the catch-all rule. `RULE-SET` references require `rule-providers`, so first-stage rule creation should focus on direct domain rules and keep provider management for a later phase.

References:

- https://wiki.metacubex.one/en/config/rules/
- https://wiki.metacubex.one/en/config/rule-providers/content/

## Goals

1. Add a visual interaction layer for the most common template edits while preserving raw YAML editing.
2. Let admins filter template policy groups by region, using the existing region vocabulary: `TW`, `SG`, `JP`, `VN`, `HK`, `US`.
3. Let admins add one website or a batch of website rules without manually writing YAML lines.
4. Keep all changes local to the selected template's `configContent` string until the existing save action is used.

## Non-Goals

1. Do not change database schema, API routes, template service methods, or subscription read behavior.
2. Do not build a complete Clash/mihomo rule IDE in the first phase.
3. Do not add rule-provider creation or remote rule-set management in the first phase.
4. Do not hide the raw source editor, because complex YAML must remain editable.

## Recommended Approach

Use a progressive two-pane editor inside `TemplateEditor`:

- Left pane: visual tools for region filtering and website rule insertion.
- Right pane: the existing YAML editor, still the source of truth.
- The visual tools parse the current YAML string with `js-yaml`, mutate supported fields, dump the object back to YAML, and call `onUpdateConfigContent`.
- If parsing fails or the expected sections are missing, the visual tools show a non-blocking disabled state while raw editing continues to work.

This keeps the storage model unchanged and makes the first version useful without over-committing to every Clash syntax variant.

## Components

### `clash-template-utils`

A small client-safe utility module should own YAML parsing and mutation.

Responsibilities:

- Parse template YAML into a typed working object.
- Extract proxy group names from `proxy-groups`.
- Infer group regions by matching names against `ProxyAreaObjects`.
- Apply selected regions by keeping matching groups and cleaning rules that target removed groups.
- Insert generated website rules before the first `MATCH` rule, or append if `MATCH` is absent.
- Preserve unsupported top-level fields by mutating only supported sections.

### `TemplateVisualTools`

A new UI component rendered only when a template is selected.

Responsibilities:

- Show parse status and counts for proxy groups and rules.
- Render region toggles for `TW`, `SG`, `JP`, `VN`, `HK`, `US`.
- Provide a website rule form:
  - rule type: `DOMAIN`, `DOMAIN-SUFFIX`, `DOMAIN-KEYWORD`
  - one or more domain inputs, separated by newline or comma
  - policy selector populated from current proxy group names plus `DIRECT` and `REJECT`
  - insert position fixed to "before MATCH" for phase one
- Trigger YAML updates through `onUpdateConfigContent`.

### `TemplateEditor`

`TemplateEditor` should keep its existing header, metadata editing, validation display, and YAML editor. In edit mode, the editor body gains a responsive split layout:

- Visual tools are shown in a fixed-width left column on desktop.
- YAML editor remains the main editing surface.
- On narrower screens, visual tools stack above the YAML editor.
- In read-only mode, visual tools can show parsed summary but mutation controls are disabled.

## Data Flow

1. `TemplateEditor` receives `currentConfigContent`.
2. `TemplateVisualTools` parses that string with `js-yaml`.
3. User toggles regions or submits website rules.
4. Utility functions return a new YAML string.
5. `TemplateEditor` calls `onUpdateConfigContent(newContent)`.
6. Existing validation and save behavior continue unchanged.

## Region Filtering Behavior

Region filtering works on `proxy-groups`, not on `GEOIP` routing rules.

- A group belongs to a region when its name matches that region's configured regex.
- Built-in policies such as `DIRECT` and `REJECT` are never treated as removable groups.
- Rules targeting removed groups are removed, mirroring the existing server-side filtering behavior.
- `MATCH` is retained only if its policy is still valid.
- Empty selection is not applied automatically; the UI should require at least one selected region before applying.

## Website Rule Behavior

Generated rule lines use Clash/mihomo-compatible direct rules:

- `DOMAIN,example.com,Policy`
- `DOMAIN-SUFFIX,example.com,Policy`
- `DOMAIN-KEYWORD,google,Policy`

Domains are normalized by trimming whitespace and removing URL schemes and paths when possible. Duplicate generated rules are skipped. New rules are inserted before the first `MATCH` rule to preserve catch-all behavior.

## Error Handling

- Invalid YAML: disable visual mutation controls and show that raw YAML must be fixed first.
- Missing `proxy-groups`: show an empty region state and allow website rules only for built-in policies.
- Missing `rules`: create a `rules` array when adding website rules.
- Unsupported or non-string rule entries: leave them in place unless they target a removed group during region filtering.

## Testing

Add focused tests for the YAML utility module:

1. Extracts regional groups using `ProxyAreaObjects`.
2. Applies a region selection and removes rules targeting excluded groups.
3. Inserts website rules before `MATCH`.
4. Skips duplicate website rules.
5. Handles invalid YAML as a parse error.

Component behavior can be covered with a lightweight render test if the existing test setup supports it; otherwise the first implementation should at least verify the utility layer and run lint.

## Later Interaction Phases

After the first phase is stable, discuss and design:

1. A rules table with edit, delete, enable/disable, and reorder controls.
2. Rule-provider creation and `RULE-SET` binding.
3. YAML diff preview before applying visual changes.
4. Operation history for undoing visual edits.
5. More complete Clash/mihomo validation for edge cases such as logical rules, sub-rules, ports, and process rules.
