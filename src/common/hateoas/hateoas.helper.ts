import { Injectable } from "@nestjs/common";

export enum ApiDomain {
  LOCAL = 'https://localhost:3000',
  DEV = 'https://dev.wingsome.kr',
  PROD = 'https://api.wingsome.kr',
}

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

export interface Link {
  href: string;
  method: HttpMethod;
}

export type LinkMap = Record<string, Link>;

export interface LinkSpec {
  name: string;
  endpoint: string;
  method: HttpMethod;
  pathSuffix?: string; // optional 추가 경로 (e.g., '/active')
}

@Injectable()
export class HateoasHelper {
  createLinks(domain: ApiDomain, id: number | string, links: LinkSpec[]): LinkMap {
    const result: LinkMap = {};

    for (const spec of links) {
      const href = this.composeHref(domain, spec.endpoint, id, spec.pathSuffix);
      result[spec.name] = { href, method: spec.method };
    }

    return result;
  }

  private composeHref(domain: ApiDomain, endpoint: string, id: number | string, suffix?: string): string {
    let path = `${domain}/${endpoint}/${id}`;
    if (suffix) {
      path += suffix.startsWith('/') ? suffix : `/${suffix}`;
    }
    return path;
  }
}