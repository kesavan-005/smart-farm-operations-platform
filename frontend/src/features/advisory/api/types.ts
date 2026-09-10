export interface AdvisoryRequest {
  farmId?: string; // Optional in frontend payload, usually passed in the path, but matches backend DTO
  fieldId?: string;
  question: string;
}

export interface AdvisorySource {
  knowledgeDocumentId?: string;
  knowledgeChunkId?: string;
  chunkIndex?: number;
  title?: string;
  source?: string;
  sourceType?: string;
  authority?: string;
  version?: string;
  publishedDate?: string;
  lastVerifiedAt?: string;
  score?: number;
}

export interface AdvisoryResponse {
  answer: string;
  sources: AdvisorySource[];
  weatherUsed: boolean;
}
