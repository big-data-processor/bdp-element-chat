export class Page {
    name: string = '';
    desc: string = '';
    path: string = '';
    key: string = '';
    thumbnail: string = '';
    img: string = '';
    constructor(page: any) {
      this.name = page.name;
      this.desc = page.desc;
      this.path = page.path;
      this.thumbnail = page.thumbnail;
      this.key = page.key;
      this.img = page.img;
    }
  }
  export class IndexPage extends Page {
    constructor(page: any) {
      super(page);
    }
  };
  
  export class ResultPage extends Page {
    tasks: string[] = []; // list of taskKeys
    constructor(page: any) {
      super(page);
      this.tasks = Array.isArray(page.tasks) ? page.tasks : [];
    }
  }
  export class FilePage extends Page {
    tags: string[] = [];
    rule: string = 'or';
    format: string = '';
    constructor(page: any) {
      super(page);
      this.tags = Array.isArray(page.tags) ? page.tags : [];
      this.rule = ['or', 'and', 'all'].indexOf(page.rule) >= 0 ? page.rule : 'or';
      this.format = page.format || '';
    }
  }
  
  export class Pages {
    indexPages: Array<IndexPage>;
    resultPages: Array<ResultPage>;
    filePages: Array<FilePage>;
    constructor(obj: any) {
      this.indexPages = [];
      this.resultPages = [];
      this.filePages = [];
      if (!obj) {
        return;
      }
      if (Array.isArray(obj.indexPages)) {
        this.indexPages = obj.indexPages.map((item: IndexPage) => new IndexPage({
          name: item.name, desc: item.desc, path: item.path, key: item.key, thumbnail: item.thumbnail, img: item.img
        }));
      }
      if (Array.isArray(obj.resultPages)) {
        this.resultPages = obj.resultPages.map((item: ResultPage) => new ResultPage({
          name: item.name, desc: item.desc, path: item.path, key: item.key, thumbnail: item.thumbnail, img: item.img, tasks: item.tasks
        }));
      }
      if (Array.isArray(obj.filePages)) {
        this.filePages = obj.filePages.map((item: FilePage) => new FilePage({
          name: item.name, desc: item.desc, path: item.path, key: item.key, thumbnail: item.thumbnail, img: item.img, tags: item.tags,
          rule: item.rule, format: item.format
        }));
      }
    }
    addPageByType(entryType: string, pageObj: any) {
      switch (entryType) {
        case 'indexPages':
          this.indexPages.push(new IndexPage(pageObj));
          break;
        case 'resultPages':
          this.resultPages.push(new ResultPage(pageObj));
          break;
        case 'filePages':
          this.filePages.push(new FilePage(pageObj));
          break;
      }
    }
    getPagesByType(entryType: string): Array<IndexPage | ResultPage | FilePage> { // indexPages | filePages | resultPages
      switch (entryType) {
        case 'indexPages':
          return this.indexPages;
        case 'resultPages':
          return this.resultPages;
        case 'filePages':
          return this.filePages;
        default:
          return [];
      }
    }
    getResultPages(): Array<ResultPage> {
      return this.resultPages;
    }
    getResultPageByKey(pageKey: string): ResultPage | null {
      return this.resultPages.filter((page: ResultPage) => page.key === pageKey)[0] || null;
    }
    getFilePages(): Array<FilePage> {
      return this.filePages;
    }
    getFilePageByKey(pageKey: string): FilePage | null {
      return this.filePages.filter((page: FilePage) => page.key === pageKey)[0] || null;
    }
    getIndexPages(): Array<IndexPage> {
      return this.indexPages;
    }
    getIndexPageByKey(pageKey: string): IndexPage | null {
      return this.indexPages.filter((page: IndexPage) => page.key === pageKey)[0] || null;
    }
    getValidResultPageKeys(taskKey: string): Array<string> {
      return this.resultPages.filter(p => p.tasks.indexOf(taskKey) >= 0 || p.tasks.length === 0).map(p => p.key);
    }
    getValidResultPages(taskKey: string): Array<ResultPage> {
      return this.resultPages.filter(p => p.tasks.indexOf(taskKey) >= 0 || p.tasks.length === 0);
    }
    getValidFilePagekeys(fileTags: string[], format: string): Array<string> {
      return this.filePages.filter(page => {
        let isFormatValid = false, isTagValid = false;
        if (!page.format || page.format === format) { isFormatValid = true; }
        if (page.tags.length === 0) {
          isTagValid = true;
        } else {
          const rule = page.rule;
          const pageTags = page.tags;
          if (rule === 'or') {
            isTagValid = pageTags.filter(t => fileTags.indexOf(t) >= 0).length > 0;
          } else if (rule === 'and') {
            isTagValid = pageTags.filter(t => fileTags.indexOf(t) >= 0).length === pageTags.length;
          } else if (rule === 'all') {
            isTagValid = pageTags.filter(t => fileTags.indexOf(t) >= 0).length === fileTags.length;
          }
        }
        return isFormatValid && isTagValid;
      }).map(p => p.key);
    }
  }
  