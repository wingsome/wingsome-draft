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
import { Relation } from 'src/relation/entity/relation.entity';
import { RequestStatus } from 'src/common/enum/request-status.enum';
import { WinkerRegisteredResponseDto } from './dto/winker-registered-response';
import { UpdatePriorityBioDto } from './dto/update-priority-bio.dto';
import { WinkerInDepthsResponseDto } from './dto/winker-in-depths-response';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(ProfileUser) private readonly profileUserRepository: Repository<ProfileUser>,
    @InjectRepository(ProfileWinker) private readonly profileWinkerRepository: Repository<ProfileWinker>,
    @InjectRepository(ProfileWinkerImage) private readonly profileWinkerImageRepository: Repository<ProfileWinkerImage>,
    @InjectRepository(ProfileWinkerRegister) private readonly profileWinkerRegisterRepository: Repository<ProfileWinkerRegister>,
    @InjectRepository(Relation) private readonly relationRepository: Repository<Relation>
  ) {}

  async updateProfileUser(userId: number, dto: UpdateProfileUserDto): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('user not found');

    let profile = await this.profileUserRepository.findOne({ where: { userId } });
    if (profile) Object.assign(profile, dto);
    else profile = this.profileUserRepository.create({ userId, ...dto });
    await this.profileUserRepository.save(profile);
  }
  
  async getProfileUser(userId: number): Promise<ProfileUser> {
    const profile = await this.profileUserRepository.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('user profile not found');
    return profile;
  }

  @Transactional()
  async updateProfileWinker(userId: number, dto: UpdateProfileWinkerDto): Promise<void> {
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

    await this.profileWinkerRepository.save(profile);
  }

  async getProfileWinker(userId: number): Promise<ProfileWinker> {
    const profile = await this.profileWinkerRepository
      .createQueryBuilder('winker')
      .leftJoinAndSelect('winker.images', 'images')
      .leftJoinAndSelect('winker.registered', 'registered')
      .where('winker.userId = :userId', { userId })
      .orderBy('images.priority', 'ASC')
      .addOrderBy('registered.priorityBio', 'DESC')
      .getOne();
    if (!profile) throw new NotFoundException('winker profile not found');
    return profile;
  }
  
  async updateProfileWinkerVisible(userId: number, visible: boolean): Promise<void> {
    const profile = await this.profileWinkerRepository.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('winker profile not found');
    profile.visible = visible;
    await this.profileWinkerRepository.save(profile);
  }
  
  @Transactional()
  async updateProfileWinkerRegistersPriority(userId: number, dto: UpdatePriorityBioDto[]): Promise<void> {
    const profile = await this.profileWinkerRepository.findOne({ select: ['id'], where: { userId} });
    if (!profile) throw new NotFoundException('winker profile not found');
  
    const registerIds = dto.map(item => item.registerId);
    const registers = await this.profileWinkerRegisterRepository.find({ where: { id: In(registerIds) } });
    if (registers.length !== registerIds.length) { throw new NotFoundException('one or more registers not found'); }
  
    for (const register of registers) {
      if (profile.id !== register.profileWinkerId) {
        throw new ForbiddenException('do not have permission for one or more registers');
      }
    }
  
    for (const item of dto) {
      await this.profileWinkerRegisterRepository.update({ id: item.registerId }, { priority: item.priority });
    }
  }

  async registerProfileWinker(requestUserId: number, targetUserId: number): Promise<void> {
    if (requestUserId === targetUserId) throw new BadRequestException('target user should not be self');

    const targetUser = await this.userRepository.findOne({ where: { id: targetUserId } });
    if (!targetUser) throw new NotFoundException('target user not found');

    const profile = await this.profileWinkerRepository.findOne({ where: { userId: targetUserId } });
    if (!profile) throw new NotFoundException('target winker profile not found');

    const [userMinId, userMaxId] = requestUserId < targetUserId ? [requestUserId, targetUserId] : [targetUserId, requestUserId];
    const relationship = await this.relationRepository.findOne({
      where: { userMinId, userMaxId, status: RequestStatus.ACCEPTED }
    });
    if (!relationship) throw new ForbiddenException('do not have permission');

    const register = this.profileWinkerRegisterRepository.create({ profileWinkerId: profile.id, userId: requestUserId });
    try {
      await this.profileWinkerRegisterRepository.save(register);
    } catch (e) {
      if (e.code === '23505') throw new ConflictException('this target winker profile already exists');
      throw e;
    }
  }

  async getProfileWinkersRegistered(userId: number): Promise<WinkerRegisteredResponseDto[]> {
    const registers = await this.profileWinkerRegisterRepository.find({
      where: { userId }, relations: ['profileWinker', 'profileWinker.images']
    });
    const winkerUserIds = registers.map((r) => r.profileWinker.userId);
    const users = await this.profileUserRepository.find({ where: { userId: In(winkerUserIds) } });
    const userMap = new Map(users.map((u) => [u.userId, u]));

    const results: WinkerRegisteredResponseDto[] = [];

    for (const r of registers) {
      const p = r.profileWinker;
      const u = userMap.get(p.userId);
      if (!p || !u) continue;
    
      results.push({
        registerId: r.id,
        name: u.name,
        birthYear: u.birthYear,
        gender: u.gender,
        region1: p.region1,
        region2: p.region2,
        education: p.education,
        job: p.job,
        tall: p.tall,
        mbti: p.mbti,
        smoke: p.smoke,
        tattoo: p.tattoo,
        religion: p.religion,
        bioByWinker: p.bio,
        bioByRegister: r.bio,
        visible: p.visible,
        images: p.images
          .sort((a, b) => a.priority - b.priority)
          .map(img => img.url)
      });
    }
    
    return results;
  }
  
  async updateProfileWinkerRegisteredBio(userId: number, registerId: number, bio: string): Promise<void> {
    const register = await this.profileWinkerRegisterRepository.findOne({ where: { id: registerId } });
    if (!register) throw new NotFoundException('register not found');
    if (userId !== register.userId) throw new ForbiddenException('do not have permission');

    register.bio = bio;
    await this.profileWinkerRegisterRepository.save(register);
  }
  
  async deleteProfileWinkerRegisteredBio(userId: number, registerId: number): Promise<void> {
    const profile = await this.profileWinkerRepository.findOne({ select: ['id'], where: { userId} });
    if (!profile) throw new NotFoundException('winker profile not found');

    const register = await this.profileWinkerRegisterRepository.findOne({ where: { id: registerId } });
    if (!register) throw new NotFoundException('register not found');

    if (userId === register.userId || profile.id === register.profileWinkerId) {
      register.bio = null;
      await this.profileWinkerRegisterRepository.save(register);
    } else throw new ForbiddenException('do not have permission');
  }
  
  async deleteProfileWinkerRegistered(userId: number, registerId: number): Promise<void> {
    const profile = await this.profileWinkerRepository.findOne({ select: ['id'], where: { userId} });
    if (!profile) throw new NotFoundException('winker profile not found');

    const register = await this.profileWinkerRegisterRepository.findOne({ where: { id: registerId } });
    if (!register) throw new NotFoundException('register not found');

    if (userId === register.userId || profile.id === register.profileWinkerId) {
      await this.profileWinkerRegisterRepository.remove(register);
    } else throw new ForbiddenException('do not have permission');
  }
  
  async deleteProfileWinkerRegistersByDeleteRelation(userId: number, relationId: number): Promise<void> {
    const relation = await this.relationRepository.findOne({ where: { id: relationId } });
    if (!relation) throw new NotFoundException('request not found');
    if (relation.userMinId !== userId && relation.userMaxId !== userId) {
      throw new ForbiddenException('do not have permission');
    }

    const userA = relation.userMinId;
    const userB = relation.userMaxId;
  
    const profileA = await this.profileWinkerRepository.findOne({ select: ['id'], where: { userId: userA } });
    const profileB = await this.profileWinkerRepository.findOne({ select: ['id'], where: { userId: userB } });
    
    if (profileA) await this.profileWinkerRegisterRepository.delete({ profileWinkerId: profileA.id, userId: userB });
    if (profileB) await this.profileWinkerRegisterRepository.delete({ profileWinkerId: profileB.id, userId: userA });
  }

  async getProfileWinkers(userId: number, maxDepth: number): Promise<WinkerInDepthsResponseDto[]> {
    // BFS 기반 지인 userId 목록 조회
    const depthUserIds = await this.getDepthUserIds(userId, maxDepth);
    
    const registers = await this.profileWinkerRegisterRepository.find({
      where: { userId: In(depthUserIds) }, relations: ['profileWinker', 'profileWinker.images']
    });
    if (registers.length === 0) return [];
    
    const winkerUserIds = registers.map(r => r.profileWinker.userId);
    const users = await this.profileUserRepository.find({ where: { userId: In(winkerUserIds) } });
    const userMap = new Map(users.map(u => [u.userId, u]));
    const winkerMap = new Map<number, { user: ProfileUser; winker: ProfileWinker; registers: any[]; }>();

    for (const r of registers) {
      const p = r.profileWinker;
      const u = userMap.get(p.userId);
      if (!p || !u) continue;
  
      // winkerMap 에 아직 해당 userId가 없다면 새로 생성
      if (!winkerMap.has(p.userId)) winkerMap.set(p.userId, { winker: p, user: u, registers: [] });
      // 이미 있다면 기존 entry에 register만 추가
      const entry = winkerMap.get(p.userId)!;
      entry.registers.push({ userId: r.userId, bio: r.bio, priority: r.priority });
    }
    
    const results: WinkerInDepthsResponseDto[] = [];
  
    for (const { winker, user, registers } of winkerMap.values()) {
      const dto: WinkerInDepthsResponseDto = {
        userId: user.id,
        name: user.name,
        birthYear: user.birthYear,
        gender: user.gender,

        region1: winker.region1,
        region2: winker.region2,
        education: winker.education,
        job: winker.job,
        tall: winker.tall,
        mbti: winker.mbti,
        smoke: winker.smoke,
        tattoo: winker.tattoo,
        religion: winker.religion,
        bio: winker.bio,

        images: winker.images
          .sort((a, b) => a.priority - b.priority)
          .map(img => img.url),
        registers: registers
          .sort((a, b) => a.priority - b.priority)
          .map((r) => ({
            userId: r.userId,
            bio: r.bio,
          }))
      };

      results.push(dto);
    }
    
    return results;
  }
  
  private async getDepthUserIds(userId: number, maxDepth: number): Promise<number[]> {
    if (maxDepth < 1) return [];

    const userIds = new Set<number>();
    const nodes = new Set<number>();   // 각 depth 단계별 탐색할 userId 목록

    userIds.add(userId); // depth=0: 내 register
    nodes.add(userId);   // BFS 시작점 (depth=0)

    for (let depth = 1; depth <= maxDepth; depth++) {
      const currentIds = Array.from(nodes);
      nodes.clear();

      const relations = await this.relationRepository.find({
        where: [
          { userMinId: In(currentIds), status: RequestStatus.ACCEPTED },
          { userMaxId: In(currentIds), status: RequestStatus.ACCEPTED },
        ],
      });

      for (const r of relations) {
        const targetId = currentIds.includes(r.userMinId) ? r.userMaxId : r.userMinId;
        if (userIds.has(targetId)) continue; // 이미 depth에 포함된 userId 제외
        userIds.add(targetId);
        nodes.add(targetId);
      }
  
      if (nodes.size === 0) break; // 더 확장 불가 → 종료
    }
  
    return Array.from(userIds);
  }
}
