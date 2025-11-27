import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";

@Injectable()
export class EnumFieldPipe implements PipeTransform {
  constructor(
    private readonly fieldName: string,
    private readonly enumObj: Record<string, any>
  ) {}

  transform(value: any) {
    if (!value) throw new BadRequestException(`${this.fieldName} should not be empty`);
    const enumValues = Object.values(this.enumObj);
    if (!enumValues.includes(value)) {
      throw new BadRequestException(`${this.fieldName} must be one of the following values: ${enumValues.join(', ')}`);
    }
    return value;
  }
}