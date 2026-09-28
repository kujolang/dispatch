// Operator/package composition, not request data. No mutable registrations.
import { createCodec } from '@kujolang/participant-sdk';
const NS='kujolang.typescript-process', EXT='kujolang.typescript-process-correlation/v1alpha1', GIT='workcell.git-correlation/v1alpha1';
export const sdk = createCodec({ namespace: NS,
    participant: { schema: EXT, fields: { call_id: 'identifier', process_instance_id: 'identifier' } },
    effect: { schema: GIT, fields: { workcell_effect_id: 'identifier', transaction_sha256: 'sha256' } } });
