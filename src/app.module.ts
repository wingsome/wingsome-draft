import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/guard/auth.guard';
import { RoleGuard } from './auth/guard/role.guard';
import { BearerTokenMiddleware } from './auth/middleware/bearer-token.middleware';
import { envKeys } from './common/const/env.const';
import { ProfileUser } from './profile/entity/profile-user.entity';
import { ProfileWinkerImage } from './profile/entity/profile-winker-image.entity';
import { ProfileWinkerReputation } from './profile/entity/profile-winker-reputation.entity';
import { ProfileWinker } from './profile/entity/profile-winker.entity';
import { ProfileModule } from './profile/profile.module';
import { Relation } from './relation/entity/relation.entity';
import { RelationModule } from './relation/relation.module';
import { User } from './user/entity/user.entity';
import { UserModule } from './user/user.module';
import { ProfileWinkerRegister } from './profile/entity/profile-winker-register.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        ENV: Joi.string().valid('local', 'dev', 'staging', 'prod').required(),
        DB_TYPE: Joi.string().valid('postgres').required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        ACCESS_TOKEN_SECRET: Joi.string().required(),
        REFRESH_TOKEN_SECRET: Joi.string().required()
      }),
    }),
    TypeOrmModule.forRootAsync({
      useFactory:(configService: ConfigService) => ({
        type: configService.get<string>(envKeys.dbType) as 'postgres',
        host: configService.get<string>(envKeys.dbHost),
        port: configService.get<number>(envKeys.dbPort),
        username: configService.get<string>(envKeys.dbUsername),
        password: configService.get<string>(envKeys.dbPassword),
        database: configService.get<string>(envKeys.dbDatabase),
        entities: [
          User,
          ProfileUser,
          ProfileWinker,
          ProfileWinkerImage,
          ProfileWinkerReputation,
          ProfileWinkerRegister,
          Relation
        ],
        synchronize: true // local only!!
      }),
      inject: [ConfigService],
      async dataSourceFactory(option) {
        if (!option) throw new Error('Invalid options passed');
        return addTransactionalDataSource(new DataSource(option));
      }
    }),
    UserModule, ProfileModule, AuthModule, RelationModule
  ],
  providers: [
    {provide: APP_GUARD, useClass: AuthGuard},
    {provide: APP_GUARD, useClass: RoleGuard}
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(BearerTokenMiddleware)
      .forRoutes('*'); // 전체 경로 적용
  }
}
