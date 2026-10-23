@path: '/mesh'
service MeshService { action listListings() returns LargeString; action publishListing(payload: LargeString) returns LargeString; action findMatches(payload: LargeString) returns LargeString; }
