import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger 설정 객체
  const config = new DocumentBuilder()
    .setTitle('Wingsome API Docs')
    .setDescription('Wingsome 서비스의 REST API 명세서')
    .setVersion('1.0.0')
    .addBearerAuth() // JWT 인증 헤더 추가
    .build();

  // Swagger 문서
  const document = SwaggerModule.createDocument(app, config);

  // Swagger UI 엔드포인트 등록
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Swagger UI에서 인증정보 유지
    },
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true
  }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
