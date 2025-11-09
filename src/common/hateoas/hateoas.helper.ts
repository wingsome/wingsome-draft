import { Injectable } from "@nestjs/common";
import { ApiDomain, HttpMethod } from "../enum/hateoas.enum";

export type LinkMap = Record<string, {href: string; method: HttpMethod}>;

export interface LinkSpec {
  name: string;
  domain: ApiDomain;
  endpoint: string;
  method: HttpMethod;
}

@Injectable()
export class HateoasHelper {
  createLinks(links: LinkSpec[]): LinkMap {
    const result: LinkMap = {};
    for (const spec of links) {
      result[spec.name] = {
        href: `${spec.domain}/${spec.endpoint}`,
        method: spec.method
      };
    }
    return result;
  }
}