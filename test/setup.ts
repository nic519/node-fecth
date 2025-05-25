// 模拟Cloudflare Worker全局对象
global.Request = class Request {
    url: string;
    method: string;
    headers: Map<string, string>;
    
    constructor(url: string, options: any = {}) {
        this.url = url;
        this.method = options.method || 'GET';
        this.headers = new Map(Object.entries(options.headers || {}));
    }
};

global.Response = class Response {
    body: any;
    status: number;
    headers: Map<string, string>;
    
    constructor(body: any, options: any = {}) {
        this.body = body;
        this.status = options.status || 200;
        this.headers = new Map(Object.entries(options.headers || {}));
    }
    
    async text() {
        return this.body;
    }
    
    async json() {
        return JSON.parse(this.body);
    }
};

global.URL = URL; 