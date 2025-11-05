import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, Length, IsInt, Min, Max, IsBoolean, IsOptional } from 'class-validator';

export class UpdatePasswordDto {
  @ApiProperty({ description: '국가 번호', required: true, nullable: false })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(999)
  region: number;

  @ApiProperty({ description: '연락처', required: true, nullable: false })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{6,15}$/)
  phone: string;

  @ApiProperty({ description: '새 비밀번호', required: true, nullable: false })
  @IsNotEmpty()
  @IsString()
  @Length(8, 20)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
  newPassword: string;

  @ApiProperty({ description: '계정 복구 여부', required: false, nullable: false })
  @IsOptional()
  @IsNotEmpty()
  @IsBoolean()
  recover: boolean;
}
