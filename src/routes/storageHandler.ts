export class StorageHandler {
  static async handle(request: Request): Promise<Response | null> {
    const url = new URL(request.url);
     
    const content = url.searchParams.get('v');
    if (!content) {
      return new Response('No content provided', { status: 400 });
    }

    return new Response(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
} 