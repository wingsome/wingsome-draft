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
  
  async getProfileUsers(params: { phones?: string[]; userIds?: number[]; }): Promise<ProfileUser[]> {
    const { phones, userIds } = params;
    let targetUserIds: number[] = userIds ?? [];
    
    if (phones && phones.length > 0) {
      const users = await this.userRepository.find({ select: ['id'], where: { phone: In(phones) } });
      targetUserIds = users.map((u) => u.id);
    }

    return await this.profileUserRepository.find({ where: { userId: In(targetUserIds) } });
  }

  /**
   * 특정 사용자(userId)를 기준으로,
   * 1~maxDepth 단계 안에 존재하는 지인들이 등록한 Winker 프로필을 전부 조회하고
   * depth 정보와 함께 DTO 형태로 반환한다.
   */
  async getProfileWinkers(userId: number, maxDepth: number): Promise<WinkerInDepthsResponseDto[]> {

    // BFS 기반으로, userId 기준 maxDepth 안에 존재하는 userId 목록 추출
    const depthUserIds = await this.getDepthUserIds(userId, maxDepth);

    /**
     * ↓ Winker 등록 정보에는 userId(owner)가 들어있음.
     *    본인의 프로필도 보여줘야 한다면 본인 userId를 depthUserIds에 추가한다.
     *    (depth=0 으로 처리)
     */
    depthUserIds.push(userId);

    /**
     * 2) depthUserIds 에 포함된 회원들이 등록한 모든 Winker 프로필을 조회한다.
     *    - profile_winker_register: 특정 사용자가 어떤 Winker 프로필을 등록/추천한 기록
     *    - visibleProfile, visibleBio 조건: 노출 가능한 프로필만 조회
     *    - profileWinker, profileWinker.images 를 JOIN 하여 한번에 가져온다.
     */
    const registers = await this.profileWinkerRegisterRepository.find({
      where: {
        userId: In(depthUserIds), // depth 내 지인이 등록한 프로필만
        visibleProfile: true,
        visibleBio: true,
      },
      relations: ['profileWinker', 'profileWinker.images'], // JOIN
      order: { priorityBio: 'ASC' } // 소개글 우선순위 오름차순 정렬
    });

    /**
     * 지인이 등록한 Winker 가 없다면 즉시 빈 배열 반환
     */
    if (registers.length === 0) return [];

    /**
     * 3) Winker 프로필의 소유자(userId)를 모두 추출
     *    (하나의 winker 프로필이 여러 지인에 의해 등록될 수 있음 → 중복 가능)
     */
    const winkerUserIds = registers.map(r => r.profileWinker.userId);

    /**
     * 이 Winker 사용자들의 기본 사용자 정보(ProfileUser)를 조회
     * - 이름, 출생연도, 성별 등의 사용자 프로필 정보를 조회하기 위함
     */
    const profileUsers = await this.profileUserRepository.find({
      where: { userId: In(winkerUserIds) }
    });

    /**
     * 조회된 사용자 정보를 userId 기준으로 빠르게 접근할 수 있도록 Map 구성
     * userMap.get(userId) → ProfileUser 객체
     */
    const userMap = new Map(profileUsers.map(u => [u.userId, u]));

    /**
     * 4) depth 계산을 위한 lookup 테이블 생성
     *    - getDepthUserIds() 는 userId 목록만 반환하므로
     *      특정 userId 가 몇 depth에 있는지 알 수 없음.
     *    - getUserDepth() 를 사용해 역으로 depth 값을 계산함 (비효율적이지만 명확)
     */
    const depthLookup = new Map<number, number>();

    // 본인 depth = 0
    depthLookup.set(userId, 0);

    /**
     * depthUserIds 에 포함된 각 사용자에 대해 depth 계산
     * → originUserId(userId) 기준 BFS로 거리(depth)를 계산하여 depthLookup에 저장
     */
    for (const id of depthUserIds) {
      const depth = await this.getUserDepth(userId, id, maxDepth);
      depthLookup.set(id, depth);
    }

    /**
     * 5) 동일한 winkerUserId 를 기준으로 Register 를 그룹핑한다.
     *    - 하나의 Winker 프로필은 여러 지인(register.userId)에 의해 등록될 수 있음
     *    - winkerMap: winker.userId → { depth, winker, registers[], user }
     */
    const winkerMap = new Map<number, {
      depth: number;
      winker: ProfileWinker;
      registers: Register[];
      user: any;
    }>();

    /**
     * register 한 건씩 순회하면서 winkerMap에 그룹핑
     */
    for (const r of registers) {
      const winker = r.profileWinker;               // Winker 프로필 데이터
      const u = userMap.get(winker.userId);         // 해당 Winker 소유자의 사용자 정보
      if (!winker || !u) continue;                  // 데이터 누락 시 스킵

      /**
       * r.userId = 이 Winker 를 등록한 "지인"의 userId
       * 지인 기준으로 depth 를 찾는다.
       */
      const depth = depthLookup.get(r.userId) ?? maxDepth;

      /**
       * winker.userId 를 키로 그룹 구성
       * 처음 등장한 winker 라면 초기 엔트리 생성
       */
      if (!winkerMap.has(winker.userId)) {
        winkerMap.set(winker.userId, {
          depth,
          winker,
          user: u,
          registers: []
        });
      }

      /**
       * 이미 구성된 winker 엔트리 가져오기
       * (위에서 존재 보장)
       */
      const entry = winkerMap.get(winker.userId)!;

      /**
       * Winker 를 등록한 각각의 지인 register 정보를 저장
       */
      entry.registers.push({
        userId: r.userId,
        bio: r.bio,
        priority: r.priorityBio,
      });
    }

    /**
     * 6) 최종적으로 각 winker 정보를 DTO 로 변환하여 반환 배열 생성
     */
    const results: WinkerInDepthsResponseDto[] = [];

    for (const { depth, winker, user, registers } of winkerMap.values()) {

      /**
       * Winker 프로필 DTO 구성
       * - 이미지 우선순위 정렬
       * - 사용자 정보(ProfileUser)
       * - Winker 상세 정보
       * - 지인 register 목록
       */
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

    /**
     * depth 정보가 포함된 모든 Winker 리스트 반환
     */
    return results;
  }

  /**
   * userId 를 기준으로 BFS 탐색하여
   * 1~maxDepth 거리 안에 있는 모든 유저들의 userId 를 반환한다.
   */
  private async getDepthUserIds(userId: number, maxDepth: number): Promise<number[]> {

    // depth=0 은 본인이므로 제외. 1부터 시작해야 의미 있음.
    if (maxDepth < 1) return [];

    const targetIds = new Set<number>(); // 각 depth 단계에서 추출된 userId 고유값 저장
    const nodes = new Set<number>();   // 각 depth 단계에서 탐색할 userId 목록

    targetIds.add(userId); // 본인 포함
    nodes.add(userId); // BFS 시작점 (depth=0)

    for (let depth = 1; depth <= maxDepth; depth++) {

      // 현재 depth 에서 탐색할 userId 목록
      const currentIds = Array.from(nodes);

      // 다음 depth 탐색을 위한 nodes 초기화
      nodes.clear();
      
      const relations = await this.relationRepository.find({
        where: [
          { userMinId: In(currentIds), status: RequestStatus.ACCEPTED },
          { userMaxId: In(currentIds), status: RequestStatus.ACCEPTED },
        ],
      });

      for (const r of relations) {
        /**
         * relation(userMinId, userMaxId) 중 currentIds 에 포함된 쪽을 기준으로
         * 상대방 userId 를 nextId 로 취득
         */
        const targetId =
          currentIds.includes(r.userMinId) ? r.userMaxId : r.userMinId;

        if (targetIds.has(targetId)) continue;   // 이미 depth 에 포함된 회원 제외

        targetIds.add(targetId); // depth 기록 (중복 방지)
        nodes.add(targetId);   // 다음 depth 탐색 후보
      }

      // 더 이상 확장할 nodes 가 없다면 BFS 종료
      if (nodes.size === 0) break;
    }

    // depth 내의 모든 유저 목록 반환
    return Array.from(targetIds);
  }

  /**
   * originUserId → targetUserId 까지 이동하는 데 필요한 depth(거리)를 계산한다.
   * BFS 로 1~maxDepth 까지만 탐색하며,
   * targetUserId 를 발견하면 해당 depth 반환.
   */
  private async getUserDepth(originUserId: number, targetUserId: number, maxDepth: number): Promise<number> {

    // BFS 첫 레벨(0-depth)
    let currentIds = [originUserId];

    // 방문한 노드를 기록하여 무한 반복 방지
    const visited = new Set<number>();

    for (let depth = 1; depth <= maxDepth; depth++) {

      /**
       * 현재 depth 에서 발생 가능한 모든 ACCEPTED 관계 조회
       */
      const relations = await this.relationRepository.find({
        where: [
          { status: RequestStatus.ACCEPTED, userMinId: In(currentIds) },
          { status: RequestStatus.ACCEPTED, userMaxId: In(currentIds) }
        ]
      });

      const nextLevel = new Set<number>();

      for (const r of relations) {
        // currentIds 쪽에서 이어지는 상대 userId 찾기
        const candidate =
          currentIds.includes(r.userMinId) ? r.userMaxId : r.userMinId;

        if (!visited.has(candidate)) {
          nextLevel.add(candidate);
        }
      }

      // targetUserId 를 nextLevel 에서 발견하면 해당 depth 가 정답
      if (nextLevel.has(targetUserId)) return depth;

      // 현재 depth 를 visited 로 마킹
      for (const n of nextLevel) visited.add(n);

      // BFS 다음 depth 후보로 교체
      currentIds = Array.from(nextLevel);

      // 더 이상 확장할 노드가 없으면 종료
      if (currentIds.length === 0) break;
    }

    // 끝까지 발견되지 않았다면 maxDepth 로 처리
    return maxDepth;
  }
}
