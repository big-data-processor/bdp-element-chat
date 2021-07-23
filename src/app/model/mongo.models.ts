import { Pages } from "./pages";

export interface AccountModel {
  id: string;
  name: string;
  auths: {[key: string]: number};
}

export class TaskMap {
  args: Array<string | null> = [];
  id: string | undefined;
  key: string | undefined;
  pkg: string | undefined;
  pkgid: string | undefined;
  version: string | undefined;
}

export interface ArgumentModel {
  name: string;
  desc: string;
  type: 'static'| 'value' | 'list' | 'inFile' | 'outFile';
  // for static and value
  default: string[] | string;
  // for list
  list: string[];
  multiple: boolean;
  optional: boolean;
  // for inFile and outFile
  tags: string[];
  tagMatchRule: 'and' | 'or' | 'all';
  format: string;
  // for outFile only
  hidden: boolean;
  candidates: DataFileModel[] | undefined
}

export interface TaskModel {
  id: string;
  name: string;
  key: string;
  desc: string;
  type: string;
  mapper: TaskMap[][];
  stepNames: string[];
  package: string;
  arguments: ArgumentModel[];
  encodeArg: boolean;
  proxy: {
    protocol: string; // 'http' | https'
    pathRewrite: boolean;
    port: number | null;
    ip: string;
    entryPath: string;
  } | null;
}


export interface DataFileModel {
  id: string;
  name: string;
  desc: string;
  format: string;
  tags: string[];
  result: string;
  status: number;
  parent: string;
  hidden: boolean;
  createdAt: string;
  updatedAt: string;
  path: string;
  realPath: string;
  readOnly: boolean;
  prefix: string;
  suffix: string;
  owner: AccountModel | null;
}

export interface ResultModel{
  id: string;
  name: string;
  type: string;
  desc: string;
  status: number;
  timer: string[];
  task: TaskModel;
  inFiles: DataFileModel[];
  outFiles: DataFileModel[];
  stdErr: string;
  stdOut: string;
  owner: AccountModel | null;
  createdAt: string;
  updatedAt: string;
  prefix: string;
  suffix: string;
  children: string[][];
  parent: string | null;
  arguments: Array<{type: string; value: string | DataFileModel;}>;
}

export interface PackageModel {
  id: string;
  name: string;
  version: string;
  email: string;
  author: string;
  desc: string;
  img: string;
  thumbnail: string;
  scope: string[];
  status: number;
  allowedFormats: string[];
  formatMapping: Array<{ext: string; tags: string[]}>;
  readme: string;
  sheetID: string;
  sheetName: string;
  owner: AccountModel | null;
  managers: AccountModel[];
  viewers: AccountModel[];
  runners: AccountModel[];
  privileg: {
    canView: boolean;
    canRun: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canSetMember: boolean;
    isOwner: boolean;
    isManager: boolean;
    isRunner: boolean;
    isViewer: boolean;
  };
  createdAt: string;
  updatedAt: string;
  pages: Pages;
}

export interface ProjectModel {
  id: string;
  name: string;
  desc: string;
  createdAt: string;
  updatedAt: string;
  dataFileNumber: number;
  resultNumber: number;
  public: boolean;
  owner: AccountModel | null;
  managers: AccountModel[];
  viewers: AccountModel[];
  runners: AccountModel[];
  dataFiles: DataFileModel[];
  results: ResultModel[];
  packages: PackageModel[];
  privilege: {
    canView: boolean;
    canRun: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canDeleteResult: boolean;
    canEditResult: boolean;
    canDeleteFile: boolean;
    canAddFile: boolean;
    canEditFile: boolean;
    canSetMember: boolean;
    isOwner: boolean;
    isManager: boolean;
    isRunner: boolean;
    isViewer: boolean;
  };
}