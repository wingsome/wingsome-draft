import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches } from "class-validator";

export class UpdatePasswordDto {
  @ApiProperty({ description: '새 비밀번호', required: true, nullable: false })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{6}$/)
  newPassword: string;
}
