type Doc = Record<string, any>;
export declare const CONFORMANCE = "kujo.participant-sdk-conformance/v1alpha1";
export type Field = 'identifier' | 'sha256' | 'reference' | 'nullable_identifier';
export type Extension = {
    schema: string;
    fields: Record<string, Field>;
};
export type Registration = {
    namespace: string;
    participant: Extension;
    effect: Extension | null;
};
export declare class SDKError extends Error {
    readonly code: string;
    constructor(code: string);
}
export declare class CorrelationError extends SDKError {
}
export declare function contentRef(bytes: Uint8Array): string;
export declare function createCodec(registration: Registration): Readonly<{
    encodeHandoff: (doc: Doc) => Uint8Array;
    parseHandoff: (bytes: Uint8Array) => Doc;
    matchExpected: (bytes: Uint8Array, expected: Doc) => true;
    provisional: (d: Doc) => Uint8Array<ArrayBufferLike>;
    terminalReport: (d: Doc) => Uint8Array<ArrayBufferLike>;
    finalizeAfterReadback: (d: Doc) => Uint8Array<ArrayBufferLike>;
}>;
export {};
