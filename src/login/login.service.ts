import { ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { User } from './entity/user.entity';

@Injectable()
export class LoginService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async createUser(request: CreateUserDto): Promise<{ id: number }> {
    const { region, phone, password } = request;
    const pwdHash = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({ region, phone, pwdHash });

    try {
      const saved = await this.userRepository.save(user);
      return { id: saved.id };
    } catch (error) {
      if (error.code === '23505') { // 연락처 중복 오류
        const existing = await this.userRepository.findOne({ where: { phone }, withDeleted: true });
        if (existing?.deletedAt) throw new ConflictException(`This phone number has deleted at ${existing.deletedAt}`);
        throw new ConflictException('This phone number has already been registered.');
      }
      throw new InternalServerErrorException('Failed to create user.');
    }
  }

  async updatePassword(request: UpdatePasswordDto): Promise<void> {
    const { region, phone, newPassword } = request;

    const user = await this.userRepository.findOne({ where: { region, phone } });
    if (!user) throw new NotFoundException('User not found.');
    if (!user.pwdHash) throw new UnauthorizedException('Password not set for this account.');

    const isSamePassword = await bcrypt.compare(newPassword, user.pwdHash);
    if (isSamePassword) throw new UnauthorizedException('Existing password cannot be reused.');

    const newHash = await bcrypt.hash(newPassword, 10);
    user.pwdHash = newHash;

    await this.userRepository.save(user);
  }

  async deleteUser(id: number, password: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found.');
    if (!user.pwdHash) throw new UnauthorizedException('Password not set for this account.');

    const isMatch = await bcrypt.compare(password, user.pwdHash);
    if (!isMatch) throw new UnauthorizedException('Invalid password.');

    await this.userRepository.softRemove(user);
  }
}
