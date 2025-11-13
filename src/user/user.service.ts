import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { IsNull, Not, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entity/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>
  ) {}
  
  private readonly HASH_ROUND = 10;

  async createUser(dto: CreateUserDto): Promise<User> {
    const { country, phone, password, recover } = dto;

    // 중복 활성화 계정 확인
    const activeUser = await this.userRepository.findOne({ where: { country, phone } });
    if (activeUser) throw new ConflictException('this phone number has already been registered');

    // 최근 삭제 계정 확인
    const latestDeletedUser = await this.userRepository.findOne({
      where: { country, phone, deletedAt: Not(IsNull()) },
      withDeleted: true,
      order: { deletedAt: 'DESC' }
    });
    
    // 둘 다 존재하지 않음: 신규 생성
    if (!latestDeletedUser) {
      const pwdHash = await bcrypt.hash(password, this.HASH_ROUND);
      const user = this.userRepository.create({ country, phone, pwdHash });
      return await this.userRepository.save(user);
    }

    // 최근 삭제 계정 존재
    if (latestDeletedUser) {
      if (recover === true) {
        // 최근 삭제 계정 복구
        latestDeletedUser.deletedAt = null;
        latestDeletedUser.pwdHash = await bcrypt.hash(password, this.HASH_ROUND);
        return await this.userRepository.save(latestDeletedUser);
      } else if (recover === false) {
        // 재가입
        const pwdHash = await bcrypt.hash(password, this.HASH_ROUND);
        const user = this.userRepository.create({ country, phone, pwdHash });
        return await this.userRepository.save(user);
      }
      throw new ConflictException(`this phone number was previously deleted at ${latestDeletedUser.deletedAt}`);
    }
    throw new ConflictException(`unexpected state for phone: ${phone}`);
  }

  async updatePassword(id: number, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('user not found');

    const newHash = await bcrypt.hash(newPassword, this.HASH_ROUND);
    user.pwdHash = newHash;

    await this.userRepository.save(user);
  }

  async deleteUser(id: number, password: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('user not found');

    const isMatch = await bcrypt.compare(password, user.pwdHash);
    if (!isMatch) throw new UnauthorizedException('invalid password');

    await this.userRepository.softRemove(user);
  }
}
