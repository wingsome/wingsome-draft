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
import { Register, WinkerInDepthsResponseDto } from './dto/winker-in-depths-response';

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
  
  async getProfileUsers(params: { phones?: string[]; userIds?: number[]; }): Promise<ProfileUser[]> {
    const { phones, userIds } = params;
    let targetUserIds: number[] = userIds ?? [];
    
    if (phones && phones.length > 0) {
      const users = await this.userRepository.find({ select: ['id'], where: { phone: In(phones) } });
      targetUserIds = users.map((u) => u.id);
    }

    return await this.profileUserRepository.find({ where: { userId: In(targetUserIds) } });
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
    const profile = await this.profileWinkerRepository.findOne({
      where: { userId },
      relations: ['images', 'registered']
    });
    if (!profile) throw new NotFoundException('winker profile not found');
    return profile;
  }
  
  async updateProfileWinkerVisible(userId: number, visible: boolean): Promise<void> {
    const profile = await this.profileWinkerRepository.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('winker profile not found');
    profile.visible = visible;
    await this.profileWinkerRepository.save(profile);
  }
  
  async updateProfileWinkerBioVisible(userId: number, registerId: number, visible: boolean): Promise<void> {
    const profile = await this.profileWinkerRepository.findOne({ select: ['id'], where: { userId} });
    if (!profile) throw new NotFoundException('winker profile not found');

    const register = await this.profileWinkerRegisterRepository.findOne({ where: { id: registerId } });
    if (!register) throw new NotFoundException('register not found');

    if (profile.id !== register.profileWinkerId) throw new ForbiddenException('do not have permission');

    register.visibleBio = visible;
    await this.profileWinkerRegisterRepository.save(register);
  }
  
  @Transactional()
  async updateProfileWinkerReputationsPriority(userId: number, dto: UpdatePriorityBioDto[]): Promise<void> {
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
      await this.profileWinkerRegisterRepository.update({ id: item.registerId }, { priorityBio: item.priority });
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
        bioByWinker: p.bio,
        bioByUser: r.bio,
        visibleByWinker: p.visible,
        visibleByUser: r.visibleProfile,
        images: p.images.map((img) => ({
          url: img.url,
          priority: img.priority
        }))
      });
    }
    
    return results;
  }
  
  async updateProfileWinkerRegisteredVisible(userId: number, registerId: number, visible: boolean): Promise<void> {
    const register = await this.profileWinkerRegisterRepository.findOne({ where: { id: registerId } });
    if (!register) throw new NotFoundException('register not found');
    if (userId !== register.userId) throw new ForbiddenException('do not have permission');

    register.visibleProfile = visible;
    await this.profileWinkerRegisterRepository.save(register);
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
    /**
     * 1) depth 기반으로 지인 userId 목록 조회
     */
    const depthUserIds = await this.getDepthUserIds(userId, maxDepth);
    depthUserIds.push(userId);
  
    /**
     * 2) 이 지인들이 등록한 모든 윙커 프로필 조회
     */
    const registers = await this.profileWinkerRegisterRepository.find({
      where: {
        userId: In(depthUserIds),
        visibleProfile: true,
        visibleBio: true,
      },
      relations: ['profileWinker', 'profileWinker.images'],
      order: { priorityBio: 'ASC' }
    });
  
    if (registers.length === 0) return [];
  
    /**
     * 3) 윙커의 userId만 추출 후 실제 사용자 정보(ProfileUser) 조회
     */
    const winkerUserIds = registers.map(r => r.profileWinker.userId);
    const profileUsers = await this.profileUserRepository.find({
      where: { userId: In(winkerUserIds) }
    });
  
    const userMap = new Map(profileUsers.map(u => [u.userId, u]));
  
    /**
     * 4) depth 계산을 위해 역으로 depth lookup 구성
     */
    const depthLookup = new Map<number, number>();
    depthLookup.set(userId, 0);
    for (const id of depthUserIds) {
      depthLookup.set(id, await this.getUserDepth(userId, id, maxDepth));
    }
  
    /**
     * 5) 윙커 기준 그룹핑 (하나의 윙커에 여러 register 가능)
     */
    const winkerMap = new Map<number, {
      depth: number;
      winker: ProfileWinker;
      registers: Register[];
      user: any;
    }>();
  
    for (const r of registers) {
      const winker = r.profileWinker;
      const u = userMap.get(winker.userId);
      if (!winker || !u) continue;
  
      const depth = depthLookup.get(r.userId) ?? maxDepth;
  
      if (!winkerMap.has(winker.userId)) {
        winkerMap.set(winker.userId, {
          depth,
          winker,
          user: u,
          registers: []
        });
      }

      // non-null 보장된 상태에서 get()
      const entry = winkerMap.get(winker.userId)!;
  
      entry.registers.push({
        userId: r.userId,
        bio: r.bio,
        priority: r.priorityBio,
      });
    }
  
    /**
     * 6) DTO로 변환
     */
    const results: WinkerInDepthsResponseDto[] = [];
  
    for (const { depth, winker, user, registers } of winkerMap.values()) {
      const dto: WinkerInDepthsResponseDto = {
        depth,
        userId: winker.userId,
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
        bio: winker.bio,
        images: winker.images
          .sort((a, b) => a.priority - b.priority)
          .map(img => ({
            url: img.url,
            priority: img.priority
          })),
        registers
      };
  
      results.push(dto);
    }
  
    return results;
  }

  private async getDepthUserIds(userId: number, maxDepth: number): Promise<number[]> {
    if (maxDepth < 1) return [];
  
    const visited = new Set<number>(); // 이미 depth에 포함된 회원
    const queue = new Set<number>();   // 현재 depth의 frontier
  
    queue.add(userId);
  
    for (let depth = 1; depth <= maxDepth; depth++) {
      const currentIds = Array.from(queue); // 이전 depth의 userIds
      queue.clear();
  
      // 이전 depth 회원들과 ACCEPTED 관계를 가진 모든 userIds 조회
      const relations = await this.relationRepository.find({
        where: [
          { status: RequestStatus.ACCEPTED, userMinId: In(currentIds) },
          { status: RequestStatus.ACCEPTED, userMaxId: In(currentIds) },
        ],
      });
  
      for (const r of relations) {
        const nextId =
          currentIds.includes(r.userMinId) ? r.userMaxId : r.userMinId;
  
        // 조건
        if (nextId === userId) continue;       // 자기 자신 제외
        if (visited.has(nextId)) continue;     // 이미 depth에 포함된 userId 제외
  
        visited.add(nextId);
        queue.add(nextId); // 다음 depth 탐색 후보
      }
  
      if (queue.size === 0) break; // 더 확장 불가 → 종료
    }
  
    return Array.from(visited);
  }

  private async getUserDepth(originUserId: number, targetUserId: number, maxDepth: number): Promise<number> {
    let currentIds = [originUserId];
    const visited = new Set<number>();
  
    for (let depth = 1; depth <= maxDepth; depth++) {
      const relations = await this.relationRepository.find({
        where: [
          { status: RequestStatus.ACCEPTED, userMinId: In(currentIds) },
          { status: RequestStatus.ACCEPTED, userMaxId: In(currentIds) }
        ]
      });
  
      const nextLevel = new Set<number>();
  
      for (const r of relations) {
        const candidate =
          currentIds.includes(r.userMinId) ? r.userMaxId : r.userMinId;
        if (!visited.has(candidate)) {
          nextLevel.add(candidate);
        }
      }
  
      if (nextLevel.has(targetUserId)) return depth;

      // nextLevel → visited 로 안전하게 추가
      for (const n of nextLevel) visited.add(n);
  
      currentIds = Array.from(nextLevel);
  
      // 더 확장할 것이 없으면 종료
      if (currentIds.length === 0) break;
    }
  
    return maxDepth;
  }
}
