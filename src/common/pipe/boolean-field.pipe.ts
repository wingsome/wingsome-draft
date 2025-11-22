import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";

@Injectable()
export class BooleanFieldPipe implements PipeTransform {
  constructor(
    private readonly fieldName: string,
    private readonly required: boolean = true
  ) {}

  transform(value: any) {
    if (value === undefined || value === null) {
      if (!this.required) return undefined;
      else throw new BadRequestException(`${this.fieldName} should not be empty`);
    }
    
    if (typeof value === 'string') {
      const lower = value.toLowerCase().trim();
      if (lower === 'true') return true;
      if (lower === 'false') return false;
      throw new BadRequestException(`${this.fieldName} must be a boolean value`);
    }
    if (typeof value === 'boolean') return value;

    throw new BadRequestException(`${this.fieldName} must be a boolean value`);
  }
}