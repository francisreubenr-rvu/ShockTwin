@path: '/po'
service POService { action listDrafts() returns LargeString; action createDraft(payload: LargeString) returns LargeString; action decide(payload: LargeString) returns LargeString; action auditEvents() returns LargeString; }
