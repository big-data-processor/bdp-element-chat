import * as moment from 'moment';
import { AccountModel } from './mongo.models';
import Moment = moment.Moment;
export interface BdpElementMessage {
  content: any;
  elementId: string;
  id: string;
  owner?: AccountModel;
  project: string | null;
  result: string | null;
  dataFile: string | null;
  package: string | null;
  task: string | null;
  user: string | null;
  createdAt: Moment;
  updatedAt: Moment;
}