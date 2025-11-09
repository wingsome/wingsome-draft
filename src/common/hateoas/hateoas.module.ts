import { Module } from '@nestjs/common';
import { HateoasHelper } from './hateoas.helper';

@Module({
  providers: [HateoasHelper],
  exports: [HateoasHelper]
})
export class HateoasModule {}