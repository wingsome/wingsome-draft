import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entity/user.entity';
import { IsNull, Not, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>
  ) {}

  async createUser(request: CreateUserDto): Promise<{ id: number }> {
    const { region, phone, password, recover } = request;

    // 중복 활성화 계정 확인
    const activeUser = await this.userRepository.findOne({ where: { phone } });
    if (activeUser) throw new ConflictException('This phone number has already been registered.');

    // 최근 삭제 계정 확인
    const latestDeletedUser = await this.userRepository.findOne({
      where: { phone, deletedAt: Not(IsNull()) },
      withDeleted: true,
      order: { deletedAt: 'DESC' }
    });
    
    // 둘 다 존재하지 않음: 신규 생성
    if (!latestDeletedUser) {
      const pwdHash = await bcrypt.hash(password, 10);
      const user = this.userRepository.create({ region, phone, pwdHash });
      const saved = await this.userRepository.save(user);
      return { id: saved.id };
    }

    // 최근 삭제 계정 존재
    if (latestDeletedUser) {
      if (recover === true) {
        // 최근 삭제 계정 복구
        latestDeletedUser.deletedAt = null;
        latestDeletedUser.pwdHash = await bcrypt.hash(password, 10);
        const recovered = await this.userRepository.save(latestDeletedUser);
        return { id: recovered.id };
      } else if (recover === false) {
        // 재가입
        const pwdHash = await bcrypt.hash(password, 10);
        const latestDeletedUser = this.userRepository.create({ region, phone, pwdHash });
        const saved = await this.userRepository.save(latestDeletedUser);
        return { id: saved.id };
      }
      throw new ConflictException(`This phone number was previously deleted at ${latestDeletedUser.deletedAt}.`);
    }
    throw new ConflictException(`Unexpected state for phone: ${phone}`);
  }

  async updatePassword(id: number, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found.');

    const newHash = await bcrypt.hash(newPassword, 10);
    user.pwdHash = newHash;

    await this.userRepository.save(user);
  }

  async deleteUser(id: number, password: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found.');

    const isMatch = await bcrypt.compare(password, user.pwdHash);
    if (!isMatch) throw new UnauthorizedException('Invalid password.');

    await this.userRepository.softRemove(user);
  }
}
