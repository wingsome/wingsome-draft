import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entity/user.entity';
import { In, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { UpdateProfileUserDto } from './dto/update-profile-user.dto';
import { UpdateProfileWinkerDto } from './dto/update-profile-winker.dto';
import { ProfileUser } from './entity/profile-user.entity';
import { ProfileWinkerImage } from './entity/profile-winker-image.entity';
import { ProfileWinker } from './entity/profile-winker.entity';
import { ProfileWinkerRegister } from './entity/profile-winker-register.entity';
import { Relationship } from 'src/relation/entity/relationship.entity';
import { RequestStatus } from 'src/common/enum/request-status.enum';
import { ProfileWinkerResponseDto } from './dto/profile-winker-response';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(ProfileUser) private readonly profileUserRepository: Repository<ProfileUser>,
    @InjectRepository(ProfileWinker) private readonly profileWinkerRepository: Repository<ProfileWinker>,
    @InjectRepository(ProfileWinkerImage) private readonly profileWinkerImageRepository: Repository<ProfileWinkerImage>,
    @InjectRepository(ProfileWinkerRegister) private readonly profileWinkerRegisterRepository: Repository<ProfileWinkerRegister>,
    @InjectRepository(Relationship) private readonly relationshipRepository: Repository<Relationship>
  ) {}

  async updateProfileUser(userId: number, dto: UpdateProfileUserDto): Promise<ProfileUser> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('user not found');

    let profile = await this.profileUserRepository.findOne({ where: { userId } });
    if (profile) Object.assign(profile, dto);
    else profile = this.profileUserRepository.create({ userId, ...dto });
    return await this.profileUserRepository.save(profile);
  }
  
  async getProfileUser(userId: number): Promise<ProfileUser> {
    const profile = await this.profileUserRepository.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('user profile not found');
    return profile;
  }
  
  async getProfileUsersByPhones(phones: string[]): Promise<ProfileUser[]> {
    const users = await this.userRepository.find({ select: ['id'], where: { phone: In(phones) } });
    const userIds = users.map((u) => u.id);
    return await this.profileUserRepository.find({ where: { userId: In(userIds) } });
  }

  @Transactional()
  async updateProfileWinker(userId: number, dto: UpdateProfileWinkerDto): Promise<ProfileWinker> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('user not found');

    let profile = await this.profileWinkerRepository.findOne({ where: { userId } });
    if (profile) {
      Object.assign(profile, dto);
      // 기존 이미지 삭제 후 신규 저장
      await this.profileWinkerImageRepository.delete({ profileWinkerId: profile.id });
      profile.images = dto.images.map((img) =>
        this.profileWinkerImageRepository.create({ ...img }),
      );
    } else {
      profile = this.profileWinkerRepository.create({
        userId,
        ...dto,
        images: dto.images.map((img) =>
          this.profileWinkerImageRepository.create({ ...img })
        ),
      });
    }

    return await this.profileWinkerRepository.save(profile);
  }
  
  async updateActive(userId: number, active: boolean): Promise<ProfileWinker> {
    const profile = await this.profileWinkerRepository.findOne({
      where: { userId },
      relations: ['images', 'reputations', 'registered']
    });
    if (!profile) throw new NotFoundException('winker profile not found');
    profile.isActive = active;
    return await this.profileWinkerRepository.save(profile);
  }

  async getProfileWinker(userId: number): Promise<ProfileWinker> {
    const profile = await this.profileWinkerRepository.findOne({
      where: { userId },
      relations: ['images', 'reputations', 'registered']
    });
    if (!profile) throw new NotFoundException('winker profile not found');
    return profile;
  }

  async registerProfileWinker(requestUserId: number, targetUserId: number): Promise<void> {
    if (requestUserId === targetUserId) throw new BadRequestException('requested userId should not be self');

    const targetUser = await this.userRepository.findOne({ where: { id: targetUserId } });
    if (!targetUser) throw new NotFoundException('user not found');

    const profile = await this.profileWinkerRepository.findOne({ where: { userId: targetUserId } });
    if (!profile) throw new NotFoundException('winker profile not found');

    const [userMinId, userMaxId] = requestUserId < targetUserId ? [requestUserId, targetUserId] : [targetUserId, requestUserId];
    const relationship = await this.relationshipRepository.findOne({
      where: { userMinId, userMaxId, status: RequestStatus.ACCEPTED }
    });
    if (!relationship) throw new ForbiddenException('do not have permission');

    const register = this.profileWinkerRegisterRepository.create({ profileWinkerId: profile.id, userId: requestUserId });
    try {
      await this.profileWinkerRegisterRepository.save(register);
    } catch (e) {
      if (e.code === '23505') throw new ConflictException('this winker profile already exists');
      throw e;
    }
  }

  async getProfileWinkers(userId: number): Promise<ProfileWinkerResponseDto[]> {
    const registers = await this.profileWinkerRegisterRepository.find({
      where: { userId }, relations: ['profileWinker', 'profileWinker.images']
    });
    const winkerUserIds = registers.map((r) => r.profileWinker.userId);
    const users = await this.profileUserRepository.find({ where: { userId: In(winkerUserIds) } });
    const userMap = new Map(users.map((u) => [u.userId, u]));

    return registers.map((r) => {
      const p = r.profileWinker;
      const u = userMap.get(p.userId);

      return {
        registerId: r.id,
        profileWinkerId: p.id,
        name: u?.name ?? null,
        birthYear: u?.birthYear ?? null,
        gender: u?.gender ?? null,
        userId: p.userId,
        region1: p.region1,
        region2: p.region2,
        education: p.education,
        job: p.job,
        tall: p.tall,
        mbti: p.mbti,
        smoke: p.smoke,
        tattoo: p.tattoo,
        bio: p.bio,
        isActiveByWinker: p.isActive,
        isActiveByUser: r.isActive,
        priority: r.priority,
        images: p.images?.map((img) => ({
          url: img.url,
          priority: img.priority,
        })) ?? [],
      };
    });
  }
}
