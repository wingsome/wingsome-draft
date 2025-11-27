import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { IsNull, Not, Repository } from 'typeorm';
import { User } from './entity/user.entity';
import { AuthService } from 'src/auth/auth.service';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly authService: AuthService
  ) {}
  
  private readonly HASH_ROUND = 10;

  @Transactional()
  async createUser(country: string, phone: string, password: string, recover?: boolean): Promise<{ accessToken: string; refreshToken: string }> {
    // 중복 활성화 계정 확인
    const activeUser = await this.userRepository.findOne({ where: { country, phone } });
    if (activeUser) throw new ConflictException({
      message: 'this phone number has already been registered',
      deletedAt: null
    });

    // 최근 삭제 계정 확인
    const latestDeletedUser = await this.userRepository.findOne({
      where: { country, phone, deletedAt: Not(IsNull()) },
      withDeleted: true,
      order: { deletedAt: 'DESC' }
    });
    
    let user: User;
    // 둘 다 존재하지 않음: 신규 생성
    if (!latestDeletedUser) {
      const pwdHash = await bcrypt.hash(password, this.HASH_ROUND);
      user = this.userRepository.create({ country, phone, pwdHash });
      user = await this.userRepository.save(user);
    }
    else {
      if (recover === true) {
        // 최근 삭제 계정 복구
        latestDeletedUser.deletedAt = null;
        latestDeletedUser.pwdHash = await bcrypt.hash(password, this.HASH_ROUND);
        user = await this.userRepository.save(latestDeletedUser);
      } else if (recover === false) {
        // 재가입
        const pwdHash = await bcrypt.hash(password, this.HASH_ROUND);
        user = this.userRepository.create({ country, phone, pwdHash });
        user = await this.userRepository.save(user);
      }
      else throw new ConflictException({
        message: 'this phone number was previously deleted',
        deletedAt: latestDeletedUser.deletedAt
      });
    }
    return await this.authService.issueTokenPair(user)
  }
  
  async getUser(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('user not found');
    return user;
  }

  async updatePassword(country: string, phone: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { country, phone } });
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
