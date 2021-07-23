export interface BdpElementMessage {
  content: any;
  elementId: string;
  id: string;
  owner?: {id: string, name: string, lastLoggedIn: string} | string;
  project: string | null;
  result: string | null;
  dataFile: string | null;
  package: string | null;
  task: string | null;
  user: string | null;
}