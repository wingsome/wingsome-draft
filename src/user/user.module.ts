import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { HateoasModule } from 'src/common/hateoas/hateoas.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    AuthModule,
    HateoasModule
  ],
  controllers: [UserController],
  providers: [UserService]
})
export class UserModule {}
