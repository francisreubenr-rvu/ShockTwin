@path: '/risk'
service RiskService {
  action getState() returns LargeString;
  action infer(payload: LargeString) returns LargeString;
  action decideLink(payload: LargeString) returns LargeString;
}
