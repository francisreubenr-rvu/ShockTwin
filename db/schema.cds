namespace shocktwin;

aspect TenantRecord {
  key tenantId : String(80);
  key ID : String(80);
  illustrative : Boolean default true;
}
entity Companies : TenantRecord { name : String(200); location : String(200); latitude : Double; longitude : Double; }
entity Suppliers : TenantRecord { companyId : String(80); name : String(200); tier : Integer; location : String(200); latitude : Double; longitude : Double; materialId : String(80); capacity : Double; }
entity Plants : TenantRecord { companyId : String(80); name : String(200); location : String(200); latitude : Double; longitude : Double; materialId : String(80); capacity : Double; hidden : Boolean default false; }
entity Materials : TenantRecord { name : String(200); unit : String(30); inventory : Double; dailyDemand : Double; unitValue : Decimal(18,2); currency : String(3); }
entity Lanes : TenantRecord { sourceId : String(80); targetId : String(80); distanceKm : Double; leadTimeDays : Double; }
entity Links : TenantRecord { sourceId : String(80); targetId : String(80); materialId : String(80); dependencyShare : Double; inferred : Boolean; confidence : Double; evidence : LargeString; explanation : String(1000); reviewStatus : String(30); modelVersion : String(120); }
entity Shocks : TenantRecord { type : String(30); nodeId : String(80); location : String(200); severity : Double; durationDays : Integer; source : String(200); observedAt : Timestamp; headline : String(500); }
entity Scenarios : TenantRecord { shockType : String(30); nodeId : String(80); materialId : String(80); input : LargeString; result : LargeString; createdAt : Timestamp; }
entity CapacityListings : TenantRecord { capacityType : String(40); location : String(200); latitude : Double; longitude : Double; startDate : Date; endDate : Date; priceBand : String(30); providerName : String(200); volumeDaily : Double; leadTimeDays : Double; capabilityFit : Double; exactUnitPrice : Decimal(18,2); qualification : String(500); active : Boolean default true; }
entity Matches : TenantRecord { scenarioId : String(80); listingId : String(80); providerTenantId : String(80); request : LargeString; result : LargeString; score : Double; eligible : Boolean; createdAt : Timestamp; }
@assert.unique: { idempotency: [tenantId, idempotencyKey] }
entity DraftPOs : TenantRecord { matchId : String(80); scenarioId : String(80); idempotencyKey : String(120); supplierRef : String(80); quantity : Double; currency : String(3); priceBand : String(30); status : String(40); externalId : String(100); mode : String(30); createdBy : String(200); createdAt : Timestamp; decidedAt : Timestamp; reason : String(1000); integrationError : String(1000); requestedDecision : String(30); correlationId : String(100); }
entity AuditEvents : TenantRecord { actor : String(200); action : String(80); entityType : String(80); entityId : String(80); before : LargeString; after : LargeString; timestamp : Timestamp; correlationId : String(100); }
entity Orders : TenantRecord { materialId : String(80); customerRef : String(120); quantity : Double; dueDay : Integer; value : Decimal(18,2); currency : String(3); }
entity Inventory : TenantRecord { materialId : String(80); onHand : Double; dailyBurn : Double; unit : String(30); }
