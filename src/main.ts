import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,            // DTO에 없는 필드는 자동 제거
    forbidNonWhitelisted: true  // 허용되지 않은 필드 있으면 에러
  }));

  // Swagger 설정 객체
  const config = new DocumentBuilder()
    .setTitle('Wingsome API')
    .setDescription('Wingsome API 명세서')
    .setVersion('1.0.0')
    .addBearerAuth() // JWT 인증 헤더 추가
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
