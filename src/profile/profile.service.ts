import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProfileUser } from './entity/profile-user.entity';
import { Repository } from 'typeorm';
import { UpdateProfileUserDto } from './dto/update-profile-user.dto';
import { User } from 'src/user/entity/user.entity';
import { ProfileWingker } from './entity/profile-wingker.entity';
import { UpdateProfileWingkerDto } from './dto/update-profile-wingker.dto';
import { ProfileWingkerImage } from './entity/profile-wingker-image.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(ProfileUser) private readonly profileUserRepository: Repository<ProfileUser>,
    @InjectRepository(ProfileWingker) private readonly profileWingkerRepository: Repository<ProfileWingker>,
    @InjectRepository(ProfileWingkerImage) private readonly profileWingkerImageRepository: Repository<ProfileWingkerImage>,
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
    const profile = await this.profileUserRepository.findOne({
      where: { userId },
      select: ['name', 'birthYear', 'gender', 'profileImageUrl', 'bio']
    });
    if (!profile) throw new NotFoundException('User profile not found.');
    return profile;
  }

  async updateProfileWingker(userId: number, request: UpdateProfileWingkerDto): Promise<ProfileWingker> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');

    let profile = await this.profileWingkerRepository.findOne({ where: { userId } });
    if (profile) {
      Object.assign(profile, request);
      // 기존 이미지 삭제 후 신규 저장
      await this.profileWingkerImageRepository.delete({ profileWingkerId: profile.id });
      profile.images = request.images.map((img) =>
        this.profileWingkerImageRepository.create({ ...img }),
      );
    } else {
      profile = this.profileWingkerRepository.create({
        userId,
        ...request,
        images: request.images.map((img) =>
          this.profileWingkerImageRepository.create({ ...img })
        ),
      });
    }

    return await this.profileWingkerRepository.save(profile);
  }
  
  async updateActive(userId: number, active: boolean): Promise<ProfileWingker> {
    const profile = await this.profileWingkerRepository.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Wingker profile not found.');
    profile.isActive = active;
    return await this.profileWingkerRepository.save(profile);
  }

  async getProfileWingker(userId: number): Promise<ProfileWingker> {
    const profile = await this.profileWingkerRepository.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Wingker profile not found.');
    return profile;
  }
}
