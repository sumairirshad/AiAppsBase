export interface AuditQuery {
  id: number;
  entityTypeCode: string;
  entityId: number;
  queryText: string;
  responseText: string | null;
  queryStatusCode: string;
  createdAt: string;
  respondedAt: string | null;
  raisedByName: string;
}

export interface AuditStamp {
  id: number;
  prId: number;
  paymentVerified: boolean;
  deliveryVerified: boolean;
  stampedAt: string;
  stampedByName: string;
  remarks: string | null;
}
