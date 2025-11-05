import { Controller, Post, Body, UseInterceptors, ClassSerializerInterceptor, Param, Patch, Delete, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { LoginService } from './login.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Controller('login')
@UseInterceptors(ClassSerializerInterceptor)
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  @Post('/signup')
  createUser(
    @Body() request: CreateUserDto
  ) {
    return this.loginService.createUser(request);
  }

  @Patch('/password')
  async updatePassword(
    @Body() request: UpdatePasswordDto
  ) {
    return this.loginService.updatePassword(request);
  }

  @Delete('/:id')
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @Body('password') password: string,
  ) {
    if (!password)  throw new BadRequestException('Password is required.');
    return this.loginService.deleteUser(id, password);
  }
}
