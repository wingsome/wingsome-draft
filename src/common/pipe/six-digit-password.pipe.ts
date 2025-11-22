import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";

@Injectable()
export class SixDigitPasswordPipe implements PipeTransform {
  transform(value: any) {
    if (!value) throw new BadRequestException('password should not be empty');
    if (typeof value !== 'string') throw new BadRequestException('password must be a string.');
    if (!/^\d{6}$/.test(value)) throw new BadRequestException('password must match /^\\d{6}$/ regular expression');
    return value;
  }
}