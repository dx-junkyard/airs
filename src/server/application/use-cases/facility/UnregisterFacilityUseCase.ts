import type { IFacilityRepository } from '@/server/domain/repositories/IFacilityRepository';
import FacilityId from '@/server/domain/models/FacilityId';

/**
 * UnregisterFacilityUseCase
 *
 * 周辺施設を登録解除（論理削除）するユースケース
 */
class UnregisterFacilityUseCase {
  constructor(private repository: IFacilityRepository) {}

  async execute(id: string): Promise<boolean> {
    const facilityId = FacilityId.create(id);
    return await this.repository.softDelete(facilityId);
  }
}

export default UnregisterFacilityUseCase;
