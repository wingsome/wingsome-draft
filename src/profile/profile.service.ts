import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entity/user.entity';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { UpdateProfileUserDto } from './dto/update-profile-user.dto';
import { UpdateProfileWinkerDto } from './dto/update-profile-winker.dto';
import { ProfileUser } from './entity/profile-user.entity';
import { ProfileWinkerImage } from './entity/profile-winker-image.entity';
import { ProfileWinker } from './entity/profile-winker.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(ProfileUser) private readonly profileUserRepository: Repository<ProfileUser>,
    @InjectRepository(ProfileWinker) private readonly profileWinkerRepository: Repository<ProfileWinker>,
    @InjectRepository(ProfileWinkerImage) private readonly profileWinkerImageRepository: Repository<ProfileWinkerImage>,
    @InjectRepository(User) private readonly userRepository: Repository<User>
  ) {}

  async updateProfileUser(userId: number, request: UpdateProfileUserDto): Promise<ProfileUser> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');

    let profile = await this.profileUserRepository.findOne({ where: { userId } });
    if (profile) Object.assign(profile, request);
    else profile = this.profileUserRepository.create({ userId, ...request });
    return await this.profileUserRepository.save(profile);
  }
  
  async getProfileUser(userId: number): Promise<ProfileUser> {
    const profile = await this.profileUserRepository.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('User profile not found.');
    return profile;
  }

  @Transactional()
  async updateProfileWinker(userId: number, request: UpdateProfileWinkerDto): Promise<ProfileWinker> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');

    let profile = await this.profileWinkerRepository.findOne({ where: { userId } });
    if (profile) {
      Object.assign(profile, request);
      // 기존 이미지 삭제 후 신규 저장
      await this.profileWinkerImageRepository.delete({ profileWinkerId: profile.id });
      profile.images = request.images.map((img) =>
        this.profileWinkerImageRepository.create({ ...img }),
      );
    } else {
      profile = this.profileWinkerRepository.create({
        userId,
        ...request,
        images: request.images.map((img) =>
          this.profileWinkerImageRepository.create({ ...img })
        ),
      });
    }

    return await this.profileWinkerRepository.save(profile);
  }
  
  async updateActive(userId: number, active: boolean): Promise<ProfileWinker> {
    const profile = await this.profileWinkerRepository.findOne({ where: { userId }, relations: ['images'] });
    if (!profile) throw new NotFoundException('Winker profile not found.');
    profile.isActive = active;
    return await this.profileWinkerRepository.save(profile);
  }

  async getProfileWinker(userId: number): Promise<ProfileWinker> {
    const profile = await this.profileWinkerRepository.findOne({ where: { userId }, relations: ['images'] });
    if (!profile) throw new NotFoundException('Winker profile not found.');
    return profile;
  }
}
